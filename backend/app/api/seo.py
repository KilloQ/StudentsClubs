from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.database import get_db
from app.db.models import Club

router = APIRouter()


@router.get("/robots.txt", include_in_schema=False)
async def robots_txt() -> Response:

    lines: List[str] = [
        "User-agent: *",
        "Allow: /",
        "",
        f"Sitemap: {settings.PUBLIC_SITE_URL.rstrip('/')}/sitemap.xml",
        "",
        "Disallow: /api/",
        "Disallow: /docs",
        "Disallow: /redoc",
        "Disallow: /openapi.json",
    ]
    return Response(content="\n".join(lines) + "\n", media_type="text/plain; charset=utf-8")


@router.get("/sitemap.xml", include_in_schema=False)
async def sitemap_xml(db: AsyncSession = Depends(get_db)) -> Response:
    site = settings.PUBLIC_SITE_URL.rstrip("/")
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    result = await db.execute(select(Club.id).order_by(Club.id.asc()))
    club_ids = [row[0] for row in result.all()]

    urls: List[str] = []
    urls.append(
        "\n".join(
            [
                "  <url>",
                f"    <loc>{site}/clubs</loc>",
                f"    <lastmod>{now}</lastmod>",
                "    <changefreq>daily</changefreq>",
                "    <priority>0.8</priority>",
                "  </url>",
            ]
        )
    )

    for club_id in club_ids:
        urls.append(
            "\n".join(
                [
                    "  <url>",
                    f"    <loc>{site}/clubs/{club_id}</loc>",
                    f"    <lastmod>{now}</lastmod>",
                    "    <changefreq>weekly</changefreq>",
                    "    <priority>0.6</priority>",
                    "  </url>",
                ]
            )
        )

    xml = "\n".join(
        [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
            *urls,
            "</urlset>",
            "",
        ]
    )
    return Response(content=xml, media_type="application/xml; charset=utf-8")

