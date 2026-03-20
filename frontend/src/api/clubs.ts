import { apiFetch } from "./httpClient";

const API_BASE_URL = "http://localhost:8000";

export interface Schedule {
    id: number;
    day_of_week: string;
    start_time: string;
    location: string;
}

export interface Club {
    id: number;
    title: string;
    description?: string;
    category: string;
    max_students: number;
    recruitment_open: boolean;
    image_url?: string;
    owner_id: number;
    schedules?: Schedule[];
}

export interface ClubDetail extends Club {
    current_students: number;
    owner_name: string;
    is_member?: boolean;
}

export interface CreateClubRequest {
    title: string;
    description?: string;
    category: string;
    max_students: number;
    image_url?: string;
}

export const getClubs = async (category?: string): Promise<Club[]> => {
    const url = category && category !== "Все"
        ? `${API_BASE_URL}/clubs/?category=${encodeURIComponent(category)}`
        : `${API_BASE_URL}/clubs/`;

    return apiFetch<Club[]>(url, { method: "GET" });
};

export const getClub = async (clubId: number): Promise<ClubDetail> => {
    return apiFetch<ClubDetail>(`${API_BASE_URL}/clubs/${clubId}`, { method: "GET" });
};

export const createClub = async (data: CreateClubRequest): Promise<Club> => {
    return apiFetch<Club>(`${API_BASE_URL}/clubs/`, {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export const joinClub = async (clubId: number): Promise<void> => {
    await apiFetch(`${API_BASE_URL}/clubs/${clubId}/join`, { method: "POST" });
};

export const leaveClub = async (clubId: number): Promise<void> => {
    await apiFetch(`${API_BASE_URL}/clubs/${clubId}/leave`, { method: "DELETE" });
};

export const getCategories = async (): Promise<string[]> => {
    return apiFetch<string[]>(`${API_BASE_URL}/clubs/categories/list`, { method: "GET" });
};

