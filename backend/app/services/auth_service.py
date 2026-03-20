import bcrypt
import secrets
from datetime import datetime, timedelta
from typing import Tuple

from jose import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models import User
from app.db.refresh_tokens_repository import RefreshTokensRepository, hash_refresh_token
from app.schemas.auth import LogoutResponse, Token


class AuthService:
    def __init__(self, db: AsyncSession):
        self._db = db
        self._refresh_tokens_repo = RefreshTokensRepository(db)

    @staticmethod
    def _get_password_hash(password: str) -> str:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
        return hashed.decode("utf-8")

    @staticmethod
    def _verify_password(plain_password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

    def _create_access_token(self, *, user: User) -> str:
        role = getattr(user, "role", None) or ("teacher" if user.is_teacher else "student")
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {
            "type": "access",
            "sub": str(user.id),
            "username": user.username,
            "user_role": role,
            "is_teacher": bool(user.is_teacher),
            "exp": expire,
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    def _create_refresh_token(self) -> Tuple[str, datetime]:
        token = secrets.token_urlsafe(48)
        expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        return token, expires_at

    async def login(self, *, username: str, password: str) -> Token:
        result = await self._db.execute(select(User).where(User.username == username))
        user = result.scalar_one_or_none()

        if not user or not self._verify_password(password, user.password_hash):
            raise ValueError("Invalid credentials")

        access_token = self._create_access_token(user=user)
        refresh_token, expires_at = self._create_refresh_token()
        token_hash = hash_refresh_token(refresh_token)

        await self._refresh_tokens_repo.create(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        await self._db.commit()

        return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer")

    async def refresh(self, *, refresh_token: str) -> Token:
        token_hash = hash_refresh_token(refresh_token)
        db_token = await self._refresh_tokens_repo.get_by_hash(token_hash)

        if not db_token:
            raise ValueError("Invalid refresh token")

        now = datetime.utcnow()

        if db_token.revoked_at is not None:
            await self._refresh_tokens_repo.revoke_user_tokens(
                user_id=db_token.user_id,
                reason="refresh_token_reuse",
            )
            await self._db.commit()
            raise ValueError("Refresh token reuse detected")

        if db_token.expires_at <= now:
            await self._refresh_tokens_repo.revoke(
                token=db_token,
                reason="refresh_token_expired",
            )
            await self._db.commit()
            raise ValueError("Refresh token expired")

        await self._refresh_tokens_repo.revoke(
            token=db_token,
            reason="refresh_token_rotated",
            revoked_at=now,
        )

        refresh_new, expires_at = self._create_refresh_token()
        token_hash_new = hash_refresh_token(refresh_new)
        await self._refresh_tokens_repo.create(
            user_id=db_token.user_id,
            token_hash=token_hash_new,
            expires_at=expires_at,
        )

        user_result = await self._db.execute(select(User).where(User.id == db_token.user_id))
        user = user_result.scalar_one_or_none()
        if not user:
            await self._db.rollback()
            raise ValueError("User not found")

        access_token = self._create_access_token(user=user)

        await self._db.commit()
        return Token(access_token=access_token, refresh_token=refresh_new, token_type="bearer")

    async def logout(self, *, refresh_token: str) -> LogoutResponse:
        token_hash = hash_refresh_token(refresh_token)
        db_token = await self._refresh_tokens_repo.get_by_hash(token_hash)

        if db_token:
            now = datetime.utcnow()
            await self._refresh_tokens_repo.revoke(
                token=db_token,
                reason="logout",
                revoked_at=now,
            )
            await self._refresh_tokens_repo.revoke_user_tokens(
                user_id=db_token.user_id,
                reason="logout",
            )
            await self._db.commit()

        return LogoutResponse(message="Logged out")

