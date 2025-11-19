from pydantic import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Student Clubs Management"
    DATABASE_URL: str

    class Config:
        env_file = ".env"

settings = Settings()
