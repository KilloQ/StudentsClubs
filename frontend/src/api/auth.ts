import { API_BASE_URL } from "./config";
import { apiFetch } from "./httpClient";

export type LoginRequest = {
    username: string;
    password: string;
};

export type RegisterRequest = {
    username: string;
    full_name: string;
    password: string;
    password_confirm: string;
};

export type TokenResponse = {
    access_token: string;
    refresh_token: string;
    token_type: string;
};

export type UserResponse = {
    id: number;
    username: string;
    full_name: string;
    is_teacher: boolean;
    role?: string;  // student, teacher, admin
};

// Сохранение токенов в localStorage
export const saveTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
};

// Получение access token из localStorage
export const getToken = (): string | null => {
    return localStorage.getItem("access_token");
};

// Получение refresh token из localStorage
export const getRefreshToken = (): string | null => {
    return localStorage.getItem("refresh_token");
};

// Удаление токенов
export const removeToken = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
};

// Получение заголовков с токеном
export const getAuthHeaders = () => {
    const token = getToken();
    return {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
    };
};

export const login = async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Login failed");
    }

    return response.json();
};

export const refreshSession = async (): Promise<TokenResponse> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        throw new Error("No refresh token");
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.detail || "Refresh failed");
    }

    const tokenResponse: TokenResponse = await response.json();
    saveTokens(tokenResponse.access_token, tokenResponse.refresh_token);
    return tokenResponse;
};

export const logout = async (): Promise<void> => {
    const refreshToken = getRefreshToken();

    // Даже если сервер недоступен, локально очистим токены.
    try {
        if (refreshToken) {
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });
        }
    } finally {
        removeToken();
    }
};

export const register = async (data: RegisterRequest): Promise<UserResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Registration failed");
    }

    return response.json();
};

export const getCurrentUser = async (): Promise<UserResponse> => {
    try {
        return await apiFetch<UserResponse>(`${API_BASE_URL}/auth/me`, {
            method: "GET",
        });
    } catch (error) {
        if (error instanceof TypeError && error.message.includes("fetch")) {
            console.error("❌ Не удалось подключиться к API. Убедитесь, что backend запущен на", API_BASE_URL);
            throw new Error("Backend недоступен. Проверьте, что сервер запущен.");
        }
        throw error;
    }
};

