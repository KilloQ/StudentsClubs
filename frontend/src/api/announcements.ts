import { apiFetch } from "./httpClient";

const API_BASE_URL = "http://localhost:8000";

export interface Announcement {
    id: number;
    club_id: number;
    club_title: string;
    title: string;
    description: string;
    image_url: string;
    author_id: number;
    author_name: string;
    created_at: string;
    likes_count: number;
    liked_by_me: boolean;
}

export interface AnnouncementListResponse {
    items: Announcement[];
    total: number;
    page: number;
    page_size: number;
}

export interface AnnouncementCreatePayload {
    club_id: number;
    title: string;
    description: string;
    image: File;
}

export const getAnnouncements = async (params: { club_id?: number; page?: number; page_size?: number } = {}): Promise<AnnouncementListResponse> => {
    const query = new URLSearchParams();
    if (params.club_id) query.set("club_id", String(params.club_id));
    if (params.page) query.set("page", String(params.page));
    if (params.page_size) query.set("page_size", String(params.page_size));
    return apiFetch<AnnouncementListResponse>(`${API_BASE_URL}/announcements/${query.toString() ? `?${query.toString()}` : ""}`, {
        method: "GET",
        skipAuth: !localStorage.getItem("access_token"),
    });
};

export const createAnnouncement = async (payload: AnnouncementCreatePayload): Promise<Announcement> => {
    const formData = new FormData();
    formData.append("club_id", String(payload.club_id));
    formData.append("title", payload.title);
    formData.append("description", payload.description);
    formData.append("image", payload.image);
    return apiFetch<Announcement>(`${API_BASE_URL}/announcements/`, {
        method: "POST",
        body: formData,
    });
};

export const deleteAnnouncement = async (announcementId: number): Promise<void> => {
    await apiFetch(`${API_BASE_URL}/announcements/${announcementId}`, { method: "DELETE" });
};

export const likeAnnouncement = async (announcementId: number): Promise<void> => {
    await apiFetch(`${API_BASE_URL}/announcements/${announcementId}/like`, { method: "POST" });
};

export const unlikeAnnouncement = async (announcementId: number): Promise<void> => {
    await apiFetch(`${API_BASE_URL}/announcements/${announcementId}/like`, { method: "DELETE" });
};
