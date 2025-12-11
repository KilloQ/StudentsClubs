import { getAuthHeaders } from "./auth";

const API_BASE_URL = "http://localhost:8000";

export interface StudentStats {
    my_clubs: number;
    total_visits: number;
    attendance_percentage: number;
}

export interface StudentClubInfo {
    club_id: number;
    club_title: string;
    teacher_name: string;
    current_students: number;
    max_students: number;
    visits: number;
    total_classes: number;
    attendance_percentage: number;
}

export interface ScheduleItem {
    club_title: string;
    day_of_week: string;
    start_time: string;
    location: string;
}

export interface StudentProfile {
    user_id: number;
    full_name: string;
    stats: StudentStats;
    clubs: StudentClubInfo[];
    schedule: ScheduleItem[];
}

export interface TeacherStats {
    total_clubs: number;
    active_clubs: number;
}

export interface TeacherClubInfo {
    id: number;
    title: string;
    student_count: number;
    recruitment_open: boolean;
}

export interface TeacherProfile {
    user_id: number;
    full_name: string;
    stats: TeacherStats;
    clubs: TeacherClubInfo[];
}

export const getStudentProfile = async (): Promise<StudentProfile> => {
    const response = await fetch(`${API_BASE_URL}/profile/student`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch student profile");
    }

    return response.json();
};

export const getTeacherProfile = async (): Promise<TeacherProfile> => {
    const response = await fetch(`${API_BASE_URL}/profile/teacher`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch teacher profile");
    }

    return response.json();
};

