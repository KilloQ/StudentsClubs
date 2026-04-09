from typing import Optional

from pydantic import BaseModel, Field


class WeatherResponse(BaseModel):
    provider: str = Field(..., examples=["openweathermap"])
    city: Optional[str] = None
    temp_c: Optional[float] = None
    feels_like_c: Optional[float] = None
    humidity_pct: Optional[int] = None
    condition: Optional[str] = None
    wind_m_s: Optional[float] = None
    observed_at: Optional[int] = None

