from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    model_config = ConfigDict()
    APP_NAME: str = "Student Clubs Management"
    DATABASE_URL: str
    SECRET_KEY: str = "dev-secret-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    S3_ENDPOINT_URL: str = "http://localhost:9000"
    S3_ACCESS_KEY_ID: str = "minioadmin"
    S3_SECRET_ACCESS_KEY: str = "minioadmin"
    S3_BUCKET_NAME: str = "students-clubs-files"
    S3_REGION: str = "us-east-1"
    FILE_MAX_SIZE_BYTES: int = 5 * 1024 * 1024
    FILE_ALLOWED_CONTENT_TYPES: str = "image/jpeg,image/png,application/pdf"
    LOCAL_STORAGE_DIR: str = "./storage"
    PUBLIC_API_BASE_URL: str = "http://localhost:8000"
    PUBLIC_SITE_URL: str = "http://localhost:5173"
    EXTERNAL_WEATHER_API_KEY: str = ""
    EXTERNAL_WEATHER_BASE_URL: str = "https://api.openweathermap.org/data/2.5"

    class Config:
        env_file = ".env"

settings = Settings()
