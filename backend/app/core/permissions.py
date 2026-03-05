from enum import Enum
from typing import Callable

from fastapi import Depends, HTTPException, status

from app.api.auth import get_current_user
from app.db.models import User


class Role(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


class Permission:
    CLUB_CREATE = "club:create"
    CLUB_UPDATE = "club:update"
    CLUB_DELETE = "club:delete"
    MEMBERSHIP_JOIN = "membership:join"
    MEMBERSHIP_LEAVE = "membership:leave"
    MEMBERSHIP_REMOVE = "membership:remove"
    MEMBERSHIP_LIST = "membership:list"
    SCHEDULE_MANAGE = "schedule:manage"
    ATTENDANCE_MARK = "attendance:mark"
    ATTENDANCE_READ = "attendance:read"
    PROFILE_STUDENT = "profile:student"
    PROFILE_TEACHER = "profile:teacher"
    USER_CHANGE_ROLE = "user:change_role"
    USER_LIST = "user:list"


ROLE_PERMISSIONS = {
    Role.STUDENT: {
        Permission.MEMBERSHIP_JOIN,
        Permission.MEMBERSHIP_LEAVE,
        Permission.ATTENDANCE_READ,
        Permission.PROFILE_STUDENT,
    },
    Role.TEACHER: {
        Permission.CLUB_CREATE,
        Permission.CLUB_UPDATE,
        Permission.CLUB_DELETE,
        Permission.MEMBERSHIP_REMOVE,
        Permission.MEMBERSHIP_LIST,
        Permission.SCHEDULE_MANAGE,
        Permission.ATTENDANCE_MARK,
        Permission.ATTENDANCE_READ,
        Permission.PROFILE_TEACHER,
    },
    Role.ADMIN: {
        Permission.CLUB_CREATE,
        Permission.CLUB_UPDATE,
        Permission.CLUB_DELETE,
        Permission.MEMBERSHIP_JOIN,
        Permission.MEMBERSHIP_LEAVE,
        Permission.MEMBERSHIP_REMOVE,
        Permission.MEMBERSHIP_LIST,
        Permission.SCHEDULE_MANAGE,
        Permission.ATTENDANCE_MARK,
        Permission.ATTENDANCE_READ,
        Permission.PROFILE_STUDENT,
        Permission.PROFILE_TEACHER,
        Permission.USER_CHANGE_ROLE,
        Permission.USER_LIST,
    },
}


def get_user_role(user: User) -> str:
    if hasattr(user, "role") and user.role:
        return user.role
    return Role.TEACHER.value if user.is_teacher else Role.STUDENT.value


def has_permission(user: User, permission: str) -> bool:
    role_str = get_user_role(user)
    try:
        role = Role(role_str)
    except ValueError:
        role = Role.STUDENT
    return permission in ROLE_PERMISSIONS.get(role, set())


def is_admin(user: User) -> bool:
    return get_user_role(user) == Role.ADMIN.value


def is_teacher_or_admin(user: User) -> bool:
    role = get_user_role(user)
    return role in (Role.TEACHER.value, Role.ADMIN.value)


def require_permission(permission: str) -> Callable:

    async def _check(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if not has_permission(current_user, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав для выполнения действия",
            )
        return current_user

    return _check


def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещён. Требуется роль администратора.",
        )
    return current_user


def require_teacher(
    current_user: User = Depends(get_current_user),
) -> User:
    if not is_teacher_or_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещён. Требуется роль преподавателя.",
        )
    return current_user


def require_student(
    current_user: User = Depends(get_current_user),
) -> User:
    role = get_user_role(current_user)
    if role != Role.STUDENT.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Действие доступно только студентам",
        )
    return current_user
