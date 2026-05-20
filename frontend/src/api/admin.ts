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

export type ClubCategory = {
    id: number;
    name: string;
    sort_order: number;
};

export type CategoryCreatePayload = {
    name: string;
};

export type CategoryUpdatePayload = {
    name?: string;
};

export type CategoryReorderPayload = {
    ordered_ids: number[];
};

export const getCategories = async (): Promise<ClubCategory[]> => {
    return apiFetch<ClubCategory[]>(`${API_BASE_URL}/admin/categories`, { method: "GET" });
};

export const createCategory = async (payload: CategoryCreatePayload): Promise<ClubCategory> => {
    return apiFetch<ClubCategory>(`${API_BASE_URL}/admin/categories`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export const updateCategory = async (
    categoryId: number,
    payload: CategoryUpdatePayload,
): Promise<ClubCategory> => {
    return apiFetch<ClubCategory>(`${API_BASE_URL}/admin/categories/${categoryId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
};

export const deleteCategory = async (categoryId: number): Promise<void> => {
    await apiFetch(`${API_BASE_URL}/admin/categories/${categoryId}`, { method: "DELETE" });
};

export const reorderCategories = async (payload: CategoryReorderPayload): Promise<ClubCategory[]> => {
    return apiFetch<ClubCategory[]>(`${API_BASE_URL}/admin/categories/reorder`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
};
