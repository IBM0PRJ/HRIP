from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from hrip_shared.broker import RedisStreamBroker
from hrip_shared.db.models import OutboxEvent


async def flush_outbox(session: AsyncSession, broker: RedisStreamBroker, limit: int = 50) -> int:
    result = await session.execute(
        select(OutboxEvent).where(OutboxEvent.published_at.is_(None)).order_by(OutboxEvent.created_at).limit(limit)
    )
    rows = list(result.scalars())
    for row in rows:
        await broker.publish(row.stream_name, row.payload, event_id=row.id)
        row.published_at = datetime.now(UTC)
    await session.commit()
    return len(rows)

