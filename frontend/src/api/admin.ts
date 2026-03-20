import { apiFetch } from "./httpClient";

const API_BASE_URL = "http://localhost:8000";

export type UserAdmin = {
    id: number;
    username: string;
    full_name: string;
    role: string;
    is_teacher: boolean;
};

export const getUsers = async (): Promise<UserAdmin[]> => {
    return apiFetch<UserAdmin[]>(`${API_BASE_URL}/admin/users`, { method: "GET" });
};

export const updateUserRole = async (userId: number, role: string): Promise<UserAdmin> => {
    return apiFetch<UserAdmin>(`${API_BASE_URL}/admin/users/${userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role }),
    });
};
