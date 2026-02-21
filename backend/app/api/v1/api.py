from fastapi import APIRouter, Depends, HTTPException
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
    context = "
".join([f"Table: {m.table_name}, Summary: {m.ai_summary}" for m in metadata])
    response = AIService.answer_query(query.query, context)
    return {"response": response}
