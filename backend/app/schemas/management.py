from pydantic import BaseModel
from typing import List, Optional
from datetime import date


class StudentAttendanceInfo(BaseModel):
    student_id: int
    student_name: str
    visits: int
    total_classes: int
    attendance_percentage: float


class MarkAttendanceRequest(BaseModel):
    student_id: int
    date: date


class ClubSettingsUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    max_students: Optional[int] = None
    recruitment_open: Optional[bool] = None


class ScheduleItemCreate(BaseModel):
    day_of_week: str
    start_time: str  # "HH:MM"
    location: str


class ScheduleItemDelete(BaseModel):
    schedule_id: int

