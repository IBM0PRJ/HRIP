from datetime import UTC, datetime, timedelta
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from hrip_shared.auth.passwords import hash_password

from .models import Alert, Detection, DetectionFeature, Message, MessageMetadata, RiskScore, User


async def seed_demo_data(session: AsyncSession) -> None:
    existing = await session.execute(select(User.id).where(User.email != "admin@example.com").limit(1))
    if existing.first():
        return

    users = [
        User(
            id=str(uuid4()),
            email="analyst@example.com",
            full_name="Asha Analyst",
            role="analyst",
            department="Security Operations",
            privilege="elevated",
            password_hash=hash_password("Analyst123!"),
            risk_score=28.0,
        ),
        User(
            id=str(uuid4()),
            email="cfo@example.com",
            full_name="Rohan Finance",
            role="employee",
            department="Finance",
            privilege="standard",
            password_hash=hash_password("Employee123!"),
            risk_score=91.0,
        ),
        User(
            id=str(uuid4()),
            email="ops.manager@example.com",
            full_name="Meera Ops",
            role="employee",
            department="Operations",
            privilege="standard",
            password_hash=hash_password("Employee123!"),
            risk_score=62.0,
        ),
    ]
    session.add_all(users)
    await session.flush()

    now = datetime.now(UTC)
    demo_messages = [
        {
            "sender": "ceo@acme-payments.com",
            "receiver": users[1].email,
            "subject": "Urgent wire transfer",
            "body": "Urgent wire transfer required. Click here to review the banking change.",
            "channel": "email",
            "threat_type": "CEO_fraud",
            "confidence": 0.94,
            "severity": "critical",
            "risk": 96.4,
        },
        {
            "sender": "alerts@trai-notify.in",
            "receiver": users[2].email,
            "subject": None,
            "body": "Your SIM block request starts today. Complete KYC now.",
            "channel": "sms",
            "threat_type": "smishing",
            "confidence": 0.83,
            "severity": "high",
            "risk": 72.0,
        },
    ]

    for index, demo in enumerate(demo_messages):
        message = Message(
            id=str(uuid4()),
            sender=demo["sender"],
            receiver=demo["receiver"],
            subject=demo["subject"],
            body=demo["body"],
            channel=demo["channel"],
            received_at=now - timedelta(days=index),
            ingested_at=now - timedelta(days=index),
        )
        session.add(message)
        session.add(
            MessageMetadata(
                id=str(uuid4()),
                message_id=message.id,
                sender_domain=demo["sender"].split("@")[-1] if "@" in demo["sender"] else None,
                reply_to=None,
                url_count=1 if "Click here" in demo["body"] else 0,
                attachment_count=0,
                domain_age_days=7,
                language="en",
                channel_meta={},
                pii_retention_days=30,
                redaction_status="raw",
            )
        )
        detection = Detection(
            id=str(uuid4()),
            message_id=message.id,
            threat_type=demo["threat_type"],
            confidence=demo["confidence"],
            model_used="lgbm",
            rules_score=72.0 if demo["channel"] == "email" else 61.0,
            lgbm_confidence=demo["confidence"],
            roberta_confidence=0.0,
            intel_hit=demo["channel"] == "email",
            psychology_scores={
                "urgency": 0.92,
                "authority": 0.81,
                "fear": 0.47,
                "financial": 0.88,
                "secrecy": 0.61,
                "scarcity": 0.34,
            },
            detected_at=now - timedelta(days=index),
        )
        session.add(detection)
        session.add_all(
            [
                DetectionFeature(
                    id=str(uuid4()),
                    detection_id=detection.id,
                    feature_name="urgency_language",
                    feature_value=0.92,
                    shap_contribution=0.28,
                ),
                DetectionFeature(
                    id=str(uuid4()),
                    detection_id=detection.id,
                    feature_name="new_sender_domain",
                    feature_value=1.0,
                    shap_contribution=0.24,
                ),
                DetectionFeature(
                    id=str(uuid4()),
                    detection_id=detection.id,
                    feature_name="financial_request",
                    feature_value=0.85,
                    shap_contribution=0.22,
                ),
            ]
        )
        receiver = users[1] if demo["receiver"] == users[1].email else users[2]
        alert = Alert(
            id=str(uuid4()),
            message_id=message.id,
            detection_id=detection.id,
            user_id=receiver.id,
            severity=demo["severity"],
            status="open",
            created_at=now - timedelta(days=index),
        )
        session.add(alert)
        session.add(
            RiskScore(
                id=str(uuid4()),
                user_id=receiver.id,
                score=demo["risk"],
                severity=demo["severity"],
                created_at=now - timedelta(days=index),
            )
        )

    await session.commit()
