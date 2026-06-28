from services.detection.app.engine.rules import baseline_lgbm_confidence, classify_threat, rules_score


def test_rules_score_detects_urgent_wire_transfer() -> None:
    score, psychology = rules_score("Urgent wire transfer required. Click here now.")
    assert score >= 60
    assert psychology["urgency"] > 0


def test_classifier_flags_sms_smishing() -> None:
    threat = classify_threat("Complete KYC now or your SIM block request starts.", "sms", False)
    assert threat == "smishing"


def test_baseline_confidence_stays_bounded() -> None:
    confidence = baseline_lgbm_confidence("verify your account", 2, 50)
    assert 0 < confidence <= 0.98

