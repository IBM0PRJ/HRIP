import math
from pathlib import Path


PHISHING_PATTERNS = {
    "urgent": 18,
    "wire transfer": 30,
    "verify your account": 24,
    "password reset": 18,
    "click here": 16,
    "office365": 18,
    "otp": 20,
    "kyc": 20,
    "sim block": 20,
    "trai": 22,
}


def rules_score(text: str) -> tuple[float, dict[str, float]]:
    lowered = text.lower()
    matched = {pattern: score for pattern, score in PHISHING_PATTERNS.items() if pattern in lowered}
    total = min(sum(matched.values()), 100)
    psycho = {
        "urgency": min(1.0, matched.get("urgent", 0) / 18),
        "authority": 0.8 if "ceo" in lowered or "finance" in lowered else 0.2,
        "fear": 0.7 if "block" in lowered or "suspend" in lowered else 0.1,
        "financial": 0.9 if "wire transfer" in lowered or "invoice" in lowered else 0.1,
        "secrecy": 0.7 if "confidential" in lowered or "privately" in lowered else 0.1,
        "scarcity": 0.8 if "expires today" in lowered else 0.1,
    }
    return total, psycho


def classify_threat(text: str, channel: str, intel_hit: bool) -> str:
    lowered = text.lower()
    if channel == "sms" and any(token in lowered for token in ("trai", "kyc", "sim block")):
        return "smishing"
    if channel == "voice" and "otp" in lowered:
        return "vishing"
    if "wire transfer" in lowered or "bank account" in lowered:
        return "CEO_fraud"
    if intel_hit or any(token in lowered for token in ("verify your account", "office365", "click here")):
        return "phishing"
    return "benign"


def extract_features(text: str) -> list[float]:
    score, psycho = rules_score(text)
    return [
        psycho.get("urgency", 0),
        psycho.get("authority", 0),
        psycho.get("fear", 0),
        psycho.get("financial", 0),
        psycho.get("secrecy", 0),
        psycho.get("scarcity", 0),
        score / 100.0,
        len(text) / 1000.0,
    ]


def optional_roberta_confidence(lgbm_conf: float, enabled: bool) -> float:
    if not enabled or lgbm_conf >= 0.9:
        return 0.0
    return round(min(0.99, lgbm_conf + 0.07), 3)


def intel_matches(urls: list[str]) -> bool:
    indicator_file = Path("data/threat_intel/indicators.txt")
    if not indicator_file.exists():
        return False
    indicators = {line.strip().lower() for line in indicator_file.read_text().splitlines() if line.strip()}
    return any(url.lower() in indicators for url in urls)

