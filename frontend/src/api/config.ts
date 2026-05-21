const envUrl = import.meta.env.VITE_API_BASE_URL;

export const API_BASE_URL =
    envUrl !== undefined ? envUrl : import.meta.env.DEV ? "http://localhost:8000" : "";
