import base64
import hashlib
import hmac
import time
import uuid
from pathlib import Path
from typing import Optional
from urllib.parse import urlencode

from app.core.config import settings


class StorageService:
    def __init__(self) -> None:
        self.root = Path(settings.LOCAL_STORAGE_DIR).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def build_object_key(self, club_id: int, filename: str) -> str:
        safe_name = filename.replace("\\", "_").replace("/", "_").strip()
        return f"clubs/{club_id}/{uuid.uuid4()}-{safe_name}"

    def _abs_path(self, object_key: str) -> Path:
        target = (self.root / object_key).resolve()
        if not str(target).startswith(str(self.root)):
            raise ValueError("Invalid object key")
        return target

    def upload_file(
        self,
        object_key: str,
        content: bytes,
        content_type: str,
        metadata: Optional[dict] = None,
    ) -> None:
        _ = content_type, metadata
        path = self._abs_path(object_key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)

    def delete_file(self, object_key: str) -> None:
        path = self._abs_path(object_key)
        if path.exists():
            path.unlink()

    def read_file(self, object_key: str) -> bytes:
        path = self._abs_path(object_key)
        return path.read_bytes()

    def _sign(self, object_key: str, exp: int) -> str:
        payload = f"{object_key}:{exp}".encode("utf-8")
        digest = hmac.new(settings.SECRET_KEY.encode("utf-8"), payload, hashlib.sha256).digest()
        return base64.urlsafe_b64encode(digest).decode("utf-8").rstrip("=")

    def verify_signature(self, object_key: str, exp: int, sig: str) -> bool:
        if exp < int(time.time()):
            return False
        expected = self._sign(object_key, exp)
        return hmac.compare_digest(expected, sig)

    def generate_presigned_download_url(self, object_key: str, expires_in: int = 300) -> str:
        exp = int(time.time()) + expires_in
        sig = self._sign(object_key, exp)
        query = urlencode({"key": object_key, "exp": exp, "sig": sig})
        return f"{settings.PUBLIC_API_BASE_URL}/clubs/files/content?{query}"

