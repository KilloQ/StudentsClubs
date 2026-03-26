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

export interface ClubListResponse {
    items: Club[];
    total: number;
    page: number;
    page_size: number;
}

export interface ClubFilters {
    category?: string;
    search?: string;
    recruitment_open?: boolean;
    min_max_students?: number;
    sort_by?: "title" | "category" | "max_students" | "id";
    sort_order?: "asc" | "desc";
    page?: number;
    page_size?: number;
}

export interface ClubFile {
    id: number;
    club_id: number;
    original_name: string;
    content_type: string;
    size_bytes: number;
    created_at: string;
    uploaded_by: number;
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

export const getClubs = async (filters: ClubFilters = {}): Promise<ClubListResponse> => {
    const params = new URLSearchParams();

    if (filters.category && filters.category !== "Все") params.set("category", filters.category);
    if (filters.search) params.set("search", filters.search);
    if (typeof filters.recruitment_open === "boolean") params.set("recruitment_open", String(filters.recruitment_open));
    if (typeof filters.min_max_students === "number") params.set("min_max_students", String(filters.min_max_students));
    if (filters.sort_by) params.set("sort_by", filters.sort_by);
    if (filters.sort_order) params.set("sort_order", filters.sort_order);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.page_size) params.set("page_size", String(filters.page_size));

    const query = params.toString();
    const url = `${API_BASE_URL}/clubs/${query ? `?${query}` : ""}`;
    return apiFetch<ClubListResponse>(url, { method: "GET" });
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

export const updateClub = async (clubId: number, data: Partial<CreateClubRequest> & { recruitment_open?: boolean }): Promise<Club> => {
    return apiFetch<Club>(`${API_BASE_URL}/clubs/${clubId}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
};

export const deleteClub = async (clubId: number): Promise<void> => {
    await apiFetch(`${API_BASE_URL}/clubs/${clubId}`, { method: "DELETE" });
};

export const getClubFiles = async (clubId: number): Promise<ClubFile[]> => {
    return apiFetch<ClubFile[]>(`${API_BASE_URL}/clubs/${clubId}/files`, { method: "GET" });
};

export const uploadClubFile = async (clubId: number, file: File): Promise<void> => {
    const formData = new FormData();
    formData.append("file", file);
    await apiFetch(`${API_BASE_URL}/clubs/${clubId}/files`, {
        method: "POST",
        body: formData,
    });
};

export const getClubFileDownloadUrl = async (clubId: number, fileId: number): Promise<string> => {
    const response = await apiFetch<{ download_url: string }>(
        `${API_BASE_URL}/clubs/${clubId}/files/${fileId}/download`,
        { method: "GET" },
    );
    return response.download_url;
};

export const deleteClubFile = async (clubId: number, fileId: number): Promise<void> => {
    await apiFetch(`${API_BASE_URL}/clubs/${clubId}/files/${fileId}`, { method: "DELETE" });
};

