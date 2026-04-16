from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Literal
from datetime import time, date


class ScheduleBase(BaseModel):
    day_of_week: str
    start_time: str
    location: str


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleResponse(ScheduleBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int


class ClubBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    max_students: int
    image_url: Optional[str] = None


class ClubCreate(ClubBase):
    pass


class ClubUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=120)
    description: Optional[str] = Field(default=None, max_length=5000)
    category: Optional[str] = Field(default=None, min_length=2, max_length=80)
    image_url: Optional[str] = Field(default=None, max_length=1000)
    max_students: Optional[int] = Field(default=None, ge=1, le=10000)
    recruitment_open: Optional[bool] = None


class ClubResponse(ClubBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    recruitment_open: bool
    owner_id: int
    schedules: List[ScheduleResponse] = []


class ClubDetailResponse(ClubResponse):
    current_students: int
    owner_name: str
    is_member: bool = False


class ClubMembershipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    club_id: int
    student_id: int
    student_name: str
    joined_at: date


class ClubListResponse(BaseModel):
    items: List[ClubResponse]
    total: int
    page: int
    page_size: int


class ClubSortField(str):
    TITLE = "title"
    CATEGORY = "category"
    MAX_STUDENTS = "max_students"
    CREATED = "id"


class ClubFileResponse(BaseModel):
    id: int
    club_id: int
    original_name: str
    content_type: str
    size_bytes: int
    created_at: str
    uploaded_by: int


class ClubFileUploadResponse(ClubFileResponse):
    download_url: str


class ClubFileDownloadResponse(BaseModel):
    download_url: str

