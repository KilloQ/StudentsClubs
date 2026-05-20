from pydantic import BaseModel, Field
from typing import List


class AnnouncementResponse(BaseModel):
    id: int
    club_id: int
    club_title: str
    title: str
    description: str
    image_url: str
    author_id: int
    author_name: str
    created_at: str
    likes_count: int
    liked_by_me: bool = False


class AnnouncementListResponse(BaseModel):
    items: List[AnnouncementResponse]
    total: int
    page: int
    page_size: int


class AnnouncementCreateForm(BaseModel):
    club_id: int = Field(ge=1)
    title: str = Field(min_length=2, max_length=200)
    description: str = Field(min_length=2, max_length=5000)
