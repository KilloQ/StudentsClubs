"""
Скрипт для инициализации базы данных и создания начальных данных
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.db.models import Base, User
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
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:

        from sqlalchemy import select
        result = await session.execute(select(User).where(User.is_teacher == True))
        existing_teacher = result.scalar_one_or_none()
        
        if not existing_teacher:

            teacher = User(
                username="teacher",
                full_name="Иванов Сергей Петрович",
                password_hash=get_password_hash("teacher123"),
                is_teacher=True
            )
            session.add(teacher)
            await session.commit()
            print("Преподаватель создан: username=teacher, password=teacher123")
        else:
            print("Преподаватель уже существует")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_db())

