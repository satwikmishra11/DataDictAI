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
from app.db.models import DatabaseSource, SchemaMetadata, MetricHistory, Alert
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

def generate_table_markdown(table_name, schema_info, profile, summary):
    md = f"# Table: {table_name}\n\n"
    md += f"## AI Summary & Recommendations\n{summary}\n\n"
    
    md += "## Column Metadata\n"
    md += "| Name | Type | Tags | Completeness | Uniqueness |\n"
    md += "|------|------|------|--------------|------------|\n"
    
    for col in schema_info.get("columns", []):
        name = col["name"]
        p = profile.get(name, {})
        comp = f"{p.get('completeness', 0)*100:.1f}%"
        uniq = f"{p.get('uniqueness_rate', 0)*100:.1f}%"
        tags = ", ".join(col.get("tags", []))
        md += f"| {name} | {col['type']} | {tags} | {comp} | {uniq} |\n"
    
    md += "\n## Data Quality Details\n"
    for col_name, stats in profile.items():
        if col_name == "_status": continue
        md += f"### Column: {col_name}\n"
        md += "```json\n" + json.dumps(stats, indent=2) + "\n```\n"
        
    return md

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
                time.sleep(1) # Short delay between AI calls

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

            if metadata_record:
                # Save history before updating
                if metadata_record.quality_metrics:
                    history = MetricHistory(
                        metadata_id=metadata_record.id,
                        metrics=metadata_record.quality_metrics
                    )
                    db.add(history)
            else:
                metadata_record = SchemaMetadata(
                    source_id=source_id,
                    schema_name=schema_name,
                    table_name=table_name
                )
                db.add(metadata_record)
                db.flush() # Get ID

            metadata_record.columns = schema_info["columns"]
            metadata_record.relationships = schema_info["relationships"]
            metadata_record.ai_summary = summary
            metadata_record.quality_metrics = profile
            
            # Generate Alerts
            for col_name, stats in profile.items():
                if isinstance(stats, dict) and 'completeness' in stats:
                    comp = stats['completeness']
                    if comp < 0.8:
                        alert = Alert(
                            metadata_id=metadata_record.id,
                            alert_type="completeness",
                            message=f"Column '{col_name}' in {table_name} has low completeness ({comp*100:.1f}%)",
                            severity="medium"
                        )
                        db.add(alert)
            
            db.commit()

            # 4. Export artifacts (JSON & Markdown)
            try:
                # JSON Artifact
                json_artifact_name = f"{source.name}/{schema_name}/{table_name}.json"
                storage.upload_json(json_artifact_name, {
                    "metadata": schema_info,
                    "profile": profile,
                    "summary": summary
                })
                
                # Markdown Artifact
                md_content = generate_table_markdown(table_name, schema_info, profile, summary)
                md_artifact_name = f"{source.name}/{schema_name}/{table_name}.md"
                storage.upload_markdown(md_artifact_name, md_content)
                
            except Exception as e:
                logger.error(f"Artifact upload failed for {table_name}: {e}")
            
            logger.info(f"Successfully processed table: {table_name}")

    finally:
        db.close()
