"""
Multi-source Qwen AI analyzer for the HRIP triage pipeline.

Provides source-specific prompt templates for: USB, Network, File Access, Clipboard, Login.
Each prompt is crafted to detect the exact attack patterns relevant to that channel.
"""
import os
import json
import re
import logging
from typing import Any

import requests

logger = logging.getLogger(__name__)

LM_STUDIO_URL = os.environ.get("LM_STUDIO_URL", "http://host.docker.internal:1234")
LM_STUDIO_MODEL = os.environ.get("LM_STUDIO_MODEL", "lmstudio-community/Qwen2.5-7B-Instruct-1M")


# ---------------------------------------------------------------------------
# Source-specific prompt templates
# ---------------------------------------------------------------------------

USB_PROMPT = """You are HRIP Threat Intelligence Engine, a corporate security analyst specializing in endpoint device monitoring.

Your job is to analyze a USB/peripheral device event and determine if it represents a genuine security threat or is normal workplace activity.

CRITICAL: You must MINIMIZE FALSE POSITIVES. Many USB events are legitimate:
- Employees using approved wireless keyboards/mice — this is NORMAL
- Connecting a company-issued USB drive to transfer work files — this is NORMAL
- Using a USB headset for meetings — this is NORMAL
- Charging a phone via USB cable — this is NORMAL

BEFORE scoring, reason through this protocol:

== PHASE 1: LEGITIMACY CHECK ==
Q1. Is this a known/common device type? (keyboard, mouse, headset, webcam, phone charger)
    If YES — lean toward SAFE unless large data transfers are involved.
Q2. Is the action routine? (connect/disconnect vs bulk file copy)
    Bulk file copy with large data = suspicious. Simple connect = usually safe.
Q3. Is this during work hours for this employee's department?
    After-hours activity from non-IT department = more suspicious.
Q4. Does the employee have a history of security incidents?
    Higher risk score = more scrutiny warranted.

== PHASE 2: THREAT ASSESSMENT ==
- Is this an unregistered mass storage device?
- Are large volumes of data being written to an external device?
- Is the timing unusual (late night, weekend)?
- Does the employee's current risk profile suggest insider threat potential?
- Is this a pattern? (repeated USB activity in short time windows)

== PHASE 3: CALIBRATED SCORING ==
- Known device, simple connect, work hours: suspicion_score 0.00 - 0.15
- Unknown device, no data transfer: suspicion_score 0.10 - 0.30
- Unknown device with file operations: suspicion_score 0.30 - 0.55
- Mass storage device with large file copy: suspicion_score 0.55 - 0.75
- Unregistered device + bulk data copy + off-hours + high risk employee: suspicion_score 0.75 - 1.00

Return a JSON object with EXACTLY these keys:
{
  "suspicion_score": <float 0.0-1.0>,
  "threat_category": <string from: ["data_exfiltration", "unauthorized_device", "insider_threat", "policy_violation", "benign_activity"]>,
  "evidence_items": <list of 2-4 short evidence strings, e.g. ["Unknown USB mass storage device connected", "85MB written to external drive"]>,
  "recommended_action": <string: one practical recommended action for the analyst>,
  "reasoning": <string: 2-3 sentence professional assessment>
}"""

NETWORK_PROMPT = """You are HRIP Threat Intelligence Engine, a corporate security analyst specializing in network traffic analysis.

Your job is to analyze an outbound network connection event and determine if it represents a genuine security threat or is normal business traffic.

CRITICAL: You must MINIMIZE FALSE POSITIVES. Many network connections are legitimate:
- Connecting to cloud services (AWS, Azure, Google Cloud) — this is NORMAL
- HTTPS traffic to well-known SaaS platforms — this is NORMAL
- Video conferencing (Zoom, Teams, Meet) uses high bandwidth — this is NORMAL
- Software update traffic to vendor CDNs — this is NORMAL

BEFORE scoring, reason through this protocol:

== PHASE 1: LEGITIMACY CHECK ==
Q1. Is the destination a known/whitelisted corporate service?
    If YES — very likely safe regardless of data volume.
Q2. Is the protocol and port standard? (443 HTTPS, 80 HTTP)
    Unusual ports (IRC, custom high ports) = more suspicious.
Q3. Is the data volume proportional to the service?
    Large uploads to unknown destinations = suspicious.
Q4. Does the geo-location match expected business partners?
    Connections to sanctioned countries or unlikely destinations = suspicious.

== PHASE 2: THREAT ASSESSMENT ==
- Is this a connection to a known malicious IP/domain?
- Does the connection pattern look like C2 beaconing? (regular interval, small payloads)
- Is there a large data upload to an unknown external server?
- Is the destination IP in an unusual geography for this company?
- Is this happening during off-hours for a non-IT employee?
- Are DNS queries suspicious? (DGA-like domains, excessive query volume)

== PHASE 3: CALIBRATED SCORING ==
- Known corporate service, standard port, work hours: suspicion_score 0.00 - 0.10
- Unknown destination, standard port, small data: suspicion_score 0.10 - 0.30
- Unknown destination, large upload: suspicion_score 0.30 - 0.55
- Threat intel match or suspicious geo + data transfer: suspicion_score 0.55 - 0.75
- C2 pattern + large exfil + off-hours + high risk employee: suspicion_score 0.75 - 1.00

Return a JSON object with EXACTLY these keys:
{
  "suspicion_score": <float 0.0-1.0>,
  "threat_category": <string from: ["data_exfiltration", "c2_communication", "lateral_movement", "dns_tunneling", "policy_violation", "benign_traffic"]>,
  "evidence_items": <list of 2-4 short evidence strings>,
  "recommended_action": <string: one practical recommended action for the analyst>,
  "reasoning": <string: 2-3 sentence professional assessment>
}"""

FILE_ACCESS_PROMPT = """You are HRIP Threat Intelligence Engine, a corporate security analyst specializing in data loss prevention and file access monitoring.

Your job is to analyze a file access event and determine if it represents a genuine security threat or is normal work activity.

CRITICAL: You must MINIMIZE FALSE POSITIVES. Many file accesses are legitimate:
- Developers reading source code files in their project directory — this is NORMAL
- Finance team accessing spreadsheets in their shared drive — this is NORMAL
- HR reading employee documents they manage — this is NORMAL
- Editing files you created or own — this is NORMAL

BEFORE scoring, reason through this protocol:

== PHASE 1: LEGITIMACY CHECK ==
Q1. Is the file within the employee's normal working scope?
    Developers accessing code = normal. Marketing accessing HR records = suspicious.
Q2. Is the operation type expected? (read vs delete vs bulk copy)
    Reading a document = usually safe. Mass deletion or bulk copy = suspicious.
Q3. Is the file sensitivity level appropriate for this employee's privilege?
    Standard employee accessing restricted/confidential files = suspicious.
Q4. Is the access volume normal? (1-2 files vs 50+ in 10 minutes)
    Burst access patterns suggest automated scraping or data collection.

== PHASE 2: THREAT ASSESSMENT ==
- Is the employee accessing files outside their department scope?
- Is this a bulk download/copy pattern? (many files in quick succession)
- Are restricted or confidential files being accessed by a standard-privilege user?
- Are files being renamed or moved to unusual locations?
- Is there a pattern of accessing customer PII, financial data, or trade secrets?
- Is the access happening outside normal work hours?

== PHASE 3: CALIBRATED SCORING ==
- In-scope file, read operation, work hours: suspicion_score 0.00 - 0.10
- Slightly out of scope, read-only: suspicion_score 0.10 - 0.30
- Out of scope + write/copy + elevated sensitivity: suspicion_score 0.30 - 0.55
- Restricted file + bulk access + off-hours: suspicion_score 0.55 - 0.75
- Bulk copy of restricted files + high risk employee + staging for exfil: suspicion_score 0.75 - 1.00

Return a JSON object with EXACTLY these keys:
{
  "suspicion_score": <float 0.0-1.0>,
  "threat_category": <string from: ["data_exfiltration", "privilege_escalation", "unauthorized_access", "data_destruction", "policy_violation", "benign_access"]>,
  "evidence_items": <list of 2-4 short evidence strings>,
  "recommended_action": <string: one practical recommended action for the analyst>,
  "reasoning": <string: 2-3 sentence professional assessment>
}"""

CLIPBOARD_PROMPT = """You are HRIP Threat Intelligence Engine, a corporate security analyst specializing in clipboard and data exfiltration monitoring.

Your job is to analyze a clipboard activity event and determine if it represents a genuine security threat or is normal work activity.

CRITICAL: You must MINIMIZE FALSE POSITIVES. Many clipboard uses are legitimate:
- Copy-pasting code snippets between IDE and terminal — this is NORMAL
- Copying meeting links to share with colleagues — this is NORMAL
- Copying text from documents for email composition — this is NORMAL
- Screenshot for documentation — this is NORMAL

BEFORE scoring, reason through this protocol:

== PHASE 1: LEGITIMACY CHECK ==
Q1. Is the clipboard content type typical for this role?
    Developer copying code = normal. HR copying social security numbers = suspicious.
Q2. Is the source → destination app transition expected?
    IDE → Terminal = normal. Password manager → personal browser = suspicious.
Q3. Is the frequency normal? (occasional copy-paste vs rapid bulk copying)
    1-2 copies per minute = normal. 20+ copies in 5 minutes = data harvesting.
Q4. Are sensitive patterns detected? (credentials, PII, financial data)
    Detected API keys, credit card numbers, passwords = high concern.

== PHASE 2: THREAT ASSESSMENT ==
- Does the clipboard content match credential patterns? (API keys, passwords, tokens)
- Is PII being copied? (SSN, credit card, email + phone combos)
- Is data being moved from corporate apps to personal/unauthorized apps?
- Is the copy frequency suggesting automated or scripted harvesting?
- Is there a pattern of moving sensitive data to an external medium?

== PHASE 3: CALIBRATED SCORING ==
- Plain text, work apps, normal frequency: suspicion_score 0.00 - 0.10
- Slightly sensitive content, work context: suspicion_score 0.10 - 0.30
- Detected patterns (PII/credentials) in work app context: suspicion_score 0.30 - 0.55
- Credentials/PII copied to personal app: suspicion_score 0.55 - 0.75
- Bulk credential harvesting + personal app + high risk employee: suspicion_score 0.75 - 1.00

Return a JSON object with EXACTLY these keys:
{
  "suspicion_score": <float 0.0-1.0>,
  "threat_category": <string from: ["credential_harvesting", "pii_exfiltration", "data_staging", "policy_violation", "benign_activity"]>,
  "evidence_items": <list of 2-4 short evidence strings>,
  "recommended_action": <string: one practical recommended action for the analyst>,
  "reasoning": <string: 2-3 sentence professional assessment>
}"""

LOGIN_PROMPT = """You are HRIP Threat Intelligence Engine, a corporate security analyst specializing in authentication and access monitoring.

Your job is to analyze a login event and determine if it represents a genuine security threat or is normal authentication activity.

CRITICAL: You must MINIMIZE FALSE POSITIVES. Many login events are legitimate:
- Employee logging in at the start of their shift — this is NORMAL
- Re-authentication after session timeout — this is NORMAL
- A single failed login followed by success (typo) — this is NORMAL
- IT admin logging in from a management workstation — this is NORMAL

BEFORE scoring, reason through this protocol:

== PHASE 1: LEGITIMACY CHECK ==
Q1. Is this a normal login time for this employee's role?
    IT working late = expected. Accountant at 3 AM = suspicious.
Q2. Is the login location/IP consistent with the employee's history?
    Same office IP = safe. New country/IP block = suspicious.
Q3. Is a single failed attempt followed by success? (password typo)
    1 fail + success = normal. 5+ consecutive fails = concerning.
Q4. Is the employee's account in good standing?
    Active, low risk = normal. Previously flagged, high risk = more scrutiny.

== PHASE 2: THREAT ASSESSMENT ==
- Are there multiple consecutive failed logins? (brute force attempt)
- Is the login from an unusual IP or geographic location?
- Is the login happening during unexpected hours for this role?
- Is this a privileged account being accessed?
- Does the login follow a pattern of credential stuffing?

== PHASE 3: CALIBRATED SCORING ==
- Normal hours, known IP, successful login: suspicion_score 0.00 - 0.10
- Off-hours successful login, known IP: suspicion_score 0.10 - 0.30
- Failed login(s) + off-hours or new IP: suspicion_score 0.30 - 0.55
- Multiple failed logins + unknown IP: suspicion_score 0.55 - 0.75
- Brute force pattern + unknown geo + high risk account: suspicion_score 0.75 - 1.00

Return a JSON object with EXACTLY these keys:
{
  "suspicion_score": <float 0.0-1.0>,
  "threat_category": <string from: ["brute_force", "credential_stuffing", "unauthorized_access", "session_hijacking", "policy_violation", "benign_login"]>,
  "evidence_items": <list of 2-4 short evidence strings>,
  "recommended_action": <string: one practical recommended action for the analyst>,
  "reasoning": <string: 2-3 sentence professional assessment>
}"""

# ---------------------------------------------------------------------------
# Prompt router: maps source type → prompt template
# ---------------------------------------------------------------------------
PROMPT_MAP: dict[str, str] = {
    "usb": USB_PROMPT,
    "network": NETWORK_PROMPT,
    "file_access": FILE_ACCESS_PROMPT,
    "clipboard": CLIPBOARD_PROMPT,
    "login": LOGIN_PROMPT,
}


def _format_employee_context(context: dict) -> str:
    """Format employee context into a readable block for prompt injection."""
    lines = []
    lines.append(f"Current Risk Score: {context.get('risk_score', 0)}/100")
    lines.append(f"Risk Tier: {context.get('risk_tier', 'unknown')}")
    lines.append(f"Department: {context.get('department', 'unknown')}")
    lines.append(f"Privilege Level: {context.get('privilege', 'standard')}")
    recent_flags = context.get("recent_flags", [])
    if recent_flags:
        lines.append(f"Recent Security Flags ({len(recent_flags)}):")
        for flag in recent_flags[:5]:
            lines.append(f"  - [{flag.get('source', '?')}] {flag.get('threat_category', '?')} "
                         f"(score: {flag.get('suspicion_score', '?')}) at {flag.get('created_at', '?')}")
    else:
        lines.append("Recent Security Flags: None (clean record)")
    return "\n".join(lines)


def _format_event_data(source: str, event_data: dict) -> str:
    """Format raw event data into a readable block for the prompt."""
    lines = []
    if source == "usb":
        lines.append(f"Device Name: {event_data.get('device_name', 'Unknown')}")
        lines.append(f"Vendor/Product ID: {event_data.get('vid_pid', 'Unknown')}")
        lines.append(f"Action: {event_data.get('action', 'Unknown')}")
        file_size = event_data.get("file_size_bytes")
        if file_size:
            lines.append(f"File Size Transferred: {file_size:,} bytes ({file_size / (1024*1024):.1f} MB)")
        lines.append(f"Timestamp: {event_data.get('timestamp', 'Unknown')}")

    elif source == "network":
        lines.append(f"Destination: {event_data.get('destination', 'Unknown')}")
        lines.append(f"Protocol: {event_data.get('protocol', 'Unknown')}")
        lines.append(f"Port: {event_data.get('port', 'Unknown')}")
        lines.append(f"Data Out: {event_data.get('bytes_out', 0):,} bytes")
        lines.append(f"Data In: {event_data.get('bytes_in', 0):,} bytes")
        lines.append(f"Duration: {event_data.get('duration_sec', 0)}s")
        lines.append(f"Known Corporate Destination: {event_data.get('is_whitelisted', False)}")
        lines.append(f"Geo-Location: {event_data.get('country', 'Unknown')}")
        lines.append(f"Threat Intel Match: {event_data.get('intel_hit', False)}")
        lines.append(f"Timestamp: {event_data.get('timestamp', 'Unknown')}")

    elif source == "file_access":
        lines.append(f"File Path: {event_data.get('file_path', 'Unknown')}")
        lines.append(f"Sensitivity: {event_data.get('sensitivity', 'unknown')}")
        lines.append(f"Operation: {event_data.get('action', 'Unknown')}")
        lines.append(f"Burst Count (last 10 min): {event_data.get('burst_count', 1)}")
        lines.append(f"In Scope for Department: {event_data.get('in_scope', True)}")
        lines.append(f"Timestamp: {event_data.get('timestamp', 'Unknown')}")

    elif source == "clipboard":
        lines.append(f"Content Type: {event_data.get('content_type', 'Unknown')}")
        lines.append(f"Content Size: {event_data.get('size_bytes', 0):,} bytes")
        patterns = event_data.get("patterns_detected", [])
        lines.append(f"Detected Patterns: {', '.join(patterns) if patterns else 'None'}")
        lines.append(f"Source App: {event_data.get('source_app', 'Unknown')}")
        lines.append(f"Destination App: {event_data.get('dest_app', 'Unknown')}")
        lines.append(f"Copy Frequency (last 5 min): {event_data.get('copy_freq', 1)}")
        lines.append(f"Timestamp: {event_data.get('timestamp', 'Unknown')}")

    elif source == "login":
        lines.append(f"Login Status: {event_data.get('status', 'Unknown')}")
        lines.append(f"IP Address: {event_data.get('ip_address', 'Unknown')}")
        lines.append(f"Reason/Context: {event_data.get('reason', 'None')}")
        lines.append(f"Timestamp: {event_data.get('timestamp', 'Unknown')}")

    else:
        lines.append(json.dumps(event_data, indent=2, default=str))

    return "\n".join(lines)


def _parse_json_output(raw: str) -> dict | None:
    """Robust JSON parser for LLM output (handles markdown code blocks, etc.)."""
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        clean_raw = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", raw).strip()
        try:
            return json.loads(clean_raw)
        except json.JSONDecodeError:
            matches = list(re.finditer(r"\{[\s\S]*\}", raw))
            if matches:
                try:
                    return json.loads(matches[-1].group(0))
                except json.JSONDecodeError:
                    pass
    return None


import os
import httpx
from openai import OpenAI

def run_qwen_for_source(
    source: str,
    event_data: dict,
    employee_context: dict,
) -> dict | None:
    prompt_template = PROMPT_MAP.get(source)
    if not prompt_template:
        logger.warning(f"No prompt template for source: {source}")
        return None

    context_block = _format_employee_context(employee_context)
    event_block = _format_event_data(source, event_data)

    user_message = (
        f"--- EMPLOYEE CONTEXT ---\n{context_block}\n\n"
        f"--- EVENT DATA ({source.upper()}) ---\n{event_block}"
    )

    try:
        # Use OpenAI client configured for LM Studio
        client = OpenAI(
            base_url=f"{LM_STUDIO_URL}/v1",
            api_key="lm-studio",
            http_client=httpx.Client(timeout=30.0)
        )
        
        response = client.chat.completions.create(
            model=LM_STUDIO_MODEL,
            messages=[
                {"role": "system", "content": prompt_template},
                {"role": "user", "content": user_message}
            ],
            temperature=0.1,
            max_tokens=500
        )
        
        raw = response.choices[0].message.content
        result = _parse_json_output(raw)
        if result:
            result.setdefault("suspicion_score", 0.0)
            result.setdefault("threat_category", "unknown")
            result.setdefault("evidence_items", [])
            result.setdefault("recommended_action", "Review manually")
            result.setdefault("reasoning", "No reasoning provided")
            result["suspicion_score"] = max(0.0, min(1.0, float(result["suspicion_score"])))
        return result
    except Exception as e:
        print(f"QWEN FAILED for {source}: {e}", flush=True)
        logger.warning(f"Qwen multi-source analysis failed for {source}: {e}")
        return None
