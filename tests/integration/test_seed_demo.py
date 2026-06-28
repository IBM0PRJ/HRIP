import pytest
from sqlalchemy import delete, func, select

from hrip_shared.db import Alert, Message, User, init_db, seed_demo_data, session_factory


@pytest.mark.asyncio
async def test_seed_demo_data_populates_core_records() -> None:
    await init_db()
    async with session_factory() as session:
        await session.execute(delete(Alert))
        await session.execute(delete(Message))
        await session.execute(delete(User).where(User.email != "admin@example.com"))
        await session.commit()
        await seed_demo_data(session)

    async with session_factory() as session:
        user_count = await session.scalar(select(func.count()).select_from(User))
        alert_count = await session.scalar(select(func.count()).select_from(Alert))
        assert (user_count or 0) >= 3
        assert (alert_count or 0) >= 2
