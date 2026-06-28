def score_to_severity(score: float) -> str:
    if score >= 85:
        return "critical"
    if score >= 65:
        return "high"
    if score >= 40:
        return "medium"
    return "low"


def calculate_risk(confidence: float, rules_score: float, intel_hit: bool) -> float:
    total = confidence * 60 + min(rules_score, 40) + (10 if intel_hit else 0)
    return round(min(total, 100.0), 2)

