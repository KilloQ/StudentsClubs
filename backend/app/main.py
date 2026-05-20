from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.clubs import router as clubs_router
from app.api.profile import router as profile_router
from app.api.management import router as management_router
from app.api.admin import router as admin_router
from app.api.seo import router as seo_router
from app.api.external import router as external_router
from app.api.announcements import router as announcements_router

app = FastAPI(title="Student Clubs Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://127.0.0.1",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://localhost:80",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/health", tags=["Health"])
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(clubs_router, prefix="/clubs", tags=["Clubs"])
app.include_router(profile_router, prefix="/profile", tags=["Profile"])
app.include_router(management_router, prefix="/management", tags=["Management"])
app.include_router(admin_router, prefix="/admin", tags=["Admin"])
app.include_router(seo_router, tags=["SEO"])
app.include_router(external_router, prefix="/external", tags=["External"])
app.include_router(announcements_router, prefix="/announcements", tags=["Announcements"])
