import os
import json
import re
import logging
import requests

logger = logging.getLogger(__name__)

LM_STUDIO_URL = os.environ.get("LM_STUDIO_URL", "http://host.docker.internal:1234")
LM_STUDIO_MODEL = os.environ.get("LM_STUDIO_MODEL", "lmstudio-community/Qwen2.5-7B-Instruct-1M")

PROMPT = """You are HRIP Threat Intelligence Engine, a forensic email analyst.

Your job is to determine whether an email is PHISHING or LEGITIMATE.

CRITICAL: You must MINIMIZE FALSE POSITIVES. Many legitimate emails look like phishing:
- Google sends "Your storage is full" — this is REAL, not phishing
- Amazon sends "Your order has shipped — track here" — this is REAL
- Banks send "New login detected from Windows PC" — this is REAL
- Netflix sends "Payment failed, update billing" — this is REAL
- LinkedIn sends "Someone viewed your profile" — this is REAL
- Companies send "50% off limited time!" — this is marketing, NOT phishing

BEFORE scoring, you MUST reason through this 3-phase protocol:

== PHASE 1: LEGITIMACY CHECK ==
Ask yourself these 5 questions:
Q1. Is this a standard service notification? (shipping, billing, security alert, marketing promo)
    If YES — lean toward LEGITIMATE unless there are CLEAR deceptive signals.
Q2. Does the email provide SPECIFIC details? (order ID, last 4 digits of card, device name, username)
    Real services provide specifics. Phishing uses vague "your account", "your transaction".
Q3. Is the greeting personalized? ("Hi Rahul" vs "Dear Customer" vs no greeting)
    Real services usually address you by name. Phishing uses generic greetings.
Q4. Does the call-to-action make sense? ("View your order" vs "CLICK NOW OR LOSE EVERYTHING")
    Real services use calm actions. Phishing creates irrational panic.
Q5. Does the tone INFORM or MANIPULATE?
    Real: "We noticed a new sign-in. If this was you, no action needed."
    Phishing: "UNAUTHORIZED ACCESS! VERIFY IMMEDIATELY OR ACCOUNT WILL BE DELETED!"

== PHASE 2: THREAT ASSESSMENT (only if Phase 1 raises concerns) ==
- Does the email directly ask for passwords or credentials in the body?
- Does it demand immediate action with extreme consequences?
- Is the sender domain suspicious or mismatched with the brand?
- Are there shortened/suspicious URLs that don't match the claimed service?
- Is the grammar broken, inconsistent, or machine-translated?

== PHASE 3: CALIBRATED SCORING ==
Use this calibration guide — your scores MUST align with these:
- Real Google/Amazon/Bank notification with verified sender: threat_probability 0.00 - 0.15
- Marketing/promotional email with urgency language: threat_probability 0.10 - 0.30
- Ambiguous email with some suspicious signals: threat_probability 0.30 - 0.55
- Email with clear deceptive intent but no credential harvesting: threat_probability 0.55 - 0.75
- Email actively requesting credentials with fake urgency: threat_probability 0.75 - 0.90
- Confirmed phishing with spoofed sender and malicious links: threat_probability 0.90 - 1.00

Return a JSON object with EXACTLY these keys:
{
  "urgency_score": <integer 0-10, 0=no urgency, 10=extreme artificial panic>,
  "legitimacy_score": <integer 0-10, 0=clearly genuine, 10=clearly impersonating>,
  "grammar_score": <integer 0-10, 0=professional, 10=very poor/suspicious>,
  "coherence_score": <integer 0-10, 0=fully logical, 10=nonsensical template>,
  "social_engineering_tactics": <list from: ["pretexting","authority_impersonation","fear_appeal","reward_lure","artificial_scarcity","credential_harvesting","false_deadline","trust_exploitation","none_detected"]>,
  "detected_intent": <string from: ["credential_theft", "financial_fraud", "malware_delivery", "coercion", "benign_notification", "marketing", "unknown"]>,
  "threat_probability": <float 0.0-1.0>,
  "reasoning": <string: 2-3 sentence professional assessment. Include the apparent intent, the strongest benign or suspicious evidence, and what factor most influenced the score.>
}
"""

def _parse_json_output(raw: str) -> dict | None:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        clean_raw = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", raw).strip()
        try:
            return json.loads(clean_raw)
        except json.JSONDecodeError:
            matches = list(re.finditer(r"\{[\s\S]*\}", raw))
            if matches:
                return json.loads(matches[-1].group(0))
    return None

def run_qwen_analyzer(text: str, channel: str = "email") -> dict | None:
    payload = {
        "model": LM_STUDIO_MODEL,
        "messages": [
            {"role": "system", "content": PROMPT},
            {"role": "user", "content": f"--- TARGET ({channel}) ---\n{text}"}
        ],
        "temperature": 0.1,
        "max_tokens": 500
    }
    try:
        url = f"{LM_STUDIO_URL}/v1/chat/completions"
        resp = requests.post(url, json=payload, timeout=20.0)
        resp.raise_for_status()
        msg = resp.json()["choices"][0]["message"]
        raw = msg.get("content", "")
        return _parse_json_output(raw)
    except Exception as e:
        logger.warning(f"LM Studio fallback failed: {e}")
        return None
