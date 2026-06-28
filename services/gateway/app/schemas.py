from datetime import UTC, datetime
from uuid import UUID, uuid4

from pydantic import BaseModel, EmailStr, Field


class EmailIngestRequest(BaseModel):
    sender: EmailStr
    receiver: EmailStr
    subject: str | None = None
    body: str
    reply_to: EmailStr | None = None
    sender_ip: str | None = None
    received_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class SmsIngestRequest(BaseModel):
    sender: str
    receiver: str
    body: str
    received_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class VoiceIngestResponse(BaseModel):
    status: str
    message_id: UUID
    transcript: str
    correlation_id: UUID = Field(default_factory=uuid4)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str

