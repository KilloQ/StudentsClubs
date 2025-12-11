const API_BASE_URL = "http://localhost:8000";

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
    token_type: string;
};

export type UserResponse = {
    id: number;
    username: string;
    full_name: string;
    is_teacher: boolean;
};

// Сохранение токена в localStorage
export const saveToken = (token: string) => {
    localStorage.setItem("access_token", token);
};

// Получение токена из localStorage
export const getToken = (): string | null => {
    return localStorage.getItem("access_token");
};

// Удаление токена
export const removeToken = () => {
    localStorage.removeItem("access_token");
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
    const token = getToken();
    if (!token) {
        throw new Error("Not authenticated");
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("Unauthorized");
            }
            throw new Error("Failed to get user");
        }

        return response.json();
    } catch (error) {
        if (error instanceof TypeError && error.message.includes("fetch")) {
            console.error("❌ Не удалось подключиться к API. Убедитесь, что backend запущен на", API_BASE_URL);
            throw new Error("Backend недоступен. Проверьте, что сервер запущен.");
        }
        throw error;
    }
};

