import { apiFetch } from "./httpClient";

const API_BASE_URL = "http://localhost:8000";

export type Weather = {
  provider: string;
  city?: string | null;
  temp_c?: number | null;
  feels_like_c?: number | null;
  humidity_pct?: number | null;
  condition?: string | null;
  wind_m_s?: number | null;
  observed_at?: number | null;
};

export async function getWeather(city: string): Promise<Weather> {
  const url = `${API_BASE_URL}/external/weather?city=${encodeURIComponent(city)}`;
  return apiFetch<Weather>(url, { method: "GET", skipAuth: true });
}

