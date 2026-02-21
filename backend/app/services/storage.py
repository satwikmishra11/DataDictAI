from minio import Minio
from app.core.config import settings
import io
import json

class StorageService:
    def __init__(self):
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=False
        )
        self._ensure_bucket()

    def _ensure_bucket(self):
        if not self.client.bucket_exists(settings.MINIO_BUCKET_NAME):
            self.client.make_bucket(settings.MINIO_BUCKET_NAME)

    def upload_json(self, name: str, data: dict):
        content = json.dumps(data, indent=2).encode('utf-8')
        self.client.put_object(
            settings.MINIO_BUCKET_NAME,
            name,
            io.BytesIO(content),
            len(content),
            content_type='application/json'
        )

    def upload_markdown(self, name: str, content: str):
        content_bytes = content.encode('utf-8')
        self.client.put_object(
            settings.MINIO_BUCKET_NAME,
            name,
            io.BytesIO(content_bytes),
            len(content_bytes),
            content_type='text/markdown'
        )
