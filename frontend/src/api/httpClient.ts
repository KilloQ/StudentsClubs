const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

type ApiFetchOptions = RequestInit & {
    skipAuth?: boolean;
    _retry?: boolean;
};

class ApiError extends Error {
    status: number;
    detail?: string;
    constructor(status: number, message: string, detail?: string) {
        super(message);
        this.status = status;
        this.detail = detail;
    }
}

function getAccessToken(): string | null {
    return localStorage.getItem("access_token");
}

function getRefreshToken(): string | null {
    return localStorage.getItem("refresh_token");
}

function saveTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
}

function clearTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
}

async function refreshAccessToken(): Promise<boolean> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (!data?.access_token || !data?.refresh_token) return false;

    saveTokens(data.access_token, data.refresh_token);
    return true;
}

export async function apiFetch<T = unknown>(url: string, options: ApiFetchOptions = {}): Promise<T> {
    const { skipAuth = false, _retry = false } = options;

    const headers = new Headers(options.headers || {});
    if (!skipAuth) {
        const token = getAccessToken();
        if (token) headers.set("Authorization", `Bearer ${token}`);
    }

    // Если тело есть, но Content-Type не задан — выставим JSON.
    const hasBody =
        options.body !== undefined &&
        options.body !== null &&
        options.body !== "" &&
        typeof options.body !== "undefined";
    if (hasBody && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 && !skipAuth && !_retry) {
        const ok = await refreshAccessToken();
        if (ok) {
            return apiFetch<T>(url, { ...options, _retry: true });
        }

        clearTokens();
        window.dispatchEvent(new Event("auth:logout"));
        window.location.href = "/login";
        throw new ApiError(401, "Unauthorized");
    }

    if (response.status === 401 && !skipAuth && _retry) {
        clearTokens();
        window.dispatchEvent(new Event("auth:logout"));
        window.location.href = "/login";
        throw new ApiError(401, "Unauthorized");
    }

    if (!response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
            const err = await response.json().catch(() => null);
            throw new ApiError(
                response.status,
                err?.detail || `Request failed with status ${response.status}`,
                err?.detail,
            );
        }
        throw new ApiError(response.status, `Request failed with status ${response.status}`);
    }

    // 204 No Content
    if (response.status === 204) return undefined as T;

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        return (await response.json()) as T;
    }

    const text = await response.text();
    return text as T;
}

