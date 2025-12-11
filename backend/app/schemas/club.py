from pydantic import BaseModel
from typing import Optional, List
from datetime import time, date


class ScheduleBase(BaseModel):
    day_of_week: str
    start_time: str  # "HH:MM"
    location: str


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleResponse(ScheduleBase):
    id: int

    class Config:
        from_attributes = True


class ClubBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    max_students: int
    image_url: Optional[str] = None


class ClubCreate(ClubBase):
    pass


class ClubUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    max_students: Optional[int] = None
    recruitment_open: Optional[bool] = None


class ClubResponse(ClubBase):
    id: int
    recruitment_open: bool
    owner_id: int
    schedules: List[ScheduleResponse] = []

    class Config:
        from_attributes = True


class ClubDetailResponse(ClubResponse):
    current_students: int
    owner_name: str
    is_member: bool = False


class ClubMembershipResponse(BaseModel):
    id: int
    club_id: int
    student_id: int
    student_name: str
    joined_at: date

    class Config:
        from_attributes = True

