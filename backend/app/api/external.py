from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.external import WeatherResponse
from app.services.external_weather_service import ExternalWeatherService, ExternalWeatherServiceError

router = APIRouter()


@router.get("/weather", response_model=WeatherResponse)
async def get_weather(city: str = Query(..., min_length=2, max_length=80)):
    svc = ExternalWeatherService()
    try:
        data = await svc.get_current_by_city(city=city)
        return WeatherResponse(**data)
    except ExternalWeatherServiceError as e:
        # graceful degradation: surface as 503 so UI can fallback
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))

