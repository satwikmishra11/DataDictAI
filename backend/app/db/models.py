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
    history = relationship("MetricHistory", back_populates="metadata_item")
    alerts = relationship("Alert", back_populates="metadata_item")

class MetricHistory(Base):
    __tablename__ = "metric_history"

    id = Column(Integer, primary_key=True, index=True)
    metadata_id = Column(Integer, ForeignKey("schema_metadata.id"))
    metrics = Column(JSON)
    captured_at = Column(DateTime, default=datetime.utcnow)

    metadata_item = relationship("SchemaMetadata", back_populates="history")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    metadata_id = Column(Integer, ForeignKey("schema_metadata.id"))
    alert_type = Column(String) # completeness, freshness, schema_change
    message = Column(String)
    severity = Column(String) # low, medium, high
    is_resolved = Column(Integer, default=0) # 0 or 1 (boolean)
    created_at = Column(DateTime, default=datetime.utcnow)

    metadata_item = relationship("SchemaMetadata", back_populates="alerts")
