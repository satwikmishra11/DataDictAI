from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db.models import DatabaseSource, SchemaMetadata
from pydantic import BaseModel
from typing import List
from app.worker import process_database_extraction
from app.services.ai import AIService

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class SourceCreate(BaseModel):
    name: str
    db_type: str
    connection_url: str

class ChatQuery(BaseModel):
    query: str

@router.post("/sources")
def create_source(source: SourceCreate, db: Session = Depends(get_db)):
    db_source = DatabaseSource(**source.dict())
    db.add(db_source)
    db.commit()
    db.refresh(db_source)
    # Trigger async extraction
    process_database_extraction.delay(db_source.id)
    return db_source

@router.get("/sources")
def list_sources(db: Session = Depends(get_db)):
    return db.query(DatabaseSource).all()

@router.get("/schema/{source_id}")
def get_schema(source_id: int, db: Session = Depends(get_db)):
    return db.query(SchemaMetadata).filter(SchemaMetadata.source_id == source_id).all()

@router.post("/chat")
def chat(query: ChatQuery, db: Session = Depends(get_db)):
    # Simple context: all table names and their summaries
    metadata = db.query(SchemaMetadata).all()
    context = "\n".join([f"Table: {m.table_name}, Summary: {m.ai_summary}" for m in metadata])
    response = AIService.answer_query(query.query, context)
    return {"response": response}

@router.post("/sql")
def generate_sql(query: ChatQuery, db: Session = Depends(get_db)):
    # Context needs to include columns for accurate SQL
    metadata = db.query(SchemaMetadata).all()
    context = "\n".join([f"Table: {m.table_name}, Columns: {m.columns}, Relationships: {m.relationships}" for m in metadata])
    response = AIService.generate_sql(query.query, context)
    return {"response": response}

@router.get("/export/{source_id}/markdown")
def export_markdown(source_id: int, db: Session = Depends(get_db)):
    source = db.query(DatabaseSource).filter(DatabaseSource.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
        
    metadata = db.query(SchemaMetadata).filter(SchemaMetadata.source_id == source_id).all()
    
    md_content = f"# Data Dictionary: {source.name}\n\n"
    md_content += f"**Database Type:** {source.db_type}\n"
    md_content += f"**Generated:** {source.created_at}\n\n"
    
    for table in metadata:
        md_content += f"## Table: {table.table_name}\n\n"
        md_content += f"### Summary\n{table.ai_summary}\n\n"
        md_content += "### Columns\n"
        md_content += "| Name | Type | Tags |\n|------|------|------|\n"
        for col in (table.columns or []):
            tags = ", ".join(col.get("tags", []))
            md_content += f"| {col['name']} | {col['type']} | {tags} |\n"
        md_content += "\n---\n\n"
        
    return Response(content=md_content, media_type="text/markdown", headers={"Content-Disposition": f"attachment; filename={source.name}_dictionary.md"})

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    sources_count = db.query(DatabaseSource).count()
    tables_count = db.query(SchemaMetadata).count()
    
    # Count PII columns across all tables
    pii_count = 0
    all_metadata = db.query(SchemaMetadata).all()
    for table in all_metadata:
        for col in (table.columns or []):
            if col.get("tags") and len(col["tags"]) > 0:
                pii_count += 1
                
    return {
        "sources": sources_count,
        "tables": tables_count,
        "pii_columns": pii_count,
        "health_score": 98.5 # Placeholder for complex logic
    }
