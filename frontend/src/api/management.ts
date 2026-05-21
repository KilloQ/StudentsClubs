import { apiFetch } from "./httpClient";

import { API_BASE_URL } from "./config";

export interface StudentAttendanceInfo {
    student_id: number;
    student_name: string;
    visits: number;
    total_classes: number;
    attendance_percentage: number;
}

export interface MarkAttendanceRequest {
    student_id: number;
    date: string;
    schedule_id?: number | null;
}

export interface AttendanceByDateResponse {
    date: string;
    schedule_id?: number | null;
    student_ids: number[];
}

export interface BulkMarkAttendanceRequest {
    date: string;
    student_ids: number[];
    schedule_id?: number | null;
}

export interface BulkMarkAttendanceResponse {
    marked_count: number;
    skipped_count: number;
}

export interface ClubSettings {
    title: string;
    description?: string;
    max_students: number;
    recruitment_open: boolean;
    image_url?: string;
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
    start_time: string; 
    location: string;
}

export const getClubStudents = async (clubId: number): Promise<StudentAttendanceInfo[]> => {
    return apiFetch<StudentAttendanceInfo[]>(`${API_BASE_URL}/management/${clubId}/students`, { method: "GET" });
};

export const getAttendanceByDate = async (
    clubId: number,
    date: string,
    scheduleId?: number | null,
): Promise<AttendanceByDateResponse> => {
    const params = new URLSearchParams({ date });
    if (scheduleId != null) {
        params.set("schedule_id", String(scheduleId));
    }
    return apiFetch<AttendanceByDateResponse>(
        `${API_BASE_URL}/management/${clubId}/attendance?${params}`,
        { method: "GET" },
    );
};

export const markAttendance = async (clubId: number, data: MarkAttendanceRequest): Promise<void> => {
    await apiFetch(`${API_BASE_URL}/management/${clubId}/attendance`, {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export const markAttendanceBulk = async (
    clubId: number,
    data: BulkMarkAttendanceRequest,
): Promise<BulkMarkAttendanceResponse> => {
    return apiFetch<BulkMarkAttendanceResponse>(
        `${API_BASE_URL}/management/${clubId}/attendance/bulk`,
        {
            method: "POST",
            body: JSON.stringify(data),
        },
    );
};

export const getClubSettings = async (clubId: number): Promise<ClubSettings> => {
    return apiFetch<ClubSettings>(`${API_BASE_URL}/management/${clubId}/settings`, { method: "GET" });
};

export const updateClubSettings = async (clubId: number, settings: ClubSettingsUpdate): Promise<void> => {
    await apiFetch(`${API_BASE_URL}/management/${clubId}/settings`, {
        method: "PUT",
        body: JSON.stringify(settings),
    });
};

export const addScheduleItem = async (clubId: number, schedule: ScheduleItemCreate): Promise<void> => {
    await apiFetch(`${API_BASE_URL}/management/${clubId}/schedule`, {
        method: "POST",
        body: JSON.stringify(schedule),
    });
};

export const deleteScheduleItem = async (clubId: number, scheduleId: number): Promise<void> => {
    await apiFetch(`${API_BASE_URL}/management/${clubId}/schedule/${scheduleId}`, { method: "DELETE" });
};

export const getClubStats = async (clubId: number): Promise<{ total_students: number }> => {
    return apiFetch<{ total_students: number }>(`${API_BASE_URL}/management/${clubId}/stats`, { method: "GET" });
};

export const updateClubImage = async (clubId: number, image: File): Promise<{ image_url: string }> => {
    const formData = new FormData();
    formData.append("image", image);
    return apiFetch<{ image_url: string }>(`${API_BASE_URL}/management/${clubId}/image`, {
        method: "POST",
        body: formData,
    });
};

