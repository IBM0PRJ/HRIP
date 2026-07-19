"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function EmployeeDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [training, setTraining] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [provisioningToken, setProvisioningToken] = useState<string | null>(null);

  useEffect(() => { 
    fetchData(); 
    
    // Poll for permission requests every 3 seconds
    const interval = setInterval(async () => {
      try {
        const meRes = await fetch("/api/employee/me");
        const meData = await meRes.json();
        if (meData?.employee?.email) {
          const res = await fetch(`/api/permission-requests?email=${meData.employee.email}`);
          const data = await res.json();
          if (data.requests) setPendingRequests(data.requests);
        }
      } catch (e) {}
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [meRes, alertsRes, trainingRes, incRes] = await Promise.all([
        fetch("/api/employee/me"),
        fetch("/api/employee/alerts"),
        fetch("/api/employee/training"),
        fetch("/api/employee/incidents"),
      ]);
      const meData = await meRes.json();
      setData(meData);
      setAlerts((await alertsRes.json()).alerts || []);
      setTraining(await trainingRes.json());
      setIncidents((await incRes.json()).incidents || []);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const handleProvisionAgent = async () => {
    try {
      const res = await fetch("/api/agent/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.employee.email })
      });
      const json = await res.json();
      if (json.success) {
        setProvisioningToken(json.token);
      }
    } catch (e) { console.error(e); }
  };

  const handleRequestAction = async (id: string, action: "approve" | "deny") => {
    try {
      await fetch(`/api/permission-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      setPendingRequests(prev => prev.filter(r => r.id !== id));
    } catch (e) { console.error(e); }
  };

  const riskColor = (score: number) => {
    if (score <= 30) return "var(--success)";
    if (score <= 60) return "var(--warning)";
    return "var(--danger)";
  };
  const riskLabel = (score: number) => {
    if (score <= 30) return "LOW RISK";
    if (score <= 60) return "MEDIUM RISK";
    return "HIGH RISK";
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
        <div className="spinner" />
        <p className="muted" style={{ fontSize: "0.9rem" }}>Loading your security profile...</p>
      </div>
    );
  }

  if (!data?.employee) {
    return <div className="card" style={{ textAlign: "center", padding: 40 }}><p className="muted">Unable to load employee data. Please refresh.</p></div>;
  }

  const emp = data.employee;
  // ─── SAFETY: Clamp display score to 0-100 even if DB has corrupt value ───
  const displayScore = Math.min(100, Math.max(0, Math.round(emp.riskScore ?? 0)));
  const unreadAlerts = alerts.filter((a: any) => !a.isRead).length;
  const completedModules = training?.progress?.length || 0;
  const totalModules = training?.modules?.length || 0;
  const progressPct = totalModules ? Math.round((completedModules / totalModules) * 100) : 0;
  const openIncidents = incidents.filter((i: any) => (i.status || "open").toLowerCase() === "open").length;
  const recentAlerts = alerts.filter((a: any) => !a.isRead).slice(0, 3);
  const nextModule = training?.modules?.find((m: any) => !training?.progress?.find((p: any) => p.moduleId === m.id));
  // ─── Only count the 6 integrations shown in the Activity page ───
  const COUNTED_INTEGRATIONS = ["email", "process", "usb", "network", "files", "clipboard"];
  const activeIntegrationCount = COUNTED_INTEGRATIONS.filter(k => data?.session?.integrations?.[k]).length;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .ov-hero { background: linear-gradient(135deg, rgba(212,180,113,0.07) 0%, rgba(141,208,194,0.05) 100%); border: 1px solid rgba(212,180,113,0.15); border-radius: 24px; padding: 32px 36px; margin-bottom: 24px; position: relative; overflow: hidden; }
        .ov-hero::before { content: ""; position: absolute; top: -40px; right: -40px; width: 200px; height: 200px; border-radius: 50%; background: radial-gradient(circle, rgba(212,180,113,0.08) 0%, transparent 70%); pointer-events: none; }
        .ov-quick-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 22px 24px; text-decoration: none; color: inherit; display: flex; align-items: center; gap: 18px; transition: all 0.2s; cursor: pointer; }
        .ov-quick-card:hover { background: rgba(255,255,255,0.05); border-color: rgba(212,180,113,0.2); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
        .ov-quick-card.alert { border-left: 3px solid var(--danger); }
        .ov-quick-card.training { border-left: 3px solid var(--accent); }
        .ov-quick-card.incident { border-left: 3px solid var(--warning); }
        .ov-quick-card.activity { border-left: 3px solid var(--accent-2); }
        .ov-icon-wrap { width: 52px; height: 52px; border-radius: 16px; display: grid; place-items: center; font-size: 1.4rem; flex-shrink: 0; }
        .ov-stat-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; }
        .gauge-ring { position: relative; width: 120px; height: 120px; flex-shrink: 0; }
        .gauge-ring svg { width: 120px; height: 120px; transform: rotate(-90deg); }
        .gauge-ring .center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .progress-bar-bg { background: rgba(255,255,255,0.07); border-radius: 8px; height: 6px; overflow: hidden; }
        .progress-bar-fill { height: 6px; border-radius: 8px; background: linear-gradient(90deg, var(--accent-2), var(--accent)); transition: width 1s ease; }
        .alert-preview { padding: 10px 14px; background: rgba(255,133,120,0.06); border: 1px solid rgba(255,133,120,0.12); border-radius: 10px; margin-bottom: 8px; font-size: 0.83rem; }
        .security-tip { background: rgba(141,208,194,0.06); border: 1px solid rgba(141,208,194,0.14); border-radius: 16px; padding: 18px 22px; }
        .section-label { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: var(--accent); margin-bottom: 14px; }
      `}} />

      {/* ── Permission Requests Banner ── */}
      {pendingRequests.map(req => (
        <div key={req.id} style={{
          background: "rgba(20, 30, 40, 0.8)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(141, 208, 194, 0.4)",
          borderRadius: "16px",
          padding: "20px 24px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "flex-start",
          gap: "16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
        }}>
          <div style={{ fontSize: "24px" }}>🔔</div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: "0 0 4px 0", color: "var(--accent)" }}>Security Team Request</h4>
            <p style={{ margin: "0 0 8px 0", fontSize: "0.95rem" }}>
              Your analyst is requesting access to: <strong>{req.permissionKey.replace("int", "")} Telemetry</strong>
            </p>
            <div style={{ background: "rgba(0,0,0,0.2)", padding: "10px 14px", borderRadius: "8px", fontSize: "0.85rem", fontStyle: "italic", marginBottom: "16px" }}>
              Reason: "{req.reason}"
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                onClick={() => handleRequestAction(req.id, "deny")}
                style={{ padding: "8px 16px", background: "transparent", border: "1px solid rgba(255,133,120,0.3)", color: "var(--danger)", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
              >
                Deny
              </button>
              <button 
                onClick={() => handleRequestAction(req.id, "approve")}
                style={{ padding: "8px 16px", background: "var(--accent)", border: "none", color: "#000", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }}
              >
                Approve Access
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* ── Hero welcome strip ── */}
      <div className="ov-hero">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent)", marginBottom: 8 }}>
              Security Dashboard
            </div>
            <h2 style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", marginBottom: 8 }}>
              Welcome back, {emp.name} 👋
            </h2>
            <p className="muted" style={{ fontSize: "0.88rem" }}>
              {emp.department} &nbsp;·&nbsp; {emp.email}
            </p>
            {unreadAlerts > 0 && (
              <div style={{ marginTop: 14, marginBottom: 14 }}>
                <Link href="/dashboard/alerts" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "8px 16px", borderRadius: 20,
                  background: "rgba(255,133,120,0.15)", border: "1px solid rgba(255,133,120,0.3)",
                  color: "var(--danger)", fontSize: "0.82rem", fontWeight: 700,
                  textDecoration: "none", transition: "all 0.2s"
                }}>
                  🔴 {unreadAlerts} unread alert{unreadAlerts > 1 ? "s" : ""} — View now →
                </Link>
              </div>
            )}
            
            <div style={{ marginTop: unreadAlerts > 0 ? 0 : 14 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "6px 12px", borderRadius: 6,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--muted)", fontSize: "0.75rem", fontWeight: 600,
              }}>
                <span style={{ color: "var(--success)" }}>🔒</span> Managed by Corporate IT (MDM)
              </div>
            </div>
          </div>

          {/* Risk Gauge */}
          <div className="gauge-ring">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
              <circle cx="50" cy="50" r="42" fill="none"
                stroke={riskColor(displayScore)} strokeWidth="10" strokeLinecap="round"
                strokeDasharray="263.9"
                strokeDashoffset={263.9 - (263.9 * displayScore) / 100}
                style={{ transition: "stroke-dashoffset 1.2s ease" }}
              />
            </svg>
            <div className="center">
              <span style={{ fontSize: "1.6rem", fontWeight: 700, color: riskColor(displayScore), fontFamily: "var(--font-serif), serif" }}>
                {displayScore}
              </span>
              <span style={{ fontSize: "0.62rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>risk</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 quick-nav cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 14, marginBottom: 28 }}>

        <Link href="/dashboard/alerts" className="ov-quick-card alert" style={{ textDecoration: "none" }}>
          <div className="ov-icon-wrap" style={{ background: "rgba(255,133,120,0.1)" }}>◈</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{alerts.length}</div>
            <div style={{ fontSize: "0.88rem", fontWeight: 600, marginBottom: 2 }}>Security Alerts</div>
            <div className="muted" style={{ fontSize: "0.76rem" }}>
              {unreadAlerts > 0
                ? <span style={{ color: "var(--danger)", fontWeight: 700 }}>{unreadAlerts} unread — action needed</span>
                : "All alerts acknowledged ✓"}
            </div>
          </div>
          <span className="muted" style={{ fontSize: "0.8rem" }}>→</span>
        </Link>

        <Link href="/dashboard/training" className="ov-quick-card training" style={{ textDecoration: "none" }}>
          <div className="ov-icon-wrap" style={{ background: "rgba(212,180,113,0.1)" }}>◎</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{completedModules}/{totalModules}</div>
            <div style={{ fontSize: "0.88rem", fontWeight: 600, marginBottom: 4 }}>Training Progress</div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="muted" style={{ fontSize: "0.76rem", marginTop: 4 }}>{progressPct}% complete</div>
          </div>
          <span className="muted" style={{ fontSize: "0.8rem" }}>→</span>
        </Link>

        <Link href="/dashboard/incidents" className="ov-quick-card incident" style={{ textDecoration: "none" }}>
          <div className="ov-icon-wrap" style={{ background: "rgba(231,179,107,0.1)" }}>⚠️</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{incidents.length}</div>
            <div style={{ fontSize: "0.88rem", fontWeight: 600, marginBottom: 2 }}>Incident Reports</div>
            <div className="muted" style={{ fontSize: "0.76rem" }}>
              {openIncidents > 0 ? `${openIncidents} open` : "No open incidents"} · Report a threat →
            </div>
          </div>
          <span className="muted" style={{ fontSize: "0.8rem" }}>→</span>
        </Link>

        <Link href="/dashboard/activity" className="ov-quick-card activity" style={{ textDecoration: "none" }}>
          <div className="ov-icon-wrap" style={{ background: "rgba(141,208,194,0.1)" }}>◉</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
              {activeIntegrationCount}/6
            </div>
            <div style={{ fontSize: "0.88rem", fontWeight: 600, marginBottom: 2 }}>Integrations Active</div>
            <div className="muted" style={{ fontSize: "0.76rem" }}>Live telemetry monitoring</div>
          </div>
          <span className="muted" style={{ fontSize: "0.8rem" }}>→</span>
        </Link>
      </div>

      {/* ── Bottom row: urgent alerts preview + next training + tip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

        {/* Urgent alerts preview */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 24 }}>
          <div className="section-label">🔴 Recent Unread Alerts</div>
          {recentAlerts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>🛡️</div>
              <p className="muted" style={{ fontSize: "0.85rem" }}>No unread alerts. You're all clear!</p>
            </div>
          ) : (
            <>
              {recentAlerts.map((alert: any) => {
                const c = alert.severity === "critical" ? "var(--danger)" : alert.severity === "high" ? "var(--warning)" : "var(--accent)";
                return (
                  <div key={alert.id} className="alert-preview">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: c, boxShadow: `0 0 5px ${c}`, flexShrink: 0 }} />
                      <strong style={{ fontSize: "0.85rem" }}>{alert.title}</strong>
                      <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: c, fontWeight: 700, textTransform: "uppercase" }}>{alert.severity}</span>
                    </div>
                    <p className="muted" style={{ fontSize: "0.78rem", paddingLeft: 15 }}>{(alert.description || "").slice(0, 80)}{alert.description?.length > 80 ? "…" : ""}</p>
                  </div>
                );
              })}
              <Link href="/dashboard/alerts" style={{ display: "block", textAlign: "center", marginTop: 12, fontSize: "0.82rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
                View all {alerts.length} alerts →
              </Link>
            </>
          )}
        </div>

        {/* Next training + security tip */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Next module callout */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 24, flex: 1 }}>
            <div className="section-label">📚 Up Next — Training</div>
            {nextModule ? (
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: 6 }}>{nextModule.title}</div>
                <div className="muted" style={{ fontSize: "0.78rem", marginBottom: 16 }}>
                  Difficulty: {nextModule.difficulty} &nbsp;·&nbsp; Pass mark: {nextModule.passMark} pts
                </div>
                <div className="progress-bar-bg" style={{ marginBottom: 14 }}>
                  <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <Link href="/dashboard/training" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 10, background: "rgba(212,180,113,0.12)", border: "1px solid rgba(212,180,113,0.2)", color: "var(--accent)", fontSize: "0.83rem", fontWeight: 700, textDecoration: "none" }}>
                  ▶ Start Module →
                </Link>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>🎓</div>
                <p className="muted" style={{ fontSize: "0.85rem" }}>All modules complete — excellent work!</p>
              </div>
            )}
          </div>

          {/* Security tip of the day */}
          <div className="security-tip">
            <div className="section-label" style={{ color: "var(--accent-2)", marginBottom: 8 }}>💡 Security Tip</div>
            <p style={{ fontSize: "0.85rem", lineHeight: 1.6, margin: 0 }}>
              Never share your credentials over email or chat — even if the request appears to come from IT or a manager. Legitimate systems never ask for your password.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
