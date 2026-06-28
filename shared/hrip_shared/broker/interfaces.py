from abc import ABC, abstractmethod
from collections.abc import Callable


class EventPublisher(ABC):
    @abstractmethod
    async def publish(self, stream: str, payload: dict, event_id: str | None = None) -> str:
        raise NotImplementedError


class EventConsumer(ABC):
    @abstractmethod
    async def consume_forever(self, stream: str, group: str, consumer: str, handler: Callable) -> None:
        raise NotImplementedError

