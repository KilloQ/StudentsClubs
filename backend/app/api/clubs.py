from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from app.db.database import get_db
from app.db.models import Club, User, ClubMembership, Schedule
from app.schemas.club import ClubCreate, ClubResponse, ClubDetailResponse, ScheduleCreate
from app.api.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[ClubResponse])
async def get_clubs(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Club).options(selectinload(Club.schedules))
    if category and category != "Все":
        query = query.where(Club.category == category)
    
    result = await db.execute(query)
    clubs = result.scalars().all()
    
    # Преобразуем в список словарей для сериализации
    clubs_list = []
    for club in clubs:
        club_dict = {
            "id": club.id,
            "title": club.title,
            "description": club.description,
            "category": club.category,
            "max_students": club.max_students,
            "recruitment_open": club.recruitment_open,
            "image_url": club.image_url,
            "owner_id": club.owner_id,
            "schedules": [
                {
                    "id": s.id,
                    "day_of_week": s.day_of_week,
                    "start_time": s.start_time.strftime("%H:%M"),
                    "location": s.location
                }
                for s in club.schedules
            ]
        }
        clubs_list.append(club_dict)
    
    return clubs_list


@router.get("/{club_id}", response_model=ClubDetailResponse)
async def get_club(
    club_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Club).options(selectinload(Club.schedules)).where(Club.id == club_id)
    )
    club = result.scalar_one_or_none()
    
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Кружок не найден"
        )
    
    # Получаем количество студентов
    members_count = await db.execute(
        select(func.count(ClubMembership.id)).where(ClubMembership.club_id == club_id)
    )
    current_students = members_count.scalar() or 0
    
    # Получаем имя преподавателя
    owner_result = await db.execute(select(User).where(User.id == club.owner_id))
    owner = owner_result.scalar_one()
    
    # Проверяем, является ли текущий пользователь членом кружка
    is_member = False
    if not current_user.is_teacher:
        membership_check = await db.execute(
            select(ClubMembership).where(
                and_(
                    ClubMembership.club_id == club_id,
                    ClubMembership.student_id == current_user.id
                )
            )
        )
        is_member = membership_check.scalar_one_or_none() is not None
    
    # Преобразуем расписание в нужный формат
    schedules_list = [
        {
            "id": s.id,
            "day_of_week": s.day_of_week,
            "start_time": s.start_time.strftime("%H:%M"),
            "location": s.location
        }
        for s in club.schedules
    ]
    
    club_dict = {
        "id": club.id,
        "title": club.title,
        "description": club.description,
        "category": club.category,
        "max_students": club.max_students,
        "recruitment_open": club.recruitment_open,
        "image_url": club.image_url,
        "owner_id": club.owner_id,
        "current_students": current_students,
        "owner_name": owner.full_name,
        "schedules": schedules_list,
        "is_member": is_member
    }
    
    return ClubDetailResponse(**club_dict)


@router.post("/", response_model=ClubResponse)
async def create_club(
    club_data: ClubCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.is_teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только преподаватели могут создавать кружки"
        )
    
    new_club = Club(
        title=club_data.title,
        description=club_data.description,
        category=club_data.category,
        max_students=club_data.max_students,
        image_url=club_data.image_url,
        owner_id=current_user.id,
        recruitment_open=True
    )
    
    db.add(new_club)
    await db.commit()
    await db.refresh(new_club, ["schedules"])
    
    # Преобразуем в словарь для сериализации
    club_dict = {
        "id": new_club.id,
        "title": new_club.title,
        "description": new_club.description,
        "category": new_club.category,
        "max_students": new_club.max_students,
        "recruitment_open": new_club.recruitment_open,
        "image_url": new_club.image_url,
        "owner_id": new_club.owner_id,
        "schedules": [
            {
                "id": s.id,
                "day_of_week": s.day_of_week,
                "start_time": s.start_time.strftime("%H:%M"),
                "location": s.location
            }
            for s in new_club.schedules
        ]
    }
    
    return club_dict


@router.post("/{club_id}/join")
async def join_club(
    club_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.is_teacher:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Преподаватели не могут записываться на кружки"
        )
    
    # Проверяем, существует ли кружок
    result = await db.execute(select(Club).where(Club.id == club_id))
    club = result.scalar_one_or_none()
    
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Кружок не найден"
        )
    
    if not club.recruitment_open:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Набор в кружок закрыт"
        )
    
    # Проверяем, не состоит ли уже студент в кружке
    existing_membership = await db.execute(
        select(ClubMembership).where(
            and_(
                ClubMembership.club_id == club_id,
                ClubMembership.student_id == current_user.id
            )
        )
    )
    if existing_membership.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Вы уже записаны на этот кружок"
        )
    
    # Проверяем, не превышен ли лимит студентов
    members_count = await db.execute(
        select(func.count(ClubMembership.id)).where(ClubMembership.club_id == club_id)
    )
    current_students = members_count.scalar() or 0
    
    if current_students >= club.max_students:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Кружок переполнен"
        )
    
    # Создаем членство
    from datetime import date
    new_membership = ClubMembership(
        club_id=club_id,
        student_id=current_user.id,
        joined_at=date.today()
    )
    
    db.add(new_membership)
    await db.commit()
    
    return {"message": "Вы успешно записались на кружок"}


@router.delete("/{club_id}/leave")
async def leave_club(
    club_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.is_teacher:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Преподаватели не могут покидать кружки"
        )
    
    # Проверяем, состоит ли студент в кружке
    membership_result = await db.execute(
        select(ClubMembership).where(
            and_(
                ClubMembership.club_id == club_id,
                ClubMembership.student_id == current_user.id
            )
        )
    )
    membership = membership_result.scalar_one_or_none()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Вы не состоите в этом кружке"
        )
    
    # Удаляем членство
    await db.delete(membership)
    await db.commit()
    
    return {"message": "Вы успешно покинули кружок"}


@router.delete("/{club_id}/leave")
async def leave_club(
    club_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.is_teacher:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Преподаватели не могут покидать кружки"
        )
    
    # Проверяем, состоит ли студент в кружке
    membership_result = await db.execute(
        select(ClubMembership).where(
            and_(
                ClubMembership.club_id == club_id,
                ClubMembership.student_id == current_user.id
            )
        )
    )
    membership = membership_result.scalar_one_or_none()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Вы не состоите в этом кружке"
        )
    
    # Удаляем членство
    await db.delete(membership)
    await db.commit()
    
    return {"message": "Вы успешно покинули кружок"}


@router.get("/categories/list", response_model=List[str])
async def get_categories():
    return [
        "Все",
        "Спортивные",
        "Творчество",
        "Точные науки",
        "Инжиниринг",
        "БПЛА",
        "Информационная безопасность",
        "Связь",
        "Программирование"
    ]
