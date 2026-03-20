from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Student Clubs Management"
    DATABASE_URL: str
    SECRET_KEY: str = "dev-secret-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    class Config:
        env_file = ".env"

settings = Settings()
