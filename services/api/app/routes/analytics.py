from collections import Counter, defaultdict

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from hrip_shared.auth.jwt import require_token
from hrip_shared.db import Alert, Detection, DetectionFeature, Message, RiskEvent, User, get_db

router = APIRouter(prefix="/api/v1", tags=["analytics"], dependencies=[Depends(require_token)])

ALLOWED_ALERT_STATUSES = {"open", "investigating", "resolved", "false_positive"}


def _priority_rank(priority: str) -> int:
    order = {"critical": 4, "high": 3, "medium": 2, "low": 1}
    return order.get(priority, 1)


def _severity_label(score: float) -> str:
    if score >= 85:
        return "critical"
    if score >= 65:
        return "high"
    if score >= 40:
        return "medium"
    return "low"


def _build_recommendations(
    *,
    risk_score: float,
    department: str,
    alert_rows: list[tuple[Alert, Detection, Message]],
) -> dict:
    channel_counts = Counter(message.channel for _, _, message in alert_rows)
    threat_counts = Counter(detection.threat_type for _, detection, _ in alert_rows)
    open_count = sum(1 for alert, _, _ in alert_rows if alert.status in {"open", "investigating"})
    high_impact_count = sum(1 for alert, _, _ in alert_rows if alert.severity in {"high", "critical"})
    evidence_base = [
        f"Current user risk score: {risk_score:.1f}",
        f"Recent alerts reviewed: {len(alert_rows)}",
    ]
    recommendations: list[dict] = []

    if risk_score >= 80 or threat_counts.get("CEO_fraud", 0) > 0:
        recommendations.append(
            {
                "title": "Executive impersonation and payment authorization drill",
                "priority": "critical" if risk_score >= 85 else "high",
                "focus_area": "payment fraud",
                "summary": "Reinforce callback verification and dual approval before any urgent financial request is processed.",
                "actions": [
                    "Require an out-of-band callback for banking changes and transfer requests.",
                    "Run a 15-minute CEO fraud simulation with finance approvers.",
                    "Review dual-approval escalation for high-value payments this week.",
                ],
                "evidence": evidence_base
                + [
                    f"Executive impersonation alerts: {threat_counts.get('CEO_fraud', 0)}",
                    f"Department: {department}",
                ],
                "due_in_days": 2,
            }
        )

    if channel_counts.get("email", 0) > 0:
        recommendations.append(
            {
                "title": "Email sender verification refresher",
                "priority": "high" if high_impact_count else "medium",
                "focus_area": "email hygiene",
                "summary": "Improve sender-domain inspection, link scrutiny, and escalation for urgent requests delivered by email.",
                "actions": [
                    "Coach the employee to verify sender domains before opening requests.",
                    "Review the latest phishing indicators found in the alert queue.",
                    "Reinforce reporting workflow for suspicious links and attachment prompts.",
                ],
                "evidence": evidence_base + [f"Email-driven alerts: {channel_counts.get('email', 0)}"],
                "due_in_days": 5,
            }
        )

    if channel_counts.get("sms", 0) > 0:
        recommendations.append(
            {
                "title": "Mobile smishing awareness module",
                "priority": "high" if channel_counts.get("sms", 0) >= 2 else "medium",
                "focus_area": "mobile security",
                "summary": "Target mobile-first deception patterns such as KYC resets, SIM swap prompts, and OTP harvesting.",
                "actions": [
                    "Review how to validate telecom, banking, and KYC requests received by SMS.",
                    "Train on never sharing OTPs or tapping urgent shortened links from messages.",
                    "Add a one-click report path for suspicious SMS screenshots in the demo workflow.",
                ],
                "evidence": evidence_base + [f"SMS-driven alerts: {channel_counts.get('sms', 0)}"],
                "due_in_days": 7,
            }
        )

    if channel_counts.get("voice", 0) > 0:
        recommendations.append(
            {
                "title": "Voice callback verification coaching",
                "priority": "medium",
                "focus_area": "vishing defense",
                "summary": "Strengthen resistance to voice-based urgency, spoofed authority, and MFA reset scams.",
                "actions": [
                    "Practice ending suspicious calls and calling back through trusted numbers.",
                    "Review escalation for MFA reset or privileged access requests made over voice.",
                    "Document approved phone verification steps for service-desk scenarios.",
                ],
                "evidence": evidence_base + [f"Voice-driven alerts: {channel_counts.get('voice', 0)}"],
                "due_in_days": 10,
            }
        )

    if open_count >= 2 or risk_score >= 70:
        recommendations.append(
            {
                "title": "Manager follow-up and targeted retraining",
                "priority": "high" if risk_score >= 70 else "medium",
                "focus_area": "behavior reinforcement",
                "summary": "Pair awareness training with direct follow-up so unresolved risky behavior is addressed promptly.",
                "actions": [
                    "Schedule a manager-led review of the employee's recent alert history.",
                    "Re-test the employee with one targeted phishing scenario after training completion.",
                    "Track status until all active alerts move from open to resolved or false positive.",
                ],
                "evidence": evidence_base + [f"Open or investigating alerts: {open_count}"],
                "due_in_days": 3,
            }
        )

    if not recommendations:
        recommendations.append(
            {
                "title": "Baseline phishing hygiene reinforcement",
                "priority": "low",
                "focus_area": "general awareness",
                "summary": "Maintain low risk posture with lightweight refresher training and reporting drills.",
                "actions": [
                    "Complete the quarterly phishing hygiene refresher.",
                    "Review how to report suspicious messages across email, SMS, and voice.",
                    "Repeat a low-friction simulation next month to confirm retention.",
                ],
                "evidence": evidence_base,
                "due_in_days": 14,
            }
        )

    recommendations.sort(key=lambda item: _priority_rank(item["priority"]), reverse=True)
    top_priority = recommendations[0]["priority"]
    summary = (
        f"{department} user with {_severity_label(risk_score)} exposure across "
        f"{', '.join(sorted(channel_counts)) if channel_counts else 'no active channels'}."
    )
    return {
        "overall_priority": top_priority,
        "summary": summary,
        "items": recommendations[:4],
    }


class AlertStatusUpdate(BaseModel):
    status: str


@router.get("/alerts")
async def list_alerts(
    severity: str | None = Query(default=None),
    status: str | None = Query(default=None),
    channel: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    query = (
        select(Alert, Detection, Message)
        .join(Detection, Detection.id == Alert.detection_id)
        .join(Message, Message.id == Alert.message_id)
        .order_by(desc(Alert.created_at))
    )
    if severity:
        query = query.where(Alert.severity == severity)
    if status:
        query = query.where(Alert.status == status)
    if channel:
        query = query.where(Message.channel == channel)
    result = await db.execute(query)
    rows = result.all()
    return [
        {
            "id": alert.id,
            "severity": alert.severity,
            "status": alert.status,
            "created_at": alert.created_at,
            "channel": message.channel,
            "threat_type": detection.threat_type,
            "confidence": detection.confidence,
            "sender": message.sender,
            "receiver": message.receiver,
            "subject": message.subject,
        }
        for alert, detection, message in rows
    ]


@router.get("/alerts/{alert_id}")
async def get_alert(alert_id: str, db: AsyncSession = Depends(get_db)) -> dict:
    result = await db.execute(
        select(Alert, Detection, Message)
        .join(Detection, Detection.id == Alert.detection_id)
        .join(Message, Message.id == Alert.message_id)
        .where(Alert.id == alert_id)
    )
    alert, detection, message = result.one()
    features_result = await db.execute(
        select(DetectionFeature).where(DetectionFeature.detection_id == detection.id)
    )
    features = features_result.scalars().all()
    return {
        "alert": {
            "id": alert.id,
            "severity": alert.severity,
            "status": alert.status,
            "created_at": alert.created_at,
            "user_id": alert.user_id,
        },
        "message": {
            "id": message.id,
            "channel": message.channel,
            "sender": message.sender,
            "receiver": message.receiver,
            "subject": message.subject,
            "body": message.body,
        },
        "detection": {
            "id": detection.id,
            "threat_type": detection.threat_type,
            "confidence": detection.confidence,
            "model_used": detection.model_used,
            "psychology_scores": detection.psychology_scores,
            "features": [
                {
                    "feature_name": feature.feature_name,
                    "feature_value": feature.feature_value,
                    "shap_contribution": feature.shap_contribution,
                }
                for feature in features
            ],
        },
    }


@router.patch("/alerts/{alert_id}")
async def update_alert_status(alert_id: str, payload: AlertStatusUpdate, db: AsyncSession = Depends(get_db)) -> dict:
    if payload.status not in ALLOWED_ALERT_STATUSES:
        raise HTTPException(status_code=400, detail="Unsupported alert status")
    alert = await db.get(Alert, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = payload.status
    await db.commit()
    await db.refresh(alert)
    return {
        "id": alert.id,
        "status": alert.status,
        "severity": alert.severity,
        "created_at": alert.created_at,
    }


@router.get("/dashboard/overview")
async def dashboard_overview(db: AsyncSession = Depends(get_db)) -> dict:
    alert_count = await db.scalar(select(func.count()).select_from(Alert))
    high_alerts = await db.scalar(select(func.count()).select_from(Alert).where(Alert.severity.in_(["high", "critical"])))
    user_count = await db.scalar(select(func.count()).select_from(User))
    avg_risk = await db.scalar(select(func.avg(User.risk_score)))
    return {
        "organization_risk_score": round(avg_risk or 0, 2),
        "total_alerts": alert_count or 0,
        "high_priority_alerts": high_alerts or 0,
        "users_tracked": user_count or 0,
    }


@router.get("/dashboard/activity")
async def dashboard_activity(db: AsyncSession = Depends(get_db)) -> list[dict]:
    result = await db.execute(
        select(Message, Detection, Alert, User)
        .outerjoin(Detection, Detection.message_id == Message.id)
        .outerjoin(Alert, Alert.message_id == Message.id)
        .outerjoin(User, User.id == Alert.user_id)
        .order_by(desc(Message.ingested_at))
        .limit(12)
    )
    rows = result.all()
    return [
        {
            "message_id": message.id,
            "alert_id": alert.id if alert else None,
            "user_id": user.id if user else None,
            "channel": message.channel,
            "sender": message.sender,
            "receiver": message.receiver,
            "subject": message.subject,
            "ingested_at": message.ingested_at,
            "threat_type": detection.threat_type if detection else "pending",
            "confidence": detection.confidence if detection else 0.0,
            "alert_status": alert.status if alert else "pending",
            "severity": alert.severity if alert else None,
        }
        for message, detection, alert, user in rows
    ]


@router.get("/messages/{message_id}/tracking")
async def message_tracking(message_id: str, db: AsyncSession = Depends(get_db)) -> dict:
    result = await db.execute(
        select(Message, Detection, Alert, User)
        .outerjoin(Detection, Detection.message_id == Message.id)
        .outerjoin(Alert, Alert.message_id == Message.id)
        .outerjoin(User, User.id == Alert.user_id)
        .where(Message.id == message_id)
    )
    row = result.one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Message not found")
    message, detection, alert, user = row
    return {
        "message_id": message.id,
        "channel": message.channel,
        "sender": message.sender,
        "receiver": message.receiver,
        "subject": message.subject,
        "threat_type": detection.threat_type if detection else "pending",
        "confidence": detection.confidence if detection else 0.0,
        "alert_id": alert.id if alert else None,
        "alert_status": alert.status if alert else "pending",
        "severity": alert.severity if alert else None,
        "user_id": user.id if user else None,
    }


@router.get("/users")
async def list_users(db: AsyncSession = Depends(get_db)) -> list[dict]:
    result = await db.execute(select(User).order_by(desc(User.risk_score)))
    return [
        {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "risk_score": user.risk_score,
        }
        for user in result.scalars().all()
    ]


@router.get("/users/{user_id}/profile")
async def user_profile(user_id: str, db: AsyncSession = Depends(get_db)) -> dict:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    risk_history = await db.execute(
        select(RiskEvent).where(RiskEvent.user_id == user_id).order_by(desc(RiskEvent.created_at)).limit(10)
    )
    alerts = await db.execute(
        select(Alert, Detection, Message)
        .join(Detection, Detection.id == Alert.detection_id)
        .join(Message, Message.id == Alert.message_id)
        .where(Alert.user_id == user_id)
        .order_by(desc(Alert.created_at))
        .limit(10)
    )
    alert_rows = alerts.all()
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "department": user.department,
            "risk_score": user.risk_score,
        },
        "risk_history": [
            {"score": event.new_score, "severity": score_to_severity(event.new_score) if "score_to_severity" in globals() else "high", "created_at": event.created_at}
            for event in risk_history.scalars().all()
        ],
        "alerts": [
            {
                "id": alert.id,
                "severity": alert.severity,
                "status": alert.status,
                "created_at": alert.created_at,
                "channel": message.channel,
                "threat_type": detection.threat_type,
            }
            for alert, detection, message in alert_rows
        ],
        "training_plan": _build_recommendations(
            risk_score=user.risk_score,
            department=user.department,
            alert_rows=alert_rows,
        ),
    }
