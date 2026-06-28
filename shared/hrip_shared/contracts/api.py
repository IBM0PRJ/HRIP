from typing import Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorEnvelope(BaseModel):
    code: str
    message: str


class StandardResponse(BaseModel, Generic[T]):
    status: str = "ok"
    correlation_id: UUID
    data: T | None = None
    error: ErrorEnvelope | None = None


class IdResponse(BaseModel):
    message_id: UUID | None = None
    resource_id: UUID | None = None
    status: str = "queued"
    correlation_id: UUID = Field(...)

