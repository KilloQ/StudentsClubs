from datetime import date

import pytest

from app.api.auth import get_current_user
from app.db.models import Club, ClubMembership, User
from app.main import app


class FakeStorage:
    def __init__(self):
        self.deleted = []

    def build_object_key(self, club_id: int, filename: str) -> str:
        return f"clubs/{club_id}/{filename}"

    def upload_file(self, object_key: str, content: bytes, content_type: str, metadata: dict):
        return None

    def generate_presigned_download_url(self, object_key: str) -> str:
        return f"https://files.local/{object_key}"

    def delete_file(self, object_key: str):
        self.deleted.append(object_key)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_clubs_list_pagination_and_validation(api_client, db_session):
    teacher = User(username="teacher", full_name="Teacher", password_hash="x", is_teacher=True, role="teacher")
    db_session.add(teacher)
    await db_session.flush()

    for idx in range(4):
        db_session.add(
            Club(
                title=f"Club {idx}",
                description="desc",
                category="Спортивные",
                max_students=10 + idx,
                recruitment_open=True,
                owner_id=teacher.id,
            )
        )
    await db_session.commit()

    ok = await api_client.get("/clubs/", params={"page": 1, "page_size": 2, "sort_by": "title", "sort_order": "asc"})
    assert ok.status_code == 200
    payload = ok.json()
    assert payload["total"] == 4
    assert len(payload["items"]) == 2
    assert {"id", "title", "category", "max_students"}.issubset(payload["items"][0].keys())

    invalid = await api_client.get("/clubs/", params={"page_size": 999})
    assert invalid.status_code == 422


@pytest.mark.integration
@pytest.mark.asyncio
async def test_join_club_respects_capacity_and_role(api_client, db_session):
    teacher = User(username="teacher2", full_name="Teacher 2", password_hash="x", is_teacher=True, role="teacher")
    student = User(username="student2", full_name="Student 2", password_hash="x", is_teacher=False, role="student")
    db_session.add_all([teacher, student])
    await db_session.flush()

    club = Club(
        title="Math",
        description="desc",
        category="Точные науки",
        max_students=1,
        recruitment_open=True,
        owner_id=teacher.id,
    )
    db_session.add(club)
    await db_session.flush()

    db_session.add(ClubMembership(club_id=club.id, student_id=student.id, joined_at=date.today()))
    await db_session.commit()

    async def override_user():
        return student

    app.dependency_overrides[get_current_user] = override_user
    full = await api_client.post(f"/clubs/{club.id}/join")
    app.dependency_overrides.clear()

    assert full.status_code == 400
    assert "записаны" in full.json()["detail"] or "переполнен" in full.json()["detail"]


@pytest.mark.integration
@pytest.mark.asyncio
async def test_upload_file_validation(api_client, db_session, monkeypatch: pytest.MonkeyPatch):
    from app.api import clubs as clubs_api

    storage = FakeStorage()
    monkeypatch.setattr(clubs_api, "get_storage", lambda: storage)

    teacher = User(username="teacher3", full_name="Teacher 3", password_hash="x", is_teacher=True, role="teacher")
    db_session.add(teacher)
    await db_session.flush()
    club = Club(
        title="Robotics",
        description="desc",
        category="Инжиниринг",
        max_students=10,
        recruitment_open=True,
        owner_id=teacher.id,
    )
    db_session.add(club)
    await db_session.commit()

    async def override_user():
        return teacher

    app.dependency_overrides[get_current_user] = override_user
    bad_type = await api_client.post(
        f"/clubs/{club.id}/files",
        files={"file": ("notes.txt", b"hello", "text/plain")},
    )
    app.dependency_overrides.clear()
    assert bad_type.status_code == 400

