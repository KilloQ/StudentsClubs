from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.db.database import get_db
from app.db.models import User
from app.schemas.rbac import UserRoleUpdate, UserAdminResponse
from app.api.auth import get_current_user
from app.core.permissions import require_admin

router = APIRouter()


@router.get("/users", response_model=List[UserAdminResponse])
async def list_users(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).order_by(User.id))
    users = result.scalars().all()
    return [
        UserAdminResponse(
            id=u.id,
            username=u.username,
            full_name=u.full_name,
            role=getattr(u, "role", "student") or ("teacher" if u.is_teacher else "student"),
            is_teacher=u.is_teacher,
        )
        for u in users
    ]


@router.put("/users/{user_id}/role", response_model=UserAdminResponse)
async def update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден",
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нельзя изменить свою собственную роль",
        )

    user.role = payload.role
    user.is_teacher = payload.role in ("teacher", "admin")

    await db.commit()
    await db.refresh(user)

    return UserAdminResponse(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        is_teacher=user.is_teacher,
    )
