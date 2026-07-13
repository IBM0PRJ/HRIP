import asyncio
import json
from collections.abc import Callable

from redis.asyncio import Redis

from hrip_shared.settings import get_settings

from .interfaces import EventConsumer, EventPublisher


class RedisStreamBroker(EventPublisher, EventConsumer):
    def __init__(self, redis_url: str | None = None) -> None:
        self.redis_url = redis_url or get_settings().redis_url
        self._redis = None

    @property
    def redis(self) -> Redis:
        if self._redis is None:
            self._redis = Redis.from_url(self.redis_url, decode_responses=True)
        return self._redis

    async def publish(self, stream: str, payload: dict, event_id: str | None = None) -> str:
        event_payload = {"payload": json.dumps(payload), "event_id": event_id or payload.get("message_id", "")}
        return await self.redis.xadd(stream, event_payload)

    async def ensure_group(self, stream: str, group: str) -> None:
        try:
            await self.redis.xgroup_create(stream, group, id="0", mkstream=True)
        except Exception as exc:  # noqa: BLE001
            if "BUSYGROUP" not in str(exc):
                raise

    async def consume_forever(self, stream: str, group: str, consumer: str, handler: Callable) -> None:
        await self.ensure_group(stream, group)
        while True:
            messages = await self.redis.xreadgroup(group, consumer, {stream: ">"}, count=10, block=1000)
            if not messages:
                await asyncio.sleep(0.1)
                continue
            for _, entries in messages:
                for entry_id, values in entries:
                    print(f"[redis_streams] GOT MESSAGE: {entry_id} for stream {stream}", flush=True)
                    payload = json.loads(values["payload"])
                    await handler(entry_id, payload)
                    await self.redis.xack(stream, group, entry_id)

