from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class DatabaseSource(Base):
    __tablename__ = "database_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    db_type = Column(String)  # snowflake, postgres, etc.
    connection_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    schemas = relationship("SchemaMetadata", back_populates="source")

class SchemaMetadata(Base):
    __tablename__ = "schema_metadata"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("database_sources.id"))
    schema_name = Column(String)
    table_name = Column(String)
    columns = Column(JSON)  # List of column definitions
    relationships = Column(JSON) # Table relationships
    ai_summary = Column(Text)
    quality_metrics = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    source = relationship("DatabaseSource", back_populates="schemas")
