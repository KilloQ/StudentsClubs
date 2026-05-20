from fastapi import HTTPException, status
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Club, ClubCategory


async def list_category_names(db: AsyncSession) -> list[str]:
    result = await db.execute(
        select(ClubCategory.name).order_by(ClubCategory.sort_order.asc(), ClubCategory.id.asc())
    )
    names = list(result.scalars().all())
    return ["Все", *names]


async def ensure_category_exists(db: AsyncSession, name: str) -> None:
    if not name or name.strip() == "Все":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Укажите существующую категорию кружка",
        )
    result = await db.execute(select(ClubCategory).where(ClubCategory.name == name))
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Категория не найдена. Выберите категорию из списка.",
        )


async def count_clubs_in_category(db: AsyncSession, name: str) -> int:
    result = await db.execute(select(func.count()).select_from(Club).where(Club.category == name))
    return result.scalar_one() or 0
