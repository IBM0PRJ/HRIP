"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type Alert = {
  id: string;
  title: string;
  description: string;
  severity: string;
  type: string;
  isRead: boolean;
  resolvedAt: string | null;
  createdAt: string;
  employee: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
};

function formatRelativeTime(date: string | Date) {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AlertsFilterClient({ alerts }: { alerts: Alert[] }) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Get unique employees for the dropdown
  const employees = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string }>();
    alerts.forEach((a) => {
      if (!map.has(a.employee.id)) {
        map.set(a.employee.id, { id: a.employee.id, name: a.employee.name, email: a.employee.email });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [alerts]);

  // Filter alerts
  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (selectedEmployee !== "all" && a.employee.id !== selectedEmployee) return false;
      if (selectedSeverity !== "all" && a.severity !== selectedSeverity) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !a.title.toLowerCase().includes(q) &&
          !a.employee.name.toLowerCase().includes(q) &&
          !a.employee.email.toLowerCase().includes(q) &&
          !(a.description || "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [alerts, selectedEmployee, selectedSeverity, searchQuery]);

  const criticalCount = filtered.filter((a) => a.severity === "critical").length;
  const highCount = filtered.filter((a) => a.severity === "high").length;
  const openCount = filtered.filter((a) => !a.isRead).length;

  return (
    <>
      {/* ── Summary Stats ── */}
      <div className="queueSummary">
        <div className="queueSummaryCard">
          <span className="muted">Showing</span>
          <strong>{filtered.length}</strong>
        </div>
        <div className="queueSummaryCard">
          <span className="muted">Critical</span>
          <strong style={{ color: "var(--danger)" }}>{criticalCount}</strong>
        </div>
        <div className="queueSummaryCard">
          <span className="muted">High</span>
          <strong style={{ color: "var(--warning)" }}>{highCount}</strong>
        </div>
        <div className="queueSummaryCard">
          <span className="muted">Unread</span>
          <strong>{openCount}</strong>
        </div>
      </div>

      {/* ── Filters ── */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          marginTop: 16,
          padding: "14px 18px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
        }}
      >
        {/* Search */}
        <input
          type="text"
          placeholder="Search alerts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            flex: 1,
            minWidth: 180,
            fontSize: "0.85rem",
          }}
        />

        {/* Employee Filter */}
        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            fontSize: "0.85rem",
            minWidth: 180,
          }}
        >
          <option value="all">All Employees</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name} ({emp.email})
            </option>
          ))}
        </select>

        {/* Severity Filter */}
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "critical", "high", "medium", "low"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                fontSize: "0.78rem",
                fontWeight: 600,
                textTransform: "capitalize",
                background:
                  selectedSeverity === sev
                    ? "var(--accent)"
                    : "rgba(255,255,255,0.05)",
                color: selectedSeverity === sev ? "#000" : "var(--muted)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {sev === "all" ? "All" : sev}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filtered Alerts List ── */}
      <div style={{ marginTop: 20 }}>
        {filtered.length === 0 ? (
          <div className="emptyState">
            <div className="emptyStateIcon">🎉</div>
            <h4>No alerts match filters</h4>
            <p>Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="stackList">
            {filtered.map((alert) => (
              <div
                key={alert.id}
                className="listRow"
                style={{ opacity: alert.resolvedAt ? 0.6 : 1 }}
              >
                <div className="listBody">
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <span className={`badge ${alert.severity}`}>
                      {alert.severity}
                    </span>
                    <strong style={{ fontSize: "1.1rem" }}>
                      {alert.title}
                    </strong>
                    {!alert.isRead && (
                      <span
                        className="statusDot"
                        style={{ background: "var(--accent)" }}
                        title="Unread"
                      />
                    )}
                  </div>

                  <div
                    className="muted"
                    style={{ fontSize: "0.9rem", marginBottom: 8 }}
                  >
                    <strong>Employee:</strong>{" "}
                    <Link
                      href={`/analyst/users/${alert.employee.id}`}
                      style={{
                        color: "var(--accent)",
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      {alert.employee.name}
                    </Link>{" "}
                    ({alert.employee.email}) —{" "}
                    <strong>Dept:</strong> {alert.employee.department}
                  </div>

                  <div
                    style={{
                      fontSize: "0.95rem",
                      whiteSpace: "pre-wrap",
                      background: "rgba(0,0,0,0.15)",
                      padding: 12,
                      borderRadius: 6,
                    }}
                  >
                    {alert.description}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 8,
                    flexShrink: 0,
                    paddingLeft: 16,
                  }}
                >
                  <span className="muted" style={{ fontSize: "0.8rem" }}>
                    {formatRelativeTime(alert.createdAt)}
                  </span>

                  {alert.resolvedAt ? (
                    <span className="badge low">Resolved</span>
                  ) : alert.isRead ? (
                    <span className="badge neutral">Acknowledged</span>
                  ) : (
                    <span className="badge warning">Needs Review</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
