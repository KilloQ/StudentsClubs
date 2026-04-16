import pytest


@pytest.mark.integration
@pytest.mark.asyncio
async def test_health_and_auth_register_login_flow(api_client, db_session):
    health = await api_client.get("/health/")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"

    register_payload = {
        "username": "student1",
        "full_name": "Student One",
        "password": "pass123",
        "password_confirm": "pass123",
    }
    register = await api_client.post("/auth/register", json=register_payload)
    assert register.status_code == 200
    assert register.json()["username"] == "student1"
    assert register.json()["role"] == "student"

    bad_login = await api_client.post("/auth/login", json={"username": "student1", "password": "wrong"})
    assert bad_login.status_code == 401

    login = await api_client.post("/auth/login", json={"username": "student1", "password": "pass123"})
    assert login.status_code == 200
    data = login.json()
    assert "access_token" in data and "refresh_token" in data

    me = await api_client.get("/auth/me", headers={"Authorization": f"Bearer {data['access_token']}"})
    assert me.status_code == 200
    assert me.json()["username"] == "student1"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_register_validation_errors(api_client):
    mismatch = await api_client.post(
        "/auth/register",
        json={
            "username": "u2",
            "full_name": "User Two",
            "password": "x",
            "password_confirm": "y",
        },
    )
    assert mismatch.status_code == 400

    missing_field = await api_client.post("/auth/register", json={"username": "u3"})
    assert missing_field.status_code == 422
    assert isinstance(missing_field.json().get("detail"), list)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_external_weather_validation_and_error(api_client, monkeypatch: pytest.MonkeyPatch):
    from app.api import external as external_api
    from app.services.external_weather_service import ExternalWeatherServiceError

    async def fail(*args, **kwargs):
        raise ExternalWeatherServiceError("service down")

    monkeypatch.setattr(external_api.ExternalWeatherService, "get_current_by_city", fail)

    invalid_city = await api_client.get("/external/weather", params={"city": "a"})
    assert invalid_city.status_code == 422

    failed = await api_client.get("/external/weather", params={"city": "Moscow"})
    assert failed.status_code == 503
    assert failed.json()["detail"] == "service down"
