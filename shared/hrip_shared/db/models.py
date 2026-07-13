from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from .base import Base

JSONType = JSON().with_variant(JSONB, "postgresql")


def utcnow() -> datetime:
    return datetime.now(UTC)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(50), default="analyst")
    department: Mapped[str] = mapped_column(String(100), default="security")
    privilege: Mapped[str] = mapped_column(String(50), default="standard")
    password_hash: Mapped[str] = mapped_column(String(255))
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    risk_tier: Mapped[str] = mapped_column(String(20), default="safe")
    data_access_level: Mapped[str] = mapped_column(String(20), default="full")
    score_manually_set: Mapped[bool] = mapped_column(Boolean, default=False)
    score_override_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    score_override_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    score_override_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    sender: Mapped[str] = mapped_column(String(255))
    receiver: Mapped[str] = mapped_column(String(255))
    subject: Mapped[str | None] = mapped_column(String(500), nullable=True)
    body: Mapped[str] = mapped_column(Text)
    channel: Mapped[str] = mapped_column(String(50))
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ingested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    metadata_row: Mapped["MessageMetadata"] = relationship(back_populates="message", uselist=False)


class MessageMetadata(Base):
    __tablename__ = "message_metadata"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    message_id: Mapped[str] = mapped_column(ForeignKey("messages.id"), unique=True)
    sender_domain: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reply_to: Mapped[str | None] = mapped_column(String(255), nullable=True)
    url_count: Mapped[int] = mapped_column(Integer, default=0)
    attachment_count: Mapped[int] = mapped_column(Integer, default=0)
    domain_age_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    language: Mapped[str | None] = mapped_column(String(20), nullable=True)
    channel_meta: Mapped[dict] = mapped_column(JSONType, default=dict)
    pii_retention_days: Mapped[int] = mapped_column(Integer, default=30)
    redaction_status: Mapped[str] = mapped_column(String(50), default="raw")

    message: Mapped[Message] = relationship(back_populates="metadata_row")


class Detection(Base):
    __tablename__ = "detections"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    message_id: Mapped[str] = mapped_column(ForeignKey("messages.id"), index=True)
    threat_type: Mapped[str] = mapped_column(String(50))
    confidence: Mapped[float] = mapped_column(Float)
    model_used: Mapped[str] = mapped_column(String(50))
    rules_score: Mapped[float] = mapped_column(Float, default=0.0)
    lgbm_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    roberta_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    intel_hit: Mapped[bool] = mapped_column(Boolean, default=False)
    psychology_scores: Mapped[dict] = mapped_column(JSONType, default=dict)
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class DetectionFeature(Base):
    __tablename__ = "detection_features"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    detection_id: Mapped[str] = mapped_column(ForeignKey("detections.id"), index=True)
    feature_name: Mapped[str] = mapped_column(String(100))
    feature_value: Mapped[float] = mapped_column(Float)
    feature_string: Mapped[str | None] = mapped_column(Text, nullable=True)
    shap_contribution: Mapped[float] = mapped_column(Float)


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    message_id: Mapped[str] = mapped_column(ForeignKey("messages.id"), unique=True)
    detection_id: Mapped[str] = mapped_column(ForeignKey("detections.id"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    severity: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), default="open")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    score: Mapped[float] = mapped_column(Float)
    severity: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class RiskEvent(Base):
    __tablename__ = "risk_events"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    source: Mapped[str] = mapped_column(String(50))  # "detection", "usb", "login", "file_access", "training_passed", "analyst_override", "time_decay"
    old_score: Mapped[float] = mapped_column(Float)
    new_score: Mapped[float] = mapped_column(Float)
    delta: Mapped[float] = mapped_column(Float)
    analyst_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class TrainingModule(Base):
    __tablename__ = "training_modules"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    title: Mapped[str] = mapped_column(String(255))
    threat_type: Mapped[str] = mapped_column(String(50), unique=True)
    video_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    reading_material_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    quiz_json: Mapped[dict] = mapped_column(JSONType, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class TrainingAssignment(Base):
    __tablename__ = "training_assignments"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    module_id: Mapped[str] = mapped_column(ForeignKey("training_modules.id"))
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    quiz_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    passed: Mapped[bool] = mapped_column(Boolean, default=False)


class OutboxEvent(Base):
    __tablename__ = "outbox_events"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    aggregate_id: Mapped[str] = mapped_column(String(100), index=True)
    stream_name: Mapped[str] = mapped_column(String(100))
    payload: Mapped[dict] = mapped_column(JSONType)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class InboxEvent(Base):
    __tablename__ = "inbox_events"
    __table_args__ = (UniqueConstraint("service_name", "event_key", name="uq_inbox_service_event"),)

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    service_name: Mapped[str] = mapped_column(String(100))
    event_key: Mapped[str] = mapped_column(String(255))
    processed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    token_hash: Mapped[str] = mapped_column(String(255), unique=True)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class AIFlag(Base):
    __tablename__ = "ai_flags"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    source: Mapped[str] = mapped_column(String(50))  # "usb", "network", "file_access", "clipboard", "login"
    event_data: Mapped[dict] = mapped_column(JSONType, default=dict)  # raw event payload
    suspicion_score: Mapped[float] = mapped_column(Float)
    threat_category: Mapped[str] = mapped_column(String(100))
    evidence_items: Mapped[dict] = mapped_column(JSONType, default=list)  # list of evidence strings
    employee_context: Mapped[dict] = mapped_column(JSONType, default=dict)  # risk_score, recent_flags, etc.
    recommended_action: Mapped[str | None] = mapped_column(Text, nullable=True)
    qwen_reasoning: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, confirmed, dismissed, escalated
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_by: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class AnalystAction(Base):
    __tablename__ = "analyst_actions"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    flag_id: Mapped[str] = mapped_column(ForeignKey("ai_flags.id"), index=True)
    action_type: Mapped[str] = mapped_column(String(50))  # session_suspend, usb_block, network_disconnect, file_quarantine, notify, training
    payload: Mapped[dict] = mapped_column(JSONType, default=dict)  # custom message, device_id, duration, etc.
    executed_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    executed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
