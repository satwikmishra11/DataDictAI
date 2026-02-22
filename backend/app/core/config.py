from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "DataDictAI"
    API_V1_STR: str = "/api/v1"
    
    # Database
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "datadictai")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5433") # Local port
    SQLALCHEMY_DATABASE_URI: Optional[str] = None

    # Celery
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

    # MinIO
    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET_NAME: str = "datadict-artifacts"

    # LLM Keys
    GOOGLE_API_KEY: Optional[str] = os.getenv("GOOGLE_API_KEY")

    class Config:
        env_file = ".env"
        extra = "ignore"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.SQLALCHEMY_DATABASE_URI:
            # If we are inside docker, POSTGRES_SERVER is 'db' and port is 5432
            # If we are outside docker, POSTGRES_SERVER is 'localhost' and port is 5433
            port = "5432" if self.POSTGRES_SERVER == "db" else self.POSTGRES_PORT
            self.SQLALCHEMY_DATABASE_URI = f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{port}/{self.POSTGRES_DB}"

settings = Settings()
