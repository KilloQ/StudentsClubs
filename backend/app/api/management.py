from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List
from datetime import date, time
from app.db.database import get_db
from app.db.models import Club, User, ClubMembership, Attendance, Schedule
from app.schemas.management import (
    StudentAttendanceInfo, MarkAttendanceRequest,
    ClubSettingsUpdate, ScheduleItemCreate
)
from app.api.auth import get_current_user

router = APIRouter()


async def verify_club_owner(club_id: int, user: User, db: AsyncSession) -> Club:
    """Проверяет, что пользователь является владельцем кружка"""
    result = await db.execute(select(Club).where(Club.id == club_id))
    club = result.scalar_one_or_none()
    
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found"
        )
    
    if club.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы не являетесь владельцем этого кружка"
        )
    
    return club


@router.get("/{club_id}/students", response_model=List[StudentAttendanceInfo])
async def get_club_students(
    club_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_club_owner(club_id, current_user, db)
    
    # Получаем всех студентов кружка
    memberships_result = await db.execute(
        select(ClubMembership).where(ClubMembership.club_id == club_id)
    )
    memberships = memberships_result.scalars().all()
    
    students_info = []
    
    for membership in memberships:
        student_result = await db.execute(
            select(User).where(User.id == membership.student_id)
        )
        student = student_result.scalar_one()
        
        # Подсчитываем посещения
        visits_result = await db.execute(
            select(func.count(Attendance.id)).where(
                and_(
                    Attendance.club_id == club_id,
                    Attendance.student_id == student.id
                )
            )
        )
        visits = visits_result.scalar() or 0
        
        # Подсчитываем общее количество занятий (уникальные даты)
        total_classes_result = await db.execute(
            select(func.count(func.distinct(Attendance.date))).where(
                Attendance.club_id == club_id
            )
        )
        total_classes = total_classes_result.scalar() or 0
        
        # Процент посещаемости
        attendance_percentage = (visits / total_classes * 100) if total_classes > 0 else 0
        
        students_info.append(StudentAttendanceInfo(
            student_id=student.id,
            student_name=student.full_name,
            visits=visits,
            total_classes=total_classes,
            attendance_percentage=round(attendance_percentage, 1)
        ))
    
    return students_info


@router.post("/{club_id}/attendance")
async def mark_attendance(
    club_id: int,
    attendance_data: MarkAttendanceRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_club_owner(club_id, current_user, db)
    
    # Проверяем, что студент состоит в кружке
    membership_result = await db.execute(
        select(ClubMembership).where(
            and_(
                ClubMembership.club_id == club_id,
                ClubMembership.student_id == attendance_data.student_id
            )
        )
    )
    membership = membership_result.scalar_one_or_none()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Студент не состоит в этом кружке"
        )
    
    # Проверяем, не отмечено ли уже посещение на эту дату
    existing_attendance = await db.execute(
        select(Attendance).where(
            and_(
                Attendance.club_id == club_id,
                Attendance.student_id == attendance_data.student_id,
                Attendance.date == attendance_data.date
            )
        )
    )
    if existing_attendance.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Посещаемость на эту дату уже отмечена"
        )
    
    # Создаем запись о посещении
    new_attendance = Attendance(
        club_id=club_id,
        student_id=attendance_data.student_id,
        date=attendance_data.date,
        marked_at=date.today()
    )
    
    db.add(new_attendance)
    await db.commit()
    
    return {"message": "Attendance marked successfully"}


@router.get("/{club_id}/settings")
async def get_club_settings(
    club_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    club = await verify_club_owner(club_id, current_user, db)
    
    # Получаем расписание
    schedules_result = await db.execute(
        select(Schedule).where(Schedule.club_id == club_id)
    )
    schedules = schedules_result.scalars().all()
    
    return {
        "title": club.title,
        "description": club.description,
        "max_students": club.max_students,
        "recruitment_open": club.recruitment_open,
        "schedules": [
            {
                "id": s.id,
                "day_of_week": s.day_of_week,
                "start_time": s.start_time.strftime("%H:%M"),
                "location": s.location
            }
            for s in schedules
        ]
    }


@router.put("/{club_id}/settings")
async def update_club_settings(
    club_id: int,
    settings: ClubSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    club = await verify_club_owner(club_id, current_user, db)
    
    if settings.title is not None:
        club.title = settings.title
    if settings.description is not None:
        club.description = settings.description
    if settings.max_students is not None:
        club.max_students = settings.max_students
    if settings.recruitment_open is not None:
        club.recruitment_open = settings.recruitment_open
    
    await db.commit()
    await db.refresh(club)
    
    return {"message": "Settings updated successfully"}


@router.post("/{club_id}/schedule")
async def add_schedule_item(
    club_id: int,
    schedule_data: ScheduleItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_club_owner(club_id, current_user, db)
    
    # Парсим время из строки "HH:MM"
    time_parts = schedule_data.start_time.split(":")
    start_time_obj = time(int(time_parts[0]), int(time_parts[1]))
    
    new_schedule = Schedule(
        club_id=club_id,
        day_of_week=schedule_data.day_of_week,
        start_time=start_time_obj,
        location=schedule_data.location
    )
    
    db.add(new_schedule)
    await db.commit()
    await db.refresh(new_schedule)
    
    return {"message": "Schedule item added successfully", "id": new_schedule.id}


@router.delete("/{club_id}/schedule/{schedule_id}")
async def delete_schedule_item(
    club_id: int,
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_club_owner(club_id, current_user, db)
    
    # Проверяем, что расписание принадлежит этому кружку
    schedule_result = await db.execute(
        select(Schedule).where(
            and_(
                Schedule.id == schedule_id,
                Schedule.club_id == club_id
            )
        )
    )
    schedule = schedule_result.scalar_one_or_none()
    
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Элемент расписания не найден"
        )
    
    await db.delete(schedule)
    await db.commit()
    
    return {"message": "Schedule item deleted successfully"}


@router.get("/{club_id}/stats")
async def get_club_stats(
    club_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_club_owner(club_id, current_user, db)
    
    # Подсчитываем количество студентов
    students_count_result = await db.execute(
        select(func.count(ClubMembership.id)).where(ClubMembership.club_id == club_id)
    )
    total_students = students_count_result.scalar() or 0
    
    return {"total_students": total_students}
