from hrip_shared.db import Alert, Detection, Message, User

from services.api.app.routes.analytics import _build_recommendations


def test_recommendations_prioritize_payment_fraud_and_mobile_training() -> None:
    user = User(
        id="user-1",
        email="cfo@example.com",
        full_name="Rohan Finance",
        role="employee",
        department="Finance",
        privilege="standard",
        password_hash="hash",
        risk_score=91.0,
    )
    email_alert = Alert(
        id="alert-1",
        message_id="message-1",
        detection_id="det-1",
        user_id="user-1",
        severity="critical",
        status="open",
    )
    sms_alert = Alert(
        id="alert-2",
        message_id="message-2",
        detection_id="det-2",
        user_id="user-1",
        severity="high",
        status="investigating",
    )
    email_detection = Detection(
        id="det-1",
        message_id="message-1",
        threat_type="CEO_fraud",
        confidence=0.94,
        model_used="lgbm",
    )
    sms_detection = Detection(
        id="det-2",
        message_id="message-2",
        threat_type="smishing",
        confidence=0.81,
        model_used="lgbm",
    )
    email_message = Message(
        id="message-1",
        sender="ceo@spoofed-payments.com",
        receiver="cfo@example.com",
        subject="Urgent transfer",
        body="Transfer funds now",
        channel="email",
        received_at=None,
    )
    sms_message = Message(
        id="message-2",
        sender="TRAI",
        receiver="cfo@example.com",
        subject=None,
        body="KYC pending",
        channel="sms",
        received_at=None,
    )

    training_plan = _build_recommendations(
        risk_score=user.risk_score,
        department=user.department,
        alert_rows=[
            (email_alert, email_detection, email_message),
            (sms_alert, sms_detection, sms_message),
        ],
    )

    assert training_plan["overall_priority"] == "critical"
    assert "Finance user" in training_plan["summary"]
    titles = [item["title"] for item in training_plan["items"]]
    assert "Executive impersonation and payment authorization drill" in titles
    assert "Mobile smishing awareness module" in titles
