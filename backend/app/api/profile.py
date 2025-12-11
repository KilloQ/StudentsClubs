from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.db.database import get_db
from app.db.models import User, Club, ClubMembership, Attendance, Schedule
from app.schemas.profile import (
    StudentProfileResponse, TeacherProfileResponse,
    StudentStats, TeacherStats, StudentClubInfo, TeacherClubInfo, ScheduleItem
)
from app.api.auth import get_current_user
from datetime import date

router = APIRouter()


@router.get("/student", response_model=StudentProfileResponse)
async def get_student_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.is_teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is for students only"
        )
    
    # Получаем все кружки студента
    memberships_result = await db.execute(
        select(ClubMembership).where(ClubMembership.student_id == current_user.id)
    )
    memberships = memberships_result.scalars().all()
    
    my_clubs = len(memberships)
    
    # Подсчитываем общее количество посещений
    total_visits_result = await db.execute(
        select(func.count(Attendance.id)).where(Attendance.student_id == current_user.id)
    )
    total_visits = total_visits_result.scalar() or 0
    
    # Подсчитываем процент посещаемости
    # Для каждого кружка считаем посещения и общее количество занятий
    total_classes = 0
    total_attended = 0
    
    club_infos = []
    all_schedule_items = []
    
    for membership in memberships:
        club_result = await db.execute(
            select(Club).where(Club.id == membership.club_id)
        )
        club = club_result.scalar_one()
        
        # Получаем количество студентов в кружке
        students_count_result = await db.execute(
            select(func.count(ClubMembership.id)).where(ClubMembership.club_id == club.id)
        )
        current_students = students_count_result.scalar() or 0
        
        # Получаем имя преподавателя
        owner_result = await db.execute(select(User).where(User.id == club.owner_id))
        owner = owner_result.scalar_one()
        
        # Подсчитываем посещения для этого кружка
        visits_result = await db.execute(
            select(func.count(Attendance.id)).where(
                and_(
                    Attendance.club_id == club.id,
                    Attendance.student_id == current_user.id
                )
            )
        )
        visits = visits_result.scalar() or 0
        
        # Подсчитываем общее количество занятий (по датам посещений)
        # Упрощенно: считаем уникальные даты посещений для всех студентов кружка
        classes_result = await db.execute(
            select(func.count(func.distinct(Attendance.date))).where(
                Attendance.club_id == club.id
            )
        )
        total_classes_for_club = classes_result.scalar() or 0
        
        # Если нет занятий, то посещаемость 0%
        attendance_percentage = (visits / total_classes_for_club * 100) if total_classes_for_club > 0 else 0
        
        club_infos.append(StudentClubInfo(
            club_id=club.id,
            club_title=club.title,
            teacher_name=owner.full_name,
            current_students=current_students,
            max_students=club.max_students,
            visits=visits,
            total_classes=total_classes_for_club,
            attendance_percentage=round(attendance_percentage, 1)
        ))
        
        # Получаем расписание для этого кружка
        schedules_result = await db.execute(
            select(Schedule).where(Schedule.club_id == club.id)
        )
        schedules = schedules_result.scalars().all()
        
        for schedule in schedules:
            all_schedule_items.append(ScheduleItem(
                club_title=club.title,
                day_of_week=schedule.day_of_week,
                start_time=schedule.start_time.strftime("%H:%M"),
                location=schedule.location
            ))
    
    # Общий процент посещаемости
    attendance_percentage = (total_visits / (total_classes * my_clubs) * 100) if (total_classes * my_clubs) > 0 else 0
    
    stats = StudentStats(
        my_clubs=my_clubs,
        total_visits=total_visits,
        attendance_percentage=round(attendance_percentage, 1)
    )
    
    return StudentProfileResponse(
        user_id=current_user.id,
        full_name=current_user.full_name,
        stats=stats,
        clubs=club_infos,
        schedule=all_schedule_items
    )


@router.get("/teacher", response_model=TeacherProfileResponse)
async def get_teacher_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.is_teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Этот endpoint предназначен только для преподавателей"
        )
    
    # Получаем все кружки преподавателя
    clubs_result = await db.execute(
        select(Club).where(Club.owner_id == current_user.id)
    )
    clubs = clubs_result.scalars().all()
    
    total_clubs = len(clubs)
    active_clubs = sum(1 for club in clubs if club.recruitment_open)
    
    club_infos = []
    for club in clubs:
        # Подсчитываем количество студентов
        students_count_result = await db.execute(
            select(func.count(ClubMembership.id)).where(ClubMembership.club_id == club.id)
        )
        student_count = students_count_result.scalar() or 0
        
        club_infos.append(TeacherClubInfo(
            id=club.id,
            title=club.title,
            student_count=student_count,
            recruitment_open=club.recruitment_open
        ))
    
    stats = TeacherStats(
        total_clubs=total_clubs,
        active_clubs=active_clubs
    )
    
    return TeacherProfileResponse(
        user_id=current_user.id,
        full_name=current_user.full_name,
        stats=stats,
        clubs=club_infos
    )
