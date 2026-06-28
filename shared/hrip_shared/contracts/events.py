from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class AttachmentInfo(BaseModel):
    filename: str
    mime_type: str
    size_bytes: int
    sha256: str | None = None


class MessageMetadataPayload(BaseModel):
    sender_ip: str | None = None
    reply_to: EmailStr | None = None
    attachments: list[AttachmentInfo] = Field(default_factory=list)
    channel_specific: dict[str, Any] = Field(default_factory=dict)


class RawMessageEvent(BaseModel):
    message_id: UUID
    channel: str
    sender: str
    receiver: str
    subject: str | None = None
    body: str
    received_at: datetime
    metadata: MessageMetadataPayload = Field(default_factory=MessageMetadataPayload)


class CleanedMessageEvent(BaseModel):
    message_id: UUID
    channel: str
    cleaned_text: str
    extracted_urls: list[str]
    language: str
    url_count: int
    attachment_count: int
    attachment_scan: dict[str, Any] = Field(default_factory=dict)
    sender_domain: str | None = None
    domain_age_days: int | None = None
    original_metadata: dict[str, Any] = Field(default_factory=dict)


class DetectionEvent(BaseModel):
    message_id: UUID
    detection_id: UUID
    threat_type: str
    confidence: float
    model_used: str
    rules_score: float
    lgbm_confidence: float
    roberta_confidence: float = 0.0
    intel_hit: bool = False
    shap_features: list[dict[str, Any]] = Field(default_factory=list)
    psychology_scores: dict[str, float] = Field(default_factory=dict)


class RiskEvent(BaseModel):
    message_id: UUID
    user_id: UUID
    alert_id: UUID
    risk_score: float
    severity: str
    threat_type: str
    created_at: datetime

