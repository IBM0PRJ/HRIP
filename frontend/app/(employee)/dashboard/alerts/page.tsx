"use client";

import { useState, useEffect } from "react";

const SEVERITIES = ["all", "critical", "high", "medium", "low"] as const;

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { fetchAlerts(); }, []);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/employee/alerts");
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/employee/alerts/${id}/read`, { method: "PATCH" });
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
    } catch { }
  };

  const handleMarkAllRead = async () => {
    const unread = alerts.filter(a => !a.isRead);
    await Promise.all(unread.map(a => fetch(`/api/employee/alerts/${a.id}/read`, { method: "PATCH" })));
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
  };

  const handleExport = () => {
    const rows = [["Title", "Severity", "Description", "Read", "Date"]];
    alerts.forEach(a => rows.push([a.title, a.severity, a.description, a.isRead ? "Yes" : "No", new Date(a.createdAt).toLocaleString()]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "alerts.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const sevColor = (s: string) => ({
    critical: "var(--danger)", high: "var(--warning)",
    medium: "var(--accent)", low: "var(--success)"
  }[s] || "var(--muted)");

  const filtered = alerts.filter(a => {
    const matchSev = filter === "all" || a.severity === filter;
    const matchSearch = !search || a.title?.toLowerCase().includes(search.toLowerCase()) || a.description?.toLowerCase().includes(search.toLowerCase());
    return matchSev && matchSearch;
  });

  const unread = alerts.filter(a => !a.isRead).length;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .alert-card { padding: 18px; border-radius: 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); margin-bottom: 10px; transition: border-color 0.2s, background 0.2s; cursor: pointer; }
        .alert-card:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.12); }
        .alert-card.unread { border-left: 3px solid var(--accent); }
        .alert-card.read { opacity: 0.55; }
        .sev-chip { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
        .filter-bar { display: flex; gap: 8px; flex-wrap: wrap; }
        .filter-chip { padding: 6px 14px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: var(--muted); font-size: 0.8rem; cursor: pointer; transition: all 0.15s; }
        .filter-chip.active { background: var(--accent); border-color: var(--accent); color: #081019; font-weight: 700; }
        .filter-chip:hover:not(.active) { border-color: rgba(255,255,255,0.2); color: var(--text); }
        .expand-section { overflow: hidden; transition: max-height 0.3s ease; }
      `}} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent)", marginBottom: 6 }}>Security Alerts</div>
          <h2 style={{ fontSize: "1.8rem", marginBottom: 4 }}>My Alerts</h2>
          <p className="muted" style={{ fontSize: "0.88rem" }}>
            {unread > 0 ? <><strong style={{ color: "var(--danger)" }}>{unread} unread</strong> alerts requiring your attention</> : "All alerts acknowledged ✓"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {unread > 0 && (
            <button className="buttonSecondary" onClick={handleMarkAllRead} style={{ fontSize: "0.82rem" }}>
              ✓ Mark All Read
            </button>
          )}
          <button className="buttonSecondary" onClick={handleExport} style={{ fontSize: "0.82rem" }}>
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="🔍  Search alerts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: "1 1 200px", maxWidth: 320, padding: "10px 16px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text)", fontSize: "0.88rem" }}
        />
        <div className="filter-bar">
          {SEVERITIES.map(s => (
            <button key={s} className={`filter-chip ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)} style={{ textTransform: "capitalize" }}>
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: 60 }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="emptyState">
          <div className="emptyStateIcon">🛡️</div>
          <p className="muted">{search || filter !== "all" ? "No alerts match your filters." : "No security alerts detected."}</p>
        </div>
      ) : (
        filtered.map((alert: any) => {
          const color = sevColor(alert.severity);
          const isExpanded = expanded === alert.id;
          return (
            <div
              key={alert.id}
              className={`alert-card ${alert.isRead ? "read" : "unread"}`}
              onClick={() => setExpanded(isExpanded ? null : alert.id)}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}`, flexShrink: 0, marginTop: 6 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                    <strong style={{ fontSize: "0.95rem" }}>{alert.title}</strong>
                    <span className="sev-chip" style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>{alert.severity}</span>
                    {!alert.isRead && <span className="sev-chip" style={{ background: "rgba(212,180,113,0.15)", color: "var(--accent)", border: "1px solid rgba(212,180,113,0.2)" }}>NEW</span>}
                  </div>
                  <p className="muted" style={{ fontSize: "0.85rem" }}>{alert.description}</p>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                        <div>
                          <div className="muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Detected</div>
                          <div style={{ fontSize: "0.85rem" }}>{alert.createdAt ? new Date(alert.createdAt).toLocaleString() : "Unknown"}</div>
                        </div>
                        <div>
                          <div className="muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Status</div>
                          <div style={{ fontSize: "0.85rem", color: alert.isRead ? "var(--muted)" : "var(--accent)" }}>{alert.isRead ? "Acknowledged" : "Awaiting Acknowledgement"}</div>
                        </div>
                      </div>
                      {!alert.isRead && (
                        <button
                          className="buttonPrimary"
                          onClick={e => { e.stopPropagation(); handleMarkRead(alert.id); }}
                          style={{ fontSize: "0.85rem" }}
                        >
                          Acknowledge Alert
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <span className="muted" style={{ fontSize: "0.75rem", flexShrink: 0 }}>{isExpanded ? "▲" : "▼"}</span>
              </div>
            </div>
          );
        })
      )}
    </>
  );
}
