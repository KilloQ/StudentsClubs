import pytest
import httpx

from app.services.external_weather_service import ExternalWeatherService, ExternalWeatherServiceError


class DummyResponse:
    def __init__(self, status_code: int, payload: dict | None = None) -> None:
        self.status_code = status_code
        self._payload = payload or {}

    def json(self):
        return self._payload

    def raise_for_status(self):
        if self.status_code >= 400:
            request = httpx.Request("GET", "http://example.com")
            response = httpx.Response(self.status_code, request=request)
            raise httpx.HTTPStatusError("boom", request=request, response=response)


@pytest.mark.unit
@pytest.mark.asyncio
async def test_external_weather_service_requires_city():
    svc = ExternalWeatherService(api_key="k", min_interval_s=0)
    with pytest.raises(ExternalWeatherServiceError, match="city is required"):
        await svc.get_current_by_city(" ")


@pytest.mark.unit
@pytest.mark.asyncio
async def test_external_weather_service_normalizes_payload(monkeypatch: pytest.MonkeyPatch):
    payload = {
        "name": "Moscow",
        "dt": 171111,
        "main": {"temp": 10.4, "feels_like": 8.1, "humidity": 74},
        "weather": [{"description": "cloudy"}],
        "wind": {"speed": 4.2},
    }

    async def fake_get(self, url, params):
        return DummyResponse(200, payload)

    monkeypatch.setattr(httpx.AsyncClient, "get", fake_get)

    svc = ExternalWeatherService(api_key="k", min_interval_s=0)
    result = await svc.get_current_by_city("Moscow")

    assert result["provider"] == "openweathermap"
    assert result["city"] == "Moscow"
    assert result["temp_c"] == 10.4
    assert result["condition"] == "cloudy"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_external_weather_service_retries_on_429(monkeypatch: pytest.MonkeyPatch):
    responses = iter(
        [
            DummyResponse(429),
            DummyResponse(429),
            DummyResponse(200, {"name": "Kazan", "main": {}, "weather": [], "wind": {}, "dt": 1}),
        ]
    )

    async def fake_get(self, url, params):
        return next(responses)

    monkeypatch.setattr(httpx.AsyncClient, "get", fake_get)

    svc = ExternalWeatherService(api_key="k", min_interval_s=0, max_retries=3)
    result = await svc.get_current_by_city("Kazan")
    assert result["city"] == "Kazan"
