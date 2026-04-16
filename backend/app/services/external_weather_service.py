import asyncio
import time
from typing import Any, Dict, Optional

import httpx

from app.core.config import settings


class ExternalWeatherServiceError(RuntimeError):
    pass


class ExternalWeatherService:

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout_s: float = 4.0,
        max_retries: int = 2,
        min_interval_s: float = 0.25,
    ) -> None:
        self.api_key = (api_key if api_key is not None else settings.EXTERNAL_WEATHER_API_KEY).strip()
        self.base_url = (base_url if base_url is not None else settings.EXTERNAL_WEATHER_BASE_URL).rstrip("/")
        self.timeout_s = timeout_s
        self.max_retries = max_retries
        self.min_interval_s = min_interval_s
        self._last_request_ts = 0.0

    async def _throttle(self) -> None:
        now = time.monotonic()
        wait_s = self.min_interval_s - (now - self._last_request_ts)
        if wait_s > 0:
            await asyncio.sleep(wait_s)
        self._last_request_ts = time.monotonic()

    async def get_current_by_city(self, city: str, lang: str = "ru") -> Dict[str, Any]:
        if not city or not city.strip():
            raise ExternalWeatherServiceError("city is required")
        if not self.api_key:
            raise ExternalWeatherServiceError("External weather API key is not configured")

        await self._throttle()

        url = f"{self.base_url}/weather"
        params = {
            "q": city.strip(),
            "appid": self.api_key,
            "units": "metric",
            "lang": lang,
        }

        last_error: Optional[Exception] = None
        for attempt in range(self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout_s) as client:
                    resp = await client.get(url, params=params)
                if resp.status_code == 429:
                    await asyncio.sleep(0.5 * (attempt + 1))
                    continue
                if resp.status_code >= 500:
                    await asyncio.sleep(0.3 * (attempt + 1))
                    continue
                resp.raise_for_status()
                payload = resp.json()
                return self._normalize(payload)
            except (httpx.TimeoutException, httpx.NetworkError) as e:
                last_error = e
                await asyncio.sleep(0.3 * (attempt + 1))
            except httpx.HTTPStatusError as e:
                last_error = e
                break
            except Exception as e:
                last_error = e
                break

        raise ExternalWeatherServiceError(str(last_error) if last_error else "External API error")

    def _normalize(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        main = payload.get("main") or {}
        weather_list = payload.get("weather") or []
        weather0 = weather_list[0] if weather_list else {}
        wind = payload.get("wind") or {}

        return {
            "provider": "openweathermap",
            "city": payload.get("name"),
            "temp_c": main.get("temp"),
            "feels_like_c": main.get("feels_like"),
            "humidity_pct": main.get("humidity"),
            "condition": weather0.get("description"),
            "wind_m_s": wind.get("speed"),
            "observed_at": payload.get("dt"),
        }

