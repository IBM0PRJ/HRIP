import asyncio
from collections.abc import AsyncGenerator

from sqlalchemy import select
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from hrip_shared.settings import get_settings

from .base import Base
from .models import User

settings = get_settings()
engine = create_async_engine(settings.database_url, future=True, echo=False)
session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def wait_for_db() -> None:
    last_error: Exception | None = None
    for _ in range(30):
        try:
            async with engine.connect() as conn:
                await conn.execute(select(1))
            last_error = None
            break
        except (ConnectionRefusedError, OSError, OperationalError) as exc:
            last_error = exc
            await asyncio.sleep(2)
    if last_error is not None:
        raise last_error


async def init_db() -> None:
    await wait_for_db()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await ensure_admin_user()


async def ensure_admin_user() -> None:
    async with session_factory() as session:
        result = await session.execute(select(User).where(User.email == settings.default_admin_email))
        user = result.scalar_one_or_none()
        if user is None:
            from hrip_shared.auth.passwords import hash_password

            session.add(
                User(
                    email=settings.default_admin_email,
                    full_name="HRIP Admin",
                    role="admin",
                    department="security",
                    privilege="elevated",
                    password_hash=hash_password(settings.default_admin_password),
                )
            )
            await session.commit()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with session_factory() as session:
        yield session
