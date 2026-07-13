SEVERITY_DELTAS = {
    "phishing_confirmed": 35,
    "bec_fraud": 30,
    "usb_mass_copy": 25,
    "file_mass_download": 20,
    "usb_unknown_device": 20,
    "unusual_login": 15,
    "suspicious_link_clicked": 15,
    "suspicious_chat": 10,
    "failed_logins": 10,
    "training_passed": -20,
}

def score_to_severity(score: float) -> str:
    if score >= 86:
        return "critical"
    if score >= 61:
        return "high_risk"
    if score >= 31:
        return "caution"
    return "safe"

def score_to_access_level(score: float) -> str:
    if score >= 86:
        return "suspended"
    if score >= 61:
        return "blocked"
    if score >= 31:
        return "read_only"
    return "full"

def apply_time_decay(current_score: float, days_clean: int) -> float:
    return max(0.0, current_score - (days_clean * 5.0))

def calculate_new_score(current: float, delta: float) -> float:
    return round(min(max(current + delta, 0.0), 100.0), 2)

