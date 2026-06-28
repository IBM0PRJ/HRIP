from services.risk.app.engine.calculator import calculate_risk, score_to_severity


def test_risk_score_critical_threshold() -> None:
    score = calculate_risk(0.95, 40, True)
    assert score >= 85
    assert score_to_severity(score) == "critical"

