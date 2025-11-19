from fastapi import FastAPI

from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.clubs import router as clubs_router
from app.api.profile import router as profile_router
from app.api.management import router as management_router

app = FastAPI(title="Student Clubs Management API")

app.include_router(health_router, prefix="/health", tags=["Health"])
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(clubs_router, prefix="/clubs", tags=["Clubs"])
app.include_router(profile_router, prefix="/profile", tags=["Profile"])
app.include_router(management_router, prefix="/management", tags=["Management"])
