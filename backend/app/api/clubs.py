from datetime import date
from typing import List, Optional, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.db.models import Club, User, ClubMembership, ClubFile
from app.schemas.club import (
    ClubCreate,
    ClubResponse,
    ClubDetailResponse,
    ClubListResponse,
    ClubUpdate,
    ClubFileResponse,
    ClubFileUploadResponse,
    ClubFileDownloadResponse,
)
from app.api.auth import get_current_user
from app.core.permissions import require_permission, Permission
from app.core.config import settings
from app.services.storage_service import StorageService

router = APIRouter()
_storage: Optional[StorageService] = None


def get_storage() -> StorageService:
    global _storage
    if _storage is None:
        _storage = StorageService()
    return _storage


def _club_to_response(club: Club) -> dict:
    return {
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
                "location": s.location,
            }
            for s in club.schedules
        ],
    }


@router.get("/", response_model=ClubListResponse)
async def get_clubs(
    category: Optional[str] = Query(default=None, max_length=80),
    search: Optional[str] = Query(default=None, min_length=1, max_length=120),
    recruitment_open: Optional[bool] = None,
    min_max_students: Optional[int] = Query(default=None, ge=0, le=10000),
    sort_by: Literal["title", "category", "max_students", "id"] = "id",
    sort_order: Literal["asc", "desc"] = "desc",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    query = select(Club).options(selectinload(Club.schedules))
    if category and category != "Все":
        query = query.where(Club.category == category)
    if recruitment_open is not None:
        query = query.where(Club.recruitment_open == recruitment_open)
    if min_max_students is not None:
        query = query.where(Club.max_students >= min_max_students)
    if search:
        term = f"%{search.strip()}%"
        query = query.where(
            or_(
                Club.title.ilike(term),
                Club.description.ilike(term),
                Club.category.ilike(term),
            )
        )

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    sort_column = {
        "title": Club.title,
        "category": Club.category,
        "max_students": Club.max_students,
        "id": Club.id,
    }[sort_by]
    query = query.order_by(sort_column.asc() if sort_order == "asc" else sort_column.desc())

    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    clubs = result.scalars().unique().all()

    return {
        "items": [_club_to_response(club) for club in clubs],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


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
    
    members_count = await db.execute(
        select(func.count(ClubMembership.id)).where(ClubMembership.club_id == club_id)
    )
    current_students = members_count.scalar() or 0
    
    owner_result = await db.execute(select(User).where(User.id == club.owner_id))
    owner = owner_result.scalar_one()
    
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
    
    club_dict = _club_to_response(club)
    club_dict["current_students"] = current_students
    club_dict["owner_name"] = owner.full_name
    club_dict["is_member"] = is_member
    
    return ClubDetailResponse(**club_dict)


@router.post("/", response_model=ClubResponse)
async def create_club(
    club_data: ClubCreate,
    current_user: User = Depends(require_permission(Permission.CLUB_CREATE)),
    db: AsyncSession = Depends(get_db)
):
    
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
    
    return _club_to_response(new_club)


@router.put("/{club_id}", response_model=ClubResponse)
async def update_club(
    club_id: int,
    club_data: ClubUpdate,
    current_user: User = Depends(require_permission(Permission.CLUB_UPDATE)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Club).options(selectinload(Club.schedules)).where(Club.id == club_id)
    )
    club = result.scalar_one_or_none()
    if not club:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Кружок не найден")

    if current_user.role != "admin" and club.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Недостаточно прав")

    for field in ("title", "description", "category", "image_url", "max_students", "recruitment_open"):
        value = getattr(club_data, field)
        if value is not None:
            setattr(club, field, value)

    await db.commit()
    await db.refresh(club, ["schedules"])
    return _club_to_response(club)


@router.delete("/{club_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_club(
    club_id: int,
    current_user: User = Depends(require_permission(Permission.CLUB_DELETE)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Club).where(Club.id == club_id))
    club = result.scalar_one_or_none()
    if not club:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Кружок не найден")

    if current_user.role != "admin" and club.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Недостаточно прав")

    await db.delete(club)
    await db.commit()
    return None


@router.post("/{club_id}/join")
async def join_club(
    club_id: int,
    current_user: User = Depends(require_permission(Permission.MEMBERSHIP_JOIN)),
    db: AsyncSession = Depends(get_db)
):
    
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
    current_user: User = Depends(require_permission(Permission.MEMBERSHIP_LEAVE)),
    db: AsyncSession = Depends(get_db)
):
    
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


@router.get("/{club_id}/files", response_model=List[ClubFileResponse])
async def get_club_files(
    club_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    club_exists = await db.execute(select(Club.id).where(Club.id == club_id))
    if club_exists.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Кружок не найден")

    files_result = await db.execute(select(ClubFile).where(ClubFile.club_id == club_id).order_by(ClubFile.id.desc()))
    files = files_result.scalars().all()
    return [
        {
            "id": f.id,
            "club_id": f.club_id,
            "original_name": f.original_name,
            "content_type": f.content_type,
            "size_bytes": f.size_bytes,
            "created_at": f.created_at.isoformat(),
            "uploaded_by": f.uploaded_by,
        }
        for f in files
    ]


@router.post("/{club_id}/files", response_model=ClubFileUploadResponse)
async def upload_club_file(
    club_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(require_permission(Permission.CLUB_UPDATE)),
    db: AsyncSession = Depends(get_db),
):
    club_result = await db.execute(select(Club).where(Club.id == club_id))
    club = club_result.scalar_one_or_none()
    if not club:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Кружок не найден")

    if current_user.role != "admin" and club.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Недостаточно прав")

    allowed_types = {v.strip() for v in settings.FILE_ALLOWED_CONTENT_TYPES.split(",") if v.strip()}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Недопустимый тип файла")

    payload = await file.read()
    if len(payload) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Файл не должен быть пустым")
    if len(payload) > settings.FILE_MAX_SIZE_BYTES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Файл превышает допустимый размер")

    storage = get_storage()
    object_key = storage.build_object_key(club_id, file.filename or "file")
    storage.upload_file(
        object_key=object_key,
        content=payload,
        content_type=file.content_type or "application/octet-stream",
        metadata={"uploaded_by": str(current_user.id), "club_id": str(club_id)},
    )

    club_file = ClubFile(
        club_id=club_id,
        uploaded_by=current_user.id,
        original_name=file.filename or "file",
        object_key=object_key,
        content_type=file.content_type or "application/octet-stream",
        size_bytes=len(payload),
    )
    db.add(club_file)
    await db.commit()
    await db.refresh(club_file)

    return {
        "id": club_file.id,
        "club_id": club_file.club_id,
        "original_name": club_file.original_name,
        "content_type": club_file.content_type,
        "size_bytes": club_file.size_bytes,
        "created_at": club_file.created_at.isoformat(),
        "uploaded_by": club_file.uploaded_by,
        "download_url": get_storage().generate_presigned_download_url(club_file.object_key),
    }


@router.get("/{club_id}/files/{file_id}/download", response_model=ClubFileDownloadResponse)
async def get_file_download_url(
    club_id: int,
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    file_result = await db.execute(
        select(ClubFile).where(and_(ClubFile.id == file_id, ClubFile.club_id == club_id))
    )
    club_file = file_result.scalar_one_or_none()
    if not club_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Файл не найден")

    return {"download_url": get_storage().generate_presigned_download_url(club_file.object_key)}


@router.delete("/{club_id}/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    club_id: int,
    file_id: int,
    current_user: User = Depends(require_permission(Permission.CLUB_UPDATE)),
    db: AsyncSession = Depends(get_db),
):
    file_result = await db.execute(
        select(ClubFile).where(and_(ClubFile.id == file_id, ClubFile.club_id == club_id))
    )
    club_file = file_result.scalar_one_or_none()
    if not club_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Файл не найден")

    club_result = await db.execute(select(Club).where(Club.id == club_id))
    club = club_result.scalar_one_or_none()
    if not club:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Кружок не найден")

    if current_user.role != "admin" and club.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Недостаточно прав")

    get_storage().delete_file(club_file.object_key)
    await db.delete(club_file)
    await db.commit()
    return None


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
