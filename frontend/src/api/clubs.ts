import { getAuthHeaders } from "./auth";

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
    
    const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch clubs");
    }

    return response.json();
};

export const getClub = async (clubId: number): Promise<ClubDetail> => {
    const response = await fetch(`${API_BASE_URL}/clubs/${clubId}`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch club");
    }

    return response.json();
};

export const createClub = async (data: CreateClubRequest): Promise<Club> => {
    const response = await fetch(`${API_BASE_URL}/clubs/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to create club");
    }

    return response.json();
};

export const joinClub = async (clubId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/clubs/${clubId}/join`, {
        method: "POST",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Ошибка записи на кружок");
    }
};

export const leaveClub = async (clubId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/clubs/${clubId}/leave`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Ошибка отписки от кружка");
    }
};

export const getCategories = async (): Promise<string[]> => {
    const response = await fetch(`${API_BASE_URL}/clubs/categories/list`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch categories");
    }

    return response.json();
};

