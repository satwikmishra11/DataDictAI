from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Import tasks after app initialization to avoid circular imports
from app.services.metadata import MetadataService
from app.services.ai import AIService
from app.services.storage import StorageService
from app.db.session import SessionLocal
from app.db.models import DatabaseSource, SchemaMetadata
import json

@celery_app.task(name="app.worker.process_database_extraction")
def process_database_extraction(source_id: int):
    db = SessionLocal()
    try:
        source = db.query(DatabaseSource).filter(DatabaseSource.id == source_id).first()
        if not source:
            return

        # 1. Extract schema metadata
        schemas = MetadataService.extract_schema(source.connection_url)
        storage = StorageService()

        for schema_info in schemas:
            table_name = schema_info["table_name"]
            schema_name = schema_info["schema_name"]
            
            # 2. Profile data for the table
            try:
                profile = MetadataService.profile_data(
                    source.connection_url, 
                    schema_name, 
                    table_name
                )
            except Exception as e:
                print(f"Error profiling {table_name}: {e}")
                profile = {}

            # 3. Generate AI summary
            summary = AIService.generate_summary(schema_info)

            # 4. Save to DB
            metadata_record = db.query(SchemaMetadata).filter(
                SchemaMetadata.source_id == source_id,
                SchemaMetadata.schema_name == schema_name,
                SchemaMetadata.table_name == table_name
            ).first()

            if not metadata_record:
                metadata_record = SchemaMetadata(
                    source_id=source_id,
                    schema_name=schema_name,
                    table_name=table_name
                )
                db.add(metadata_record)

            metadata_record.columns = schema_info["columns"]
            metadata_record.relationships = schema_info["relationships"]
            metadata_record.ai_summary = summary
            metadata_record.quality_metrics = profile
            db.commit()

            # 5. Export artifact
            artifact_name = f"{source.name}/{schema_name}/{table_name}.json"
            storage.upload_json(artifact_name, {
                "metadata": schema_info,
                "profile": profile,
                "summary": summary
            })
    finally:
        db.close()
