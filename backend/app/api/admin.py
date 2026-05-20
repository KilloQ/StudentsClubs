from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from typing import List

from app.db.database import get_db
from app.db.models import User, Club, ClubCategory
from app.schemas.rbac import UserRoleUpdate, UserAdminResponse
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse, CategoryReorder
from app.api.auth import get_current_user
from app.core.permissions import require_admin
from app.services.club_category_service import count_clubs_in_category

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


@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ClubCategory).order_by(ClubCategory.sort_order.asc(), ClubCategory.id.asc())
    )
    return result.scalars().all()


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: CategoryCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    name = payload.name.strip()
    if name == "Все":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Название «Все» зарезервировано для фильтра каталога",
        )

    existing = await db.execute(select(ClubCategory).where(ClubCategory.name == name))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Категория с таким названием уже существует",
        )

    max_order_result = await db.execute(select(func.max(ClubCategory.sort_order)))
    max_order = max_order_result.scalar_one() or 0

    category = ClubCategory(name=name, sort_order=max_order + 1)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.put("/categories/reorder", response_model=List[CategoryResponse])
async def reorder_categories(
    payload: CategoryReorder,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ClubCategory))
    categories_by_id = {c.id: c for c in result.scalars().all()}

    if set(payload.ordered_ids) != set(categories_by_id.keys()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Список категорий не совпадает с текущим набором",
        )

    for index, category_id in enumerate(payload.ordered_ids):
        categories_by_id[category_id].sort_order = index + 1

    await db.commit()

    ordered = [categories_by_id[cid] for cid in payload.ordered_ids]
    for category in ordered:
        await db.refresh(category)
    return ordered


@router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    payload: CategoryUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ClubCategory).where(ClubCategory.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Категория не найдена")

    old_name = category.name

    if payload.name is not None:
        new_name = payload.name.strip()
        if new_name == "Все":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Название «Все» зарезервировано для фильтра каталога",
            )
        if new_name != old_name:
            duplicate = await db.execute(
                select(ClubCategory).where(ClubCategory.name == new_name, ClubCategory.id != category_id)
            )
            if duplicate.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Категория с таким названием уже существует",
                )
            category.name = new_name
            await db.execute(
                update(Club).where(Club.category == old_name).values(category=new_name)
            )

    await db.commit()
    await db.refresh(category)
    return category


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ClubCategory).where(ClubCategory.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Категория не найдена")

    clubs_count = await count_clubs_in_category(db, category.name)
    if clubs_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Нельзя удалить категорию: к ней привязано кружков — {clubs_count}",
        )

    await db.delete(category)
    await db.commit()
    return None
