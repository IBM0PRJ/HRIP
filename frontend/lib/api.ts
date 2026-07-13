type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

export type Overview = {
  organization_risk_score: number;
  total_alerts: number;
  high_priority_alerts: number;
  users_tracked: number;
};

export type AlertSummary = {
  id: string;
  severity: string;
  status: string;
  created_at: string;
  channel: string;
  threat_type: string;
  confidence: number;
  sender: string;
  receiver: string;
  subject: string | null;
};

export type AlertDetail = {
  alert: {
    id: string;
    severity: string;
    status: string;
    created_at: string;
    user_id: string;
  };
  message: {
    id: string;
    channel: string;
    sender: string;
    receiver: string;
    subject: string | null;
    body: string;
  };
  detection: {
    id: string;
    threat_type: string;
    confidence: number;
    model_used: string;
    psychology_scores: Record<string, number>;
    features: Array<{
      feature_name: string;
      feature_value: number;
      shap_contribution: number;
    }>;
  };
};

export type UserSummary = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  risk_score: number;
};

export type UserProfile = {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    department: string;
    risk_score: number;
  };
  risk_history: Array<{
    score: number;
    severity: string;
    created_at: string;
  }>;
  alerts: Array<{
    id: string;
    severity: string;
    status: string;
    created_at: string;
    channel: string;
    threat_type: string;
  }>;
  training_plan: {
    overall_priority: string;
    summary: string;
    items: Array<{
      title: string;
      priority: string;
      focus_area: string;
      summary: string;
      actions: string[];
      evidence: string[];
      due_in_days: number;
    }>;
  };
};

export type ActivityItem = {
  message_id: string;
  alert_id: string | null;
  user_id: string | null;
  channel: string;
  sender: string;
  receiver: string;
  subject: string | null;
  ingested_at: string;
  threat_type: string;
  confidence: number;
  alert_status: string;
  severity: string | null;
};

export type MessageTracking = {
  message_id: string;
  channel: string;
  sender: string;
  receiver: string;
  subject: string | null;
  threat_type: string;
  confidence: number;
  alert_id: string | null;
  alert_status: string;
  severity: string | null;
  user_id: string | null;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const gatewayUrl = process.env.FRONTEND_GATEWAY_URL || "http://localhost:8001";
const loginEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@example.com";
const loginPassword = process.env.DEFAULT_ADMIN_PASSWORD || "ChangeMe123!";

let tokenCache: TokenCache | null = null;

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function getAccessToken() {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 5000) {
    return tokenCache.accessToken;
  }
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(`${gatewayUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      cache: "no-store"
    });
    if (!response.ok) {
      if (attempt < 4) {
        await sleep(500 * attempt);
        continue;
      }
      throw new Error(`Gateway login failed with status ${response.status}`);
    }
    const payload = await response.json();
    const accessToken = payload.access_token as string;
    tokenCache = {
      accessToken,
      expiresAt: now + 14 * 60 * 1000
    };
    return accessToken;
  }
  throw new Error("Gateway login retry loop exited unexpectedly");
}

async function getJson<T>(path: string) {
  const accessToken = await getAccessToken();
  const response = await fetch(`${apiUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(`API request failed for ${path} with status ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function updateAlertStatus(alertId: string, status: string) {
  const accessToken = await getAccessToken();
  const response = await fetch(`${apiUrl}/alerts/${alertId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status }),
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(`Alert status update failed with status ${response.status}`);
  }
  return response.json();
}

export async function getOverview() {
  return getJson<Overview>("/dashboard/overview");
}

export async function getActivity() {
  return getJson<ActivityItem[]>("/dashboard/activity");
}

export async function getAlerts(filters?: { severity?: string; status?: string; channel?: string }) {
  const params = new URLSearchParams();
  if (filters?.severity) params.set("severity", filters.severity);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.channel) params.set("channel", filters.channel);
  const query = params.toString();
  return getJson<AlertSummary[]>(`/alerts${query ? `?${query}` : ""}`);
}

export async function getAlert(alertId: string) {
  return getJson<AlertDetail>(`/alerts/${alertId}`);
}

export async function getMessageTracking(messageId: string) {
  return getJson<MessageTracking>(`/messages/${messageId}/tracking`);
}

export async function getUsers() {
  return getJson<UserSummary[]>("/users");
}

export async function getUserProfile(userId: string) {
  return getJson<UserProfile>(`/users/${userId}/profile`);
}

export function getGatewayUrl() {
  return gatewayUrl;
}

export type AIFlag = {
  id: string;
  user_id: string;
  user_name: string;
  source: string;
  suspicion_score: number;
  threat_category: string;
  status: string;
  created_at: string;
  qwen_reasoning: string | null;
  evidence_items: string[];
  employee_context: any;
  recommended_action: string | null;
};

export async function getAIFlags() {
  const accessToken = await getAccessToken();
  const response = await fetch(`${gatewayUrl}/api/v1/flags`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`Failed to fetch AI flags: ${response.status}`);
  return response.json() as Promise<AIFlag[]>;
}

export async function getUserAIFlags(userId: string) {
  const accessToken = await getAccessToken();
  const response = await fetch(`${gatewayUrl}/api/v1/flags/user/${userId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`Failed to fetch User AI flags: ${response.status}`);
  return response.json() as Promise<AIFlag[]>;
}

export async function confirmAIFlag(flagId: string, analystId: string) {
  const accessToken = await getAccessToken();
  const response = await fetch(`${gatewayUrl}/api/v1/flags/${flagId}/confirm`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ analyst_id: analystId })
  });
  return response.json();
}

export async function dismissAIFlag(flagId: string, analystId: string) {
  const accessToken = await getAccessToken();
  const response = await fetch(`${gatewayUrl}/api/v1/flags/${flagId}/dismiss`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ analyst_id: analystId })
  });
  return response.json();
}

export async function executeAIFlagAction(flagId: string, analystId: string, actionType: string, payload: any) {
  const accessToken = await getAccessToken();
  const response = await fetch(`${gatewayUrl}/api/v1/flags/${flagId}/action`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ analyst_id: analystId, action_type: actionType, payload })
  });
  return response.json();
}
