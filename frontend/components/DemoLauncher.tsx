"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

const demos = [
  {
    id:          "email_ceo_fraud",
    icon:        "📧",
    label:       "CEO Fraud Email",
    description: "High-risk email with urgent payment language targeting finance.",
    tone:        "danger" as const,
  },
  {
    id:          "sms_kyc",
    icon:        "📱",
    label:       "Smishing SMS",
    description: "KYC-themed SMS impersonating TRAI — creates a smishing alert.",
    tone:        "warning" as const,
  },
  {
    id:          "voice_otp",
    icon:        "🎙️",
    label:       "Vishing Call",
    description: "Voice sample triggering an OTP-harvesting vishing detection.",
    tone:        "accent" as const,
  },
] as const;

type LaunchState = {
  messageId:   string;
  scenarioId:  string;
  alertId?:    string | null;
  alertStatus?: string;
  threatType?: string;
};

export function DemoLauncher() {
  const router                   = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeId, setActiveId]  = useState<string | null>(null);
  const [message, setMessage]    = useState<string>("");
  const [launchState, setLaunchState] = useState<LaunchState | null>(null);

  const statusText = useMemo(() => {
    if (isPending && activeId) {
      const active = demos.find((d) => d.id === activeId);
      return `Running ${active?.label ?? "demo"}…`;
    }
    return message;
  }, [activeId, isPending, message]);

  function runScenario(scenario: (typeof demos)[number]["id"]) {
    setActiveId(scenario);
    setMessage("");
    setLaunchState(null);
    startTransition(async () => {
      const response = await fetch("/api/demo/ingest", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ scenario }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(payload.error || payload.detail || "Demo launch failed");
        return;
      }
      const messageId = payload.message_id as string | undefined;
      setMessage(`Queued: ${messageId ?? ""}`.trim());
      if (messageId) {
        setLaunchState({ messageId, scenarioId: scenario });
        void pollTracking(messageId, scenario);
      }
      router.refresh();
    });
  }

  async function pollTracking(messageId: string, scenarioId: string) {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 800 : 1200));
      const response = await fetch(`/api/demo/tracking/${messageId}`, { cache: "no-store" });
      if (!response.ok) continue;
      const payload = await response.json();
      setLaunchState({ messageId, scenarioId, alertId: payload.alert_id, alertStatus: payload.alert_status, threatType: payload.threat_type });
      if (payload.alert_id) {
        setMessage(`Alert ready: ${payload.threat_type}`);
        router.refresh();
        return;
      }
    }
    setMessage("Message queued. Processing may still be in flight.");
  }

  return (
    <section className="card demoPanel">
      <div className="sectionHeader">
        <div>
          <p className="muted" style={{ fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            Demo Control
          </p>
          <h3>Generate analyst traffic</h3>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="statusDot" />
          <span className="chip" style={{ fontSize: "0.78rem" }}>All actions live</span>
        </div>
      </div>

      <div className="demoGrid">
        {demos.map((demo) => {
          const isThisLoading = isPending && activeId === demo.id;
          return (
            <button
              key={demo.id}
              className={`demoButton`}
              onClick={() => runScenario(demo.id)}
              disabled={isPending}
              type="button"
            >
              <div className="demoTone" />
              <div className="demoButtonHeader">
                <span className="demoIcon">{demo.icon}</span>
                <strong style={{ fontSize: "0.95rem" }}>
                  {isThisLoading ? (
                    <><span className="demoLoading" />Launching…</>
                  ) : demo.label}
                </strong>
              </div>
              <span className="muted" style={{ fontSize: "0.83rem" }}>{demo.description}</span>
            </button>
          );
        })}
      </div>

      {/* Status message */}
      {statusText && (
        <div style={{ marginTop: 12, fontSize: "0.84rem", color: "var(--muted)" }}>
          {isPending && <span className="demoLoading" />}
          {statusText}
        </div>
      )}

      {/* Launch result */}
      {launchState && (
        <div className="launchResult">
          <div className="launchResultHeader">
            <strong>{launchState.threatType ?? launchState.scenarioId.replace(/_/g, " ")}</strong>
            <span className="statusTag">{(launchState.alertStatus || "pending").replace(/_/g, " ")}</span>
          </div>
          <div className="muted" style={{ fontSize: "0.78rem", marginBottom: 10 }}>
            Message ID: {launchState.messageId.slice(0, 16)}…
          </div>
          <div className="launchLinks">
            {launchState.alertId ? (
              <Link className="buttonPrimary" style={{ minHeight: 36, fontSize: "0.84rem", padding: "0 16px" }} href={`/alerts/${launchState.alertId}`}>
                Open alert →
              </Link>
            ) : (
              <span className="muted" style={{ fontSize: "0.84rem" }}>
                <span className="demoLoading" /> Waiting for alert creation…
              </span>
            )}
            <Link className="chip" href="/alerts">
              Open full queue
            </Link>
          </div>
        </div>
      )}

      <div className="demoHint" style={{ marginTop: 14 }}>
        <span className="muted" style={{ fontSize: "0.82rem" }}>
          Scenarios run against the live pipeline — check the activity feed above for immediate feedback.
        </span>
      </div>
    </section>
  );
}
