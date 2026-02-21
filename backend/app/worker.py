import time
import logging
import math
from celery import Celery
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

# Import tasks after app initialization
from app.services.metadata import MetadataService
from app.services.ai import AIService
from app.services.storage import StorageService
from app.db.session import SessionLocal
from app.db.models import DatabaseSource, SchemaMetadata
import json

def sanitize_metrics(metrics):
    if isinstance(metrics, dict):
        return {k: sanitize_metrics(v) for k, v in metrics.items()}
    elif isinstance(metrics, list):
        return [sanitize_metrics(v) for v in metrics]
    elif isinstance(metrics, float):
        if math.isnan(metrics) or math.isinf(metrics):
            return None
    return metrics

@celery_app.task(name="app.worker.process_database_extraction")
def process_database_extraction(source_id: int):
    db = SessionLocal()
    try:
        source = db.query(DatabaseSource).filter(DatabaseSource.id == source_id).first()
        if not source:
            return

        logger.info(f"Starting extraction for source: {source.name}")
        schemas = MetadataService.extract_schema(source.connection_url)
        storage = StorageService()

        for i, schema_info in enumerate(schemas):
            table_name = schema_info["table_name"]
            schema_name = schema_info["schema_name"]
            
            # 1. Profile data
            try:
                profile = MetadataService.profile_data(source.connection_url, schema_name, table_name)
                profile = sanitize_metrics(profile)
            except Exception as e:
                logger.error(f"Error profiling {table_name}: {e}")
                profile = {}

            # 2. Generate AI summary (with fallback)
            # We add a longer delay for AI to avoid 429
            summary = "AI Summary pending (Rate limited). Metadata saved."
            if i > 0:
                time.sleep(2) # Short delay between AI calls

            try:
                summary = AIService.generate_summary(schema_info, profile_stats=profile)
            except Exception as e:
                logger.error(f"AI Summary failed for {table_name}: {e}")

            # 3. Save to DB (Metadata & Relationships)
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

            # 4. Export artifact
            try:
                artifact_name = f"{source.name}/{schema_name}/{table_name}.json"
                storage.upload_json(artifact_name, {
                    "metadata": schema_info,
                    "profile": profile,
                    "summary": summary
                })
            except:
                pass
            
            logger.info(f"Successfully processed table: {table_name}")

    finally:
        db.close()
