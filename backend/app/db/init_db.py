import asyncio
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.db.models import Base, User, ClubCategory
from app.api.auth import get_password_hash
from app.core.config import settings

async def init_db():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif not db_url.startswith("postgresql+asyncpg://"):
        db_url = f"postgresql+asyncpg://{db_url.split('://')[1]}" if "://" in db_url else f"postgresql+asyncpg://{db_url}"

    engine = create_async_engine(db_url, echo=True)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        try:
            await conn.execute(text("""
                ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'student'
            """))
        except Exception as e:
            print(f"Миграция role (возможно, колонка уже есть): {e}")
        await conn.execute(text("""
            UPDATE users SET role = 'teacher' WHERE is_teacher = true AND (role IS NULL OR role = 'student')
        """))

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        result = await session.execute(select(User).where(User.username == "teacher"))
        existing_teacher = result.scalar_one_or_none()

        if not existing_teacher:
            teacher = User(
                username="teacher",
                full_name="Иванов Сергей Петрович",
                password_hash=get_password_hash("teacher123"),
                is_teacher=True,
                role="teacher",
            )
            session.add(teacher)
            await session.commit()
            print("Преподаватель создан: username=teacher, password=teacher123")
        else:
            if getattr(existing_teacher, "role", None) in (None, "student"):
                existing_teacher.role = "teacher"
                await session.commit()
                print("Роль преподавателя обновлена для существующего teacher")
            else:
                print("Преподаватель уже существует")

        admin_result = await session.execute(select(User).where(User.username == "admin"))
        existing_admin = admin_result.scalar_one_or_none()
        if not existing_admin:
            admin = User(
                username="admin",
                full_name="Администратор",
                password_hash=get_password_hash("admin123"),
                is_teacher=True,
                role="admin",
            )
            session.add(admin)
            await session.commit()
            print("Администратор создан: username=admin, password=admin123")
        else:
            if getattr(existing_admin, "role", None) != "admin":
                existing_admin.role = "admin"
                existing_admin.is_teacher = True
                await session.commit()
                print("Роль admin установлена для существующего admin")
            else:
                print("Администратор уже существует")

        default_categories = [
            ("Творчество", 1),
            ("Активные виды спорта", 2),
            ("Командные игры", 3),
            ("Нагрузки высокой интенсивности", 4),
            ("Нагрузки низкой интенсивности", 5),
        ]
        for name, sort_order in default_categories:
            exists = await session.execute(select(ClubCategory).where(ClubCategory.name == name))
            if exists.scalar_one_or_none() is None:
                session.add(ClubCategory(name=name, sort_order=sort_order))
        await session.commit()

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(init_db())

