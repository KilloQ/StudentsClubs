from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import RedirectResponse
from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user, get_current_user_optional
from app.core.config import settings
from app.core.permissions import require_teacher
from app.db.database import get_db
from app.db.models import Announcement, AnnouncementLike, Club, User
from app.schemas.announcement import AnnouncementCreateForm, AnnouncementListResponse, AnnouncementResponse
from app.services.storage_service import StorageService

router = APIRouter()
_storage: Optional[StorageService] = None


def get_storage() -> StorageService:
    global _storage
    if _storage is None:
        _storage = StorageService()
    return _storage


def resolve_image_url(announcement: Announcement) -> str:
    if announcement.image_url.startswith(("http://", "https://")):
        return announcement.image_url
    return f"{settings.PUBLIC_API_BASE_URL.rstrip('/')}/announcements/{announcement.id}/image"


async def get_announcement_or_404(announcement_id: int, db: AsyncSession) -> Announcement:
    result = await db.execute(select(Announcement).where(Announcement.id == announcement_id))
    announcement = result.scalar_one_or_none()
    if not announcement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Объявление не найдено")
    return announcement


async def verify_club_owner_or_admin(club_id: int, user: User, db: AsyncSession) -> Club:
    result = await db.execute(select(Club).where(Club.id == club_id))
    club = result.scalar_one_or_none()
    if not club:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Кружок не найден")
    if user.role != "admin" and club.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Недостаточно прав")
    return club


@router.post("/", response_model=AnnouncementResponse)
async def create_announcement(
    club_id: int = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    image: UploadFile = File(...),
    current_user: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db),
):
    form = AnnouncementCreateForm(club_id=club_id, title=title.strip(), description=description.strip())
    club = await verify_club_owner_or_admin(form.club_id, current_user, db)

    if image.content_type not in {"image/jpeg", "image/png"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Допустимы только JPG и PNG")

    payload = await image.read()
    if len(payload) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Файл не должен быть пустым")
    if len(payload) > settings.FILE_MAX_SIZE_BYTES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Файл превышает допустимый размер")

    storage = get_storage()
    object_key = storage.build_object_key(form.club_id, image.filename or "announcement")
    storage.upload_file(
        object_key=object_key,
        content=payload,
        content_type=image.content_type,
        metadata={"uploaded_by": str(current_user.id), "club_id": str(form.club_id), "kind": "announcement"},
    )

    announcement = Announcement(
        club_id=form.club_id,
        author_id=current_user.id,
        title=form.title,
        description=form.description,
        image_url=object_key,
    )
    db.add(announcement)
    await db.commit()
    await db.refresh(announcement)

    return AnnouncementResponse(
        id=announcement.id,
        club_id=announcement.club_id,
        club_title=club.title,
        title=announcement.title,
        description=announcement.description,
        image_url=resolve_image_url(announcement),
        author_id=current_user.id,
        author_name=current_user.full_name,
        created_at=announcement.created_at.isoformat(),
        likes_count=0,
        liked_by_me=False,
    )


@router.get("/", response_model=AnnouncementListResponse)
async def list_announcements(
    club_id: Optional[int] = Query(default=None, ge=1),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    likes_subquery = (
        select(AnnouncementLike.announcement_id, func.count(AnnouncementLike.id).label("likes_count"))
        .group_by(AnnouncementLike.announcement_id)
        .subquery()
    )

    liked_subquery = (
        select(AnnouncementLike.announcement_id.label("liked_announcement_id"))
        .where(AnnouncementLike.user_id == current_user.id)
        .subquery()
        if current_user
        else None
    )

    base = (
        select(Announcement, Club.title.label("club_title"), User.full_name.label("author_name"), likes_subquery.c.likes_count, liked_subquery.c.liked_announcement_id)
        .join(Club, Club.id == Announcement.club_id)
        .join(User, User.id == Announcement.author_id)
        .outerjoin(likes_subquery, likes_subquery.c.announcement_id == Announcement.id)
        .outerjoin(liked_subquery, liked_subquery.c.liked_announcement_id == Announcement.id)
        if liked_subquery is not None
        else select(Announcement, Club.title.label("club_title"), User.full_name.label("author_name"), likes_subquery.c.likes_count)
        .join(Club, Club.id == Announcement.club_id)
        .join(User, User.id == Announcement.author_id)
        .outerjoin(likes_subquery, likes_subquery.c.announcement_id == Announcement.id)
    )
    if club_id is not None:
        base = base.where(Announcement.club_id == club_id)

    total_result = await db.execute(select(func.count()).select_from(base.subquery()))
    total = total_result.scalar_one()

    query = base.order_by(desc(Announcement.created_at), desc(Announcement.id)).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    rows = result.all()

    items = [
        AnnouncementResponse(
            id=row.Announcement.id,
            club_id=row.Announcement.club_id,
            club_title=row.club_title,
            title=row.Announcement.title,
            description=row.Announcement.description,
            image_url=resolve_image_url(row.Announcement),
            author_id=row.Announcement.author_id,
            author_name=row.author_name,
            created_at=row.Announcement.created_at.isoformat(),
            likes_count=int(row.likes_count or 0),
            liked_by_me=(row.liked_announcement_id is not None) if current_user else False,
        )
        for row in rows
    ]

    return AnnouncementListResponse(items=items, total=total, page=page, page_size=page_size)


@router.post("/{announcement_id}/like")
async def like_announcement(
    announcement_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_announcement_or_404(announcement_id, db)
    existing = await db.execute(
        select(AnnouncementLike).where(
            and_(AnnouncementLike.announcement_id == announcement_id, AnnouncementLike.user_id == current_user.id)
        )
    )
    if existing.scalar_one_or_none() is None:
        db.add(AnnouncementLike(announcement_id=announcement_id, user_id=current_user.id))
        await db.commit()
    return {"message": "liked"}


@router.delete("/{announcement_id}/like", status_code=status.HTTP_204_NO_CONTENT)
async def unlike_announcement(
    announcement_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(AnnouncementLike).where(
            and_(AnnouncementLike.announcement_id == announcement_id, AnnouncementLike.user_id == current_user.id)
        )
    )
    like = existing.scalar_one_or_none()
    if like:
        await db.delete(like)
        await db.commit()
    return None


@router.delete("/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_announcement(
    announcement_id: int,
    current_user: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db),
):
    announcement = await get_announcement_or_404(announcement_id, db)
    club = await verify_club_owner_or_admin(announcement.club_id, current_user, db)
    if not club:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Кружок не найден")

    if announcement.image_url and not announcement.image_url.startswith(("http://", "https://")):
        get_storage().delete_file(announcement.image_url)
    await db.delete(announcement)
    await db.commit()
    return None


@router.get("/{announcement_id}/image")
async def get_announcement_image(
    announcement_id: int,
    db: AsyncSession = Depends(get_db),
):
    announcement = await get_announcement_or_404(announcement_id, db)
    if announcement.image_url.startswith(("http://", "https://")):
        return RedirectResponse(url=announcement.image_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)
    return RedirectResponse(
        url=get_storage().generate_presigned_download_url(announcement.image_url),
        status_code=status.HTTP_307_TEMPORARY_REDIRECT,
    )
