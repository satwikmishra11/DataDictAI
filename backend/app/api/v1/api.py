from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.session import SessionLocal
from app.db.models import DatabaseSource, SchemaMetadata
from pydantic import BaseModel
from typing import List, Optional
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
    # Check for duplicate name
    existing = db.query(DatabaseSource).filter(DatabaseSource.name == source.name).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"A bridge with the name '{source.name}' already exists. Please choose a unique label.")
    
    db_source = DatabaseSource(**source.dict())
    db.add(db_source)
    db.commit()
    db.refresh(db_source)
    # Trigger async extraction
    process_database_extraction.delay(db_source.id)
    return db_source

@router.post("/sync/{source_id}")
def sync_source(source_id: int, db: Session = Depends(get_db)):
    source = db.query(DatabaseSource).filter(DatabaseSource.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    
    # Trigger re-extraction
    process_database_extraction.delay(source.id)
    return {"message": f"Sync triggered for '{source.name}'. Documentation will be updated in a few moments."}

@router.get("/sources")
def list_sources(db: Session = Depends(get_db)):
    return db.query(DatabaseSource).all()

@router.delete("/sources/{source_id}")
def delete_source(source_id: int, db: Session = Depends(get_db)):
    source = db.query(DatabaseSource).filter(DatabaseSource.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    
    # Delete associated metadata first (cascading)
    db.query(SchemaMetadata).filter(SchemaMetadata.source_id == source_id).delete()
    db.delete(source)
    db.commit()
    return {"message": "Source and associated metadata deleted successfully"}

@router.get("/schema/{source_id}")
def get_schema(source_id: int, db: Session = Depends(get_db)):
    return db.query(SchemaMetadata).filter(SchemaMetadata.source_id == source_id).all()

@router.get("/search")
def search_metadata(q: str = Query(...), db: Session = Depends(get_db)):
    # Search in table names and AI summaries
    results = db.query(SchemaMetadata).filter(
        or_(
            SchemaMetadata.table_name.ilike(f"%{q}%"),
            SchemaMetadata.ai_summary.ilike(f"%{q}%")
        )
    ).all()
    return results

@router.post("/chat")
def chat(query: ChatQuery, db: Session = Depends(get_db)):
    try:
        metadata = db.query(SchemaMetadata).all()
        context = "\n".join([f"Table: {m.table_name}, Summary: {m.ai_summary}" for m in metadata])
        response = AIService.answer_query(query.query, context)
        return {"response": response}
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            return {"response": "⚠️ **Gemini Free Tier Limit Reached.** I am currently rate-limited by Google. Please wait about 30-60 seconds and try your question again."}
        return {"response": f"AI Assistant encountered an error: {error_msg}. Please check your API key or try again later."}

@router.post("/sql")
def generate_sql(query: ChatQuery, db: Session = Depends(get_db)):
    try:
        metadata = db.query(SchemaMetadata).all()
        context = "\n".join([f"Table: {m.table_name}, Columns: {m.columns}, Relationships: {m.relationships}" for m in metadata])
        response = AIService.generate_sql(query.query, context)
        return {"response": response}
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            return {"response": "-- AI Quota Reached. Please wait 60 seconds before generating more SQL."}
        return {"response": f"-- AI Error: {error_msg}"}

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
    all_metadata = db.query(SchemaMetadata).all()
    tables_count = len(all_metadata)
    
    pii_count = 0
    total_null_rate = 0
    total_cols = 0
    
    for table in all_metadata:
        # PII Detection
        for col in (table.columns or []):
            if col.get("tags") and len(col["tags"]) > 0:
                pii_count += 1
        
        # Health Calculation (100 - average null rate)
        if table.quality_metrics:
            for col_name, stats in table.quality_metrics.items():
                total_null_rate += stats.get("null_rate", 0)
                total_cols += 1
                
    avg_null_rate = (total_null_rate / total_cols * 100) if total_cols > 0 else 0
    health_score = round(100 - avg_null_rate, 1)
                
    return {
        "sources": sources_count,
        "tables": tables_count,
        "pii_columns": pii_count,
        "health_score": health_score
    }
