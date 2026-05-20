from pydantic import BaseModel, ConfigDict, Field


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    sort_order: int


class CategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=80)


class CategoryReorder(BaseModel):
    ordered_ids: list[int] = Field(min_length=1)
