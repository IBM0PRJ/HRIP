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


class USBEvent(BaseModel):
    event_id: UUID
    username: str
    device_name: str | None = None
    vid_pid: str | None = None
    action: str  # "connected", "file_copied"
    file_size_bytes: int | None = None
    timestamp: datetime


class LoginEvent(BaseModel):
    event_id: UUID
    username: str
    ip_address: str | None = None
    status: str  # "success", "failed"
    reason: str | None = None
    timestamp: datetime


class FileAccessEvent(BaseModel):
    event_id: UUID
    username: str
    file_path: str
    action: str  # "read", "write", "mass_download"
    timestamp: datetime


class ChatEvent(BaseModel):
    event_id: UUID
    username: str
    platform: str
    message_text: str
    timestamp: datetime


class ClipboardEvent(BaseModel):
    event_id: UUID
    username: str
    content_type: str  # "text", "image", "file_path", "credential_pattern"
    size_bytes: int = 0
    patterns_detected: list[str] = Field(default_factory=list)  # "credit_card", "api_key", "password", "pii"
    source_app: str | None = None
    dest_app: str | None = None
    timestamp: datetime


class AIFlagEvent(BaseModel):
    flag_id: UUID
    user_id: UUID
    source: str
    suspicion_score: float
    threat_category: str
    evidence_items: list[str] = Field(default_factory=list)
    recommended_action: str | None = None
    created_at: datetime
