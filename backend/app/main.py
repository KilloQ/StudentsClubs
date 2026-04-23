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

app = FastAPI(title="Student Clubs Management API")

from app.core.config import settings

allow_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
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
