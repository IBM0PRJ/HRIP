/**
 * Central formatters for HRIP — plain-English labels for all technical terms.
 * All user-facing text goes through here so we never show raw jargon.
 */

/** Converts snake_case threat types to readable labels */
export function formatThreatType(raw: string): string {
  const map: Record<string, string> = {
    CEO_fraud:  "CEO Fraud",
    phishing:   "Email Phishing",
    smishing:   "SMS Phishing",
    vishing:    "Voice Phishing",
    benign:     "No Threat Detected",
  };
  return map[raw] ?? raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Converts raw status keys to analyst-friendly labels */
export function formatStatus(raw: string): string {
  const map: Record<string, string> = {
    open:           "Open",
    investigating:  "Investigating",
    resolved:       "Resolved",
    false_positive: "Not a Real Threat",
    pending:        "Pending",
  };
  return map[raw] ?? raw.replace(/_/g, " ");
}

/** One-line description shown under each status pill */
export function statusDescription(raw: string): string {
  const map: Record<string, string> = {
    open:           "New — not yet reviewed by an analyst",
    investigating:  "Actively being worked on",
    resolved:       "Threat has been contained or dismissed",
    false_positive: "AI flagged this incorrectly — not a real threat",
  };
  return map[raw] ?? "";
}

/** Converts raw channel names to human-readable labels */
export function formatChannel(raw: string): string {
  const map: Record<string, string> = {
    email: "Email",
    sms:   "SMS (Text Message)",
    voice: "Voice Call",
  };
  return map[raw] ?? raw;
}

/** Short channel label for badges/chips */
export function formatChannelShort(raw: string): string {
  const map: Record<string, string> = {
    email: "Email",
    sms:   "SMS",
    voice: "Voice",
  };
  return map[raw] ?? raw.toUpperCase();
}

/** Converts score 0-100 to a severity label */
export function riskSeverityLabel(score: number): string {
  if (score >= 85) return "Critical Risk";
  if (score >= 65) return "High Risk";
  if (score >= 40) return "Medium Risk";
  return "Low Risk";
}

/** Short severity label */
export function severityLabel(raw: string): string {
  const map: Record<string, string> = {
    critical: "Critical",
    high:     "High",
    medium:   "Medium",
    low:      "Low",
  };
  return map[raw] ?? raw;
}

/** Plain-English heading for SHAP features / detection section */
export function formatFeatureName(raw: string): string {
  const map: Record<string, string> = {
    url_count:           "Suspicious links",
    urgency_language:    "Urgency language used",
    authority_claim:     "Authority claimed by sender",
    financial_request:   "Financial action requested",
    domain_age:          "Domain age (newer = riskier)",
    attachment_count:    "Attachments included",
    reply_to_mismatch:   "Reply-to address differs from sender",
  };
  return map[raw] ?? raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Plain-English label for psychology scores */
export function formatPsychologyLabel(raw: string): string {
  const map: Record<string, string> = {
    urgency:    "Creates time pressure",
    authority:  "Impersonates authority figure",
    fear:       "Triggers fear or panic",
    financial:  "Involves money or payments",
    secrecy:    "Requests secrecy or urgency",
    scarcity:   "Claims limited time or access",
  };
  return map[raw] ?? raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Confidence score to a plain label */
export function confidenceLabel(score: number): string {
  if (score >= 0.9) return "Very high — almost certainly a threat";
  if (score >= 0.7) return "High — likely a real threat";
  if (score >= 0.5) return "Moderate — review carefully";
  return "Low — possibly a false alarm";
}

/** Risk score color CSS variable */
export function riskColor(score: number): string {
  if (score >= 85) return "#ff8578";
  if (score >= 65) return "#e7b36b";
  if (score >= 40) return "#d4b471";
  return "#8dd0c2";
}

/** Risk CSS class name */
export function riskClass(score: number): string {
  if (score >= 85) return "riskCritical";
  if (score >= 65) return "riskHigh";
  if (score >= 40) return "riskMedium";
  return "riskLow";
}

/** Feature bar level for CSS class */
export function featureLevel(value: number): "high" | "medium" | "low" {
  if (value >= 0.7) return "high";
  if (value >= 0.4) return "medium";
  return "low";
}

/** Formats a date relative to now (e.g. "2 hours ago") */
export function formatRelativeTime(date: Date | string | number): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return past.toLocaleDateString();
}
