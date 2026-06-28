from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from hrip_shared.db.models import InboxEvent


async def already_processed(session: AsyncSession, service_name: str, event_key: str) -> bool:
    result = await session.execute(
        select(InboxEvent).where(InboxEvent.service_name == service_name, InboxEvent.event_key == event_key)
    )
    return result.scalar_one_or_none() is not None


async def mark_processed(session: AsyncSession, service_name: str, event_key: str) -> None:
    session.add(InboxEvent(service_name=service_name, event_key=event_key))
    await session.commit()
