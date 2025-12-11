import { getAuthHeaders } from "./auth";

const API_BASE_URL = "http://localhost:8000";

export interface StudentAttendanceInfo {
    student_id: number;
    student_name: string;
    visits: number;
    total_classes: number;
    attendance_percentage: number;
}

export interface MarkAttendanceRequest {
    student_id: number;
    date: string; // YYYY-MM-DD
}

export interface ClubSettings {
    title: string;
    description?: string;
    max_students: number;
    recruitment_open: boolean;
    schedules: Array<{
        id: number;
        day_of_week: string;
        start_time: string;
        location: string;
    }>;
}

export interface ClubSettingsUpdate {
    title?: string;
    description?: string;
    max_students?: number;
    recruitment_open?: boolean;
}

export interface ScheduleItemCreate {
    day_of_week: string;
    start_time: string; // HH:MM
    location: string;
}

export const getClubStudents = async (clubId: number): Promise<StudentAttendanceInfo[]> => {
    const response = await fetch(`${API_BASE_URL}/management/${clubId}/students`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch club students");
    }

    return response.json();
};

export const markAttendance = async (clubId: number, data: MarkAttendanceRequest): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/management/${clubId}/attendance`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to mark attendance");
    }
};

export const getClubSettings = async (clubId: number): Promise<ClubSettings> => {
    const response = await fetch(`${API_BASE_URL}/management/${clubId}/settings`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch club settings");
    }

    return response.json();
};

export const updateClubSettings = async (clubId: number, settings: ClubSettingsUpdate): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/management/${clubId}/settings`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(settings),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to update settings");
    }
};

export const addScheduleItem = async (clubId: number, schedule: ScheduleItemCreate): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/management/${clubId}/schedule`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(schedule),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to add schedule item");
    }
};

export const deleteScheduleItem = async (clubId: number, scheduleId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/management/${clubId}/schedule/${scheduleId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to delete schedule item");
    }
};

export const getClubStats = async (clubId: number): Promise<{ total_students: number }> => {
    const response = await fetch(`${API_BASE_URL}/management/${clubId}/stats`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch club stats");
    }

    return response.json();
};

