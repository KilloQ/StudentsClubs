from pydantic import BaseModel, ConfigDict, field_validator


class UserRoleUpdate(BaseModel):
    role: str

    @field_validator("role")
    @classmethod
    def role_must_be_valid(cls, v: str) -> str:
        allowed = {"student", "teacher", "admin"}
        if v.lower() not in allowed:
            raise ValueError(f"Роль должна быть одной из: {allowed}")
        return v.lower()


class UserAdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    username: str
    full_name: str
    role: str
    is_teacher: bool
