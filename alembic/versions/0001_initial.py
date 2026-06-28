"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-06-27
"""

from alembic import op
import sqlalchemy as sa


revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("department", sa.String(length=100), nullable=False),
        sa.Column("privilege", sa.String(length=50), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("risk_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=False)

    op.create_table(
        "messages",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("sender", sa.String(length=255), nullable=False),
        sa.Column("receiver", sa.String(length=255), nullable=False),
        sa.Column("subject", sa.String(length=500), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("channel", sa.String(length=50), nullable=False),
        sa.Column("received_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ingested_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "message_metadata",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("message_id", sa.String(length=36), sa.ForeignKey("messages.id"), nullable=False),
        sa.Column("sender_domain", sa.String(length=255), nullable=True),
        sa.Column("reply_to", sa.String(length=255), nullable=True),
        sa.Column("url_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("attachment_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("domain_age_days", sa.Integer(), nullable=True),
        sa.Column("language", sa.String(length=20), nullable=True),
        sa.Column("channel_meta", sa.JSON(), nullable=False),
        sa.Column("pii_retention_days", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("redaction_status", sa.String(length=50), nullable=False, server_default="raw"),
        sa.UniqueConstraint("message_id"),
    )

    op.create_table(
        "detections",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("message_id", sa.String(length=36), sa.ForeignKey("messages.id"), nullable=False),
        sa.Column("threat_type", sa.String(length=50), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("model_used", sa.String(length=50), nullable=False),
        sa.Column("rules_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("lgbm_confidence", sa.Float(), nullable=False, server_default="0"),
        sa.Column("roberta_confidence", sa.Float(), nullable=False, server_default="0"),
        sa.Column("intel_hit", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("psychology_scores", sa.JSON(), nullable=False),
        sa.Column("detected_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_detections_message_id", "detections", ["message_id"], unique=False)

    op.create_table(
        "detection_features",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("detection_id", sa.String(length=36), sa.ForeignKey("detections.id"), nullable=False),
        sa.Column("feature_name", sa.String(length=100), nullable=False),
        sa.Column("feature_value", sa.Float(), nullable=False),
        sa.Column("shap_contribution", sa.Float(), nullable=False),
    )
    op.create_index("ix_detection_features_detection_id", "detection_features", ["detection_id"], unique=False)

    op.create_table(
        "risk_scores",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_risk_scores_user_id", "risk_scores", ["user_id"], unique=False)

    op.create_table(
        "alerts",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("message_id", sa.String(length=36), sa.ForeignKey("messages.id"), nullable=False),
        sa.Column("detection_id", sa.String(length=36), sa.ForeignKey("detections.id"), nullable=False),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="open"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("message_id"),
    )

    op.create_table(
        "outbox_events",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("aggregate_id", sa.String(length=100), nullable=False),
        sa.Column("stream_name", sa.String(length=100), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_outbox_events_aggregate_id", "outbox_events", ["aggregate_id"], unique=False)

    op.create_table(
        "inbox_events",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("service_name", sa.String(length=100), nullable=False),
        sa.Column("event_key", sa.String(length=255), nullable=False),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("service_name", "event_key", name="uq_inbox_service_event"),
    )

    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("token_hash", sa.String(length=255), nullable=False),
        sa.Column("revoked", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("token_hash"),
    )


def downgrade() -> None:
    op.drop_table("refresh_tokens")
    op.drop_table("inbox_events")
    op.drop_index("ix_outbox_events_aggregate_id", table_name="outbox_events")
    op.drop_table("outbox_events")
    op.drop_table("alerts")
    op.drop_index("ix_risk_scores_user_id", table_name="risk_scores")
    op.drop_table("risk_scores")
    op.drop_index("ix_detection_features_detection_id", table_name="detection_features")
    op.drop_table("detection_features")
    op.drop_index("ix_detections_message_id", table_name="detections")
    op.drop_table("detections")
    op.drop_table("message_metadata")
    op.drop_table("messages")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
