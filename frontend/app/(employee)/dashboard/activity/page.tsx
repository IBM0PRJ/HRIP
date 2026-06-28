"use client";

import { useState, useEffect, useRef } from "react";

const INTEGRATIONS = [
  { id: "email",     icon: "✉️",  name: "Email Scanning",   desc: "Monitors inbox for phishing threats" },
  { id: "sms",       icon: "💬",  name: "SMS Monitoring",    desc: "Flags suspicious SMS messages" },
  { id: "network",   icon: "🌐",  name: "Network Monitor",   desc: "Detects suspicious outbound connections" },
  { id: "usb",       icon: "🔌",  name: "USB Protection",    desc: "Blocks unauthorized mass storage devices" },
  { id: "files",     icon: "📁",  name: "File Access Guard", desc: "Tracks sensitive file access events" },
  { id: "clipboard", icon: "📋",  name: "Clipboard Guard",   desc: "Prevents clipboard data exfiltration" },
];

const EVENT_TYPES = ["all", "logon", "network", "usb", "file", "clipboard"] as const;

function buildHeatmap(logs: any[]) {
  const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
  logs.forEach(log => {
    const h = new Date(log.createdAt).getHours();
    hours[h].count++;
  });
  return hours;
}

function buildDailyChart(logs: any[]) {
  const days: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days[d.toLocaleDateString("en-US", { weekday: "short" })] = 0;
  }
  logs.forEach(log => {
    const d = new Date(log.createdAt);
    const key = d.toLocaleDateString("en-US", { weekday: "short" });
    if (key in days) days[key]++;
  });
  return Object.entries(days).map(([day, count]) => ({ day, count }));
}

export default function ActivityPage() {
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [empData, setEmpData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [integrations, setIntegrations] = useState<Record<string, boolean>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadData();
    // Auto-refresh every 10 seconds
    intervalRef.current = setInterval(loadData, 10000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const loadData = async () => {
    try {
      const meRes = await fetch("/api/employee/me");
      const meData = await meRes.json();
      setEmpData(meData);
      if (meData.employee?.email) {
        const telRes = await fetch(`/api/telemetry?email=${encodeURIComponent(meData.employee.email)}`);
        const telData = await telRes.json();
        setTelemetry(telData.logs || []);
      }
      if (meData.session?.integrations) {
        setIntegrations(meData.session.integrations);
      }
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const handleToggle = async (id: string, current: boolean) => {
    if (!empData?.employee?.email) return;
    const newVal = !current;
    setIntegrations(prev => ({ ...prev, [id]: newVal }));
    try {
      await fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: empData.employee.email, integration: id, status: newVal })
      });
      loadData();
    } catch {
      setIntegrations(prev => ({ ...prev, [id]: current }));
    }
  };

  const filterLog = (log: any) => {
    if (filter === "all") return true;
    const msg = (log.message || "").toLowerCase();
    if (filter === "logon") return msg.includes("logon") || msg.includes("login") || msg.includes("sign");
    if (filter === "network") return msg.includes("network") || msg.includes("connect");
    if (filter === "usb") return msg.includes("usb") || msg.includes("storage");
    if (filter === "file") return msg.includes("file") || msg.includes("document");
    if (filter === "clipboard") return msg.includes("clipboard") || msg.includes("copy");
    return true;
  };

  const filtered = telemetry.filter(filterLog);
  const heatmap = buildHeatmap(telemetry);
  const chart = buildDailyChart(telemetry);
  const chartMax = Math.max(...chart.map(d => d.count), 1);
  const heatMax = Math.max(...heatmap.map(h => h.count), 1);
  const activeCount = Object.values(integrations).filter(Boolean).length;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .act-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); border-radius: 18px; padding: 24px; }
        .int-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); margin-bottom: 8px; transition: all 0.2s; }
        .int-row.on { background: rgba(141,208,194,0.06); border-color: rgba(141,208,194,0.15); }
        .int-row:hover { background: rgba(255,255,255,0.04); }
        .emp-toggle { width: 44px; height: 24px; border-radius: 12px; background: rgba(255,255,255,0.1); border: none; cursor: pointer; position: relative; transition: background 0.25s; flex-shrink: 0; }
        .emp-toggle.on { background: var(--accent-2); }
        .emp-toggle-knob { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform 0.25s; }
        .emp-toggle.on .emp-toggle-knob { transform: translateX(20px); }
        .bar-wrap { display: flex; align-items: flex-end; gap: 6px; height: 80px; }
        .bar { flex: 1; background: rgba(212,180,113,0.25); border-radius: 6px 6px 0 0; transition: height 0.6s ease; min-height: 4px; }
        .bar:hover { background: rgba(212,180,113,0.5); }
        .heat-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 4px; }
        .heat-cell { height: 20px; border-radius: 4px; transition: background 0.3s; }
        .log-row { display: flex; align-items: flex-start; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .log-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent-2); flex-shrink: 0; margin-top: 5px; }
        .filter-chip { padding: 6px 14px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: var(--muted); font-size: 0.8rem; cursor: pointer; transition: all 0.15s; text-transform: capitalize; }
        .filter-chip.active { background: var(--accent); border-color: var(--accent); color: #081019; font-weight: 700; }
        .live-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--success); animation: pulse 2s infinite; display: inline-block; margin-right: 6px; }
        @keyframes pulse { 0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgba(141,208,194,0.4); } 50% { opacity: 0.6; box-shadow: 0 0 0 6px rgba(141,208,194,0); } }
      `}} />

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent)", marginBottom: 6 }}>Device Activity</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: "1.8rem", marginBottom: 4 }}>Activity Log</h2>
            <p className="muted" style={{ fontSize: "0.88rem" }}>
              <span className="live-dot" />Live feed · {activeCount}/{INTEGRATIONS.length} integrations active · {telemetry.length} events logged
            </p>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Daily Bar Chart */}
        <div className="act-card">
          <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 16 }}>📊 Events This Week</div>
          <div className="bar-wrap">
            {chart.map(({ day, count }) => (
              <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div className="bar" style={{ height: `${chartMax ? (count / chartMax) * 70 + 4 : 4}px`, width: "100%" }} title={`${count} events`} />
                <div className="muted" style={{ fontSize: "0.65rem", textTransform: "uppercase" }}>{day}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap */}
        <div className="act-card">
          <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 16 }}>🌡️ Hourly Heatmap</div>
          <div className="heat-grid">
            {heatmap.map(({ hour, count }) => {
              const intensity = heatMax ? count / heatMax : 0;
              return (
                <div key={hour} className="heat-cell"
                  style={{ background: count === 0 ? "rgba(255,255,255,0.05)" : `rgba(212,180,113,${0.15 + intensity * 0.75})` }}
                  title={`${hour}:00 — ${count} events`}
                />
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span className="muted" style={{ fontSize: "0.68rem" }}>12 AM</span>
            <span className="muted" style={{ fontSize: "0.68rem" }}>12 PM</span>
            <span className="muted" style={{ fontSize: "0.68rem" }}>11 PM</span>
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="act-card" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          ⚙️ Integration Controls
          <span style={{ marginLeft: "auto", fontSize: "0.78rem", color: "var(--muted)", fontWeight: 400 }}>
            {activeCount} active
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {INTEGRATIONS.map(int => {
            const isOn = integrations[int.id] ?? false;
            return (
              <div key={int.id} className={`int-row ${isOn ? "on" : ""}`}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: "1.1rem" }}>{int.icon}</span>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{int.name}</div>
                    <div className="muted" style={{ fontSize: "0.72rem" }}>{int.desc}</div>
                  </div>
                </div>
                <button className={`emp-toggle ${isOn ? "on" : ""}`} onClick={() => handleToggle(int.id, isOn)} aria-label={`Toggle ${int.name}`}>
                  <div className="emp-toggle-knob" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Log */}
      <div className="act-card">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center" }}>
            <span className="live-dot" />Live Event Feed
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {EVENT_TYPES.map(t => (
              <button key={t} className={`filter-chip ${filter === t ? "active" : ""}`} onClick={() => setFilter(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="emptyState">
            <div className="emptyStateIcon">◉</div>
            <p className="muted">No events {filter !== "all" ? `matching "${filter}"` : "logged yet"}. Enable integrations to start monitoring.</p>
          </div>
        ) : (
          <div style={{ maxHeight: 400, overflowY: "auto", paddingRight: 4 }}>
            {filtered.slice(0, 50).map((log: any) => (
              <div key={log.id} className="log-row">
                <div className="log-dot" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.85rem" }}>{log.message}</div>
                </div>
                <div className="muted" style={{ fontSize: "0.72rem", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
