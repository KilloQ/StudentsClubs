from pydantic import BaseModel
from typing import List, Optional
from datetime import date


class StudentStats(BaseModel):
    my_clubs: int
    total_visits: int
    attendance_percentage: float


class StudentClubInfo(BaseModel):
    club_id: int
    club_title: str
    teacher_name: str
    current_students: int
    max_students: int
    visits: int
    total_classes: int
    attendance_percentage: float


class ScheduleItem(BaseModel):
    club_title: str
    day_of_week: str
    start_time: str
    location: str


class StudentProfileResponse(BaseModel):
    user_id: int
    full_name: str
    stats: StudentStats
    clubs: List[StudentClubInfo]
    schedule: List[ScheduleItem]


class TeacherStats(BaseModel):
    total_clubs: int
    active_clubs: int


class TeacherClubInfo(BaseModel):
    id: int
    title: str
    student_count: int
    recruitment_open: bool


class TeacherProfileResponse(BaseModel):
    user_id: int
    full_name: str
    stats: TeacherStats
    clubs: List[TeacherClubInfo]

