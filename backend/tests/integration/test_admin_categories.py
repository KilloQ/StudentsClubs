import pytest
from sqlalchemy import select

from app.api.auth import get_current_user
from app.core.permissions import require_admin
from app.db.models import Club, ClubCategory, User
from app.main import app


@pytest.mark.integration
@pytest.mark.asyncio
async def test_categories_list_includes_all_prefix(api_client, db_session):
    db_session.add_all(
        [
            ClubCategory(name="Творчество", sort_order=1),
            ClubCategory(name="Командные игры", sort_order=2),
        ]
    )
    await db_session.commit()

    response = await api_client.get("/clubs/categories/list")
    assert response.status_code == 200
    assert response.json() == ["Все", "Творчество", "Командные игры"]


@pytest.mark.integration
@pytest.mark.asyncio
async def test_admin_category_crud_and_rename_updates_clubs(api_client, db_session):
    admin = User(username="admin_cat", full_name="Admin", password_hash="x", is_teacher=True, role="admin")
    teacher = User(username="teacher_cat", full_name="Teacher", password_hash="x", is_teacher=True, role="teacher")
    db_session.add_all([admin, teacher])
    await db_session.flush()

    category = ClubCategory(name="Творчество", sort_order=1)
    db_session.add(category)
    await db_session.flush()

    db_session.add(
        Club(
            title="Painting",
            description="desc",
            category="Творчество",
            max_students=10,
            recruitment_open=True,
            owner_id=teacher.id,
        )
    )
    await db_session.commit()

    async def override_admin():
        return admin

    app.dependency_overrides[require_admin] = override_admin

    created = await api_client.post(
        "/admin/categories",
        json={"name": "Нагрузки средней интенсивности"},
    )
    assert created.status_code == 201
    new_id = created.json()["id"]
    assert created.json()["sort_order"] == 2

    renamed = await api_client.put(
        f"/admin/categories/{category.id}",
        json={"name": "Искусство"},
    )
    assert renamed.status_code == 200

    club_result = await db_session.execute(select(Club).where(Club.title == "Painting"))
    club = club_result.scalar_one()
    assert club.category == "Искусство"

    blocked = await api_client.delete(f"/admin/categories/{category.id}")
    assert blocked.status_code == 409

    deleted_new = await api_client.delete(f"/admin/categories/{new_id}")
    assert deleted_new.status_code == 204

    reorder = await api_client.put(
        "/admin/categories/reorder",
        json={"ordered_ids": [new_id, category.id]},
    )
    assert reorder.status_code == 200
    assert [item["id"] for item in reorder.json()] == [new_id, category.id]

    app.dependency_overrides.clear()


@pytest.mark.integration
@pytest.mark.asyncio
async def test_create_club_rejects_unknown_category(api_client, db_session):
    teacher = User(username="teacher_cat2", full_name="Teacher", password_hash="x", is_teacher=True, role="teacher")
    db_session.add(teacher)
    await db_session.commit()

    async def override_teacher():
        return teacher

    app.dependency_overrides[get_current_user] = override_teacher

    response = await api_client.post(
        "/clubs/",
        json={
            "title": "New club",
            "description": "desc",
            "category": "Несуществующая категория",
            "max_students": 10,
        },
    )
    app.dependency_overrides.clear()

    assert response.status_code == 400
    assert "Категория не найдена" in response.json()["detail"]
