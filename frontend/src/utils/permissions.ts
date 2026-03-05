import type { UserResponse } from "../api/auth";

export function canJoinOrLeaveClub(user: UserResponse | null): boolean {
    if (!user) return false;
    return user.role === "student" || (!user.role && !user.is_teacher);
}

export function canManageClubs(user: UserResponse | null): boolean {
    if (!user) return false;
    return !!user.is_teacher || user.role === "admin";
}

export function isAdmin(user: UserResponse | null): boolean {
    return user?.role === "admin";
}
