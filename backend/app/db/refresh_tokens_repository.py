import hashlib
from datetime import datetime, UTC
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import RefreshToken


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class RefreshTokensRepository:
    def __init__(self, db: AsyncSession):
        self._db = db

    async def get_by_hash(self, token_hash: str) -> Optional[RefreshToken]:
        result = await self._db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
        return result.scalar_one_or_none()

    async def create(
        self,
        *,
        user_id: int,
        token_hash: str,
        expires_at: datetime,
    ) -> RefreshToken:
        # Ensure datetimes are timezone-naive (Postgres TIMESTAMP WITHOUT TIME ZONE)
        if expires_at.tzinfo is not None:
            expires_at = expires_at.astimezone(UTC).replace(tzinfo=None)

        rt = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self._db.add(rt)
        await self._db.flush()
        return rt

    async def revoke(self, *, token: RefreshToken, reason: str, revoked_at: Optional[datetime] = None) -> None:
        token.revoked_reason = reason
        ra = revoked_at or datetime.now(UTC)
        if ra.tzinfo is not None:
            ra = ra.astimezone(UTC).replace(tzinfo=None)
        token.revoked_at = ra

    async def revoke_user_tokens(self, *, user_id: int, reason: str) -> None:
        ra = datetime.now(UTC)
        if ra.tzinfo is not None:
            ra = ra.astimezone(UTC).replace(tzinfo=None)
        await self._db.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id)
            .where(RefreshToken.revoked_at.is_(None))
            .values(revoked_at=ra, revoked_reason=reason)
        )

