import { getAuthHeaders } from "./auth";

const API_BASE_URL = "http://localhost:8000";

export type UserAdmin = {
    id: number;
    username: string;
    full_name: string;
    role: string;
    is_teacher: boolean;
};

export const getUsers = async (): Promise<UserAdmin[]> => {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        if (response.status === 403) {
            throw new Error("Недостаточно прав");
        }
        const err = await response.json();
        throw new Error(err.detail || "Ошибка загрузки пользователей");
    }

    return response.json();
};

export const updateUserRole = async (userId: number, role: string): Promise<UserAdmin> => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ role }),
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Ошибка изменения роли");
    }

    return response.json();
};
