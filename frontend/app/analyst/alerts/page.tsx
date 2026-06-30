import Link from "next/link";
import prisma from "../../../lib/db";
import { formatRelativeTime } from "../../../lib/formatters";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Threat Monitor — HRIP",
  description: "Alert queue and triage",
};

export default async function AlertsPage() {
  let alerts;
  try {
    alerts = await prisma.employeeAlert.findMany({
      orderBy: { createdAt: "desc" },
      include: { employee: true },
    });
  } catch {
    return (
      <div className="grid" style={{ gap: 20 }}>
        <section className="card pageIntro">
          <p className="eyebrow">Threat Monitor</p>
          <h2>Alert Queue</h2>
          <p className="muted" style={{ marginTop: 8 }}>
            Unable to load alerts — make sure the database is running.{" "}
            <Link className="tableLink" href="/">← Back to dashboard</Link>
          </p>
        </section>
      </div>
    );
  }

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const highCount     = alerts.filter((a) => a.severity === "high").length;
  const openCount     = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="grid" style={{ gap: 20 }}>
      {/* ── Page intro ── */}
      <section className="card pageIntro fadeIn delay0">
        <p className="eyebrow">Threat Monitor</p>
        <h2>Alert Queue</h2>
        <p className="heroCopy" style={{ marginTop: 8 }}>
          Each alert here is a security event triggered by endpoint telemetry or employee activity.
          Review and acknowledge alerts to keep the environment secure.
        </p>

        <div className="queueSummary">
          <div className="queueSummaryCard">
            <span className="muted">Total alerts</span>
            <strong>{alerts.length}</strong>
          </div>
          <div className="queueSummaryCard">
            <span className="muted">Critical severity</span>
            <strong style={{ color: "var(--danger)" }}>{criticalCount}</strong>
          </div>
          <div className="queueSummaryCard">
            <span className="muted">High severity</span>
            <strong style={{ color: "var(--warning)" }}>{highCount}</strong>
          </div>
          <div className="queueSummaryCard">
            <span className="muted">Unread / Open</span>
            <strong>{openCount}</strong>
          </div>
        </div>
      </section>

      {/* ── Alerts List ── */}
      <section className="card fadeIn delay1">
        <div className="sectionHeader" style={{ marginBottom: 16 }}>
          <h3>All Alerts</h3>
        </div>

        {alerts.length === 0 ? (
          <div className="emptyState">
            <div className="emptyStateIcon">🎉</div>
            <h4>Queue is empty</h4>
            <p>No alerts found. Great job!</p>
          </div>
        ) : (
          <div className="stackList">
            {alerts.map((alert) => (
              <div key={alert.id} className="listRow" style={{ opacity: alert.resolvedAt ? 0.6 : 1 }}>
                <div className="listBody">
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 6 }}>
                    <span className={`badge ${alert.severity}`}>
                      {alert.severity}
                    </span>
                    <strong style={{ fontSize: "1.1rem" }}>{alert.title}</strong>
                    {!alert.isRead && (
                      <span className="statusDot" style={{ background: "var(--accent)" }} title="Unread" />
                    )}
                  </div>
                  
                  <div className="muted" style={{ fontSize: "0.9rem", marginBottom: 8 }}>
                    <strong>Employee:</strong> {alert.employee.name} ({alert.employee.email}) — <strong>Dept:</strong> {alert.employee.department}
                  </div>
                  
                  <div style={{ fontSize: "0.95rem", whiteSpace: "pre-wrap", background: "rgba(0,0,0,0.15)", padding: 12, borderRadius: 6 }}>
                    {alert.description}
                  </div>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0, paddingLeft: 16 }}>
                  <span className="muted" style={{ fontSize: "0.8rem" }}>
                    {formatRelativeTime(alert.createdAt)}
                  </span>
                  
                  {/* Since this is a server component without interactive client logic, we just show state. 
                      In a full real app, we would have a Client Component wrapper for the Mark Read button. */}
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
      </section>
    </div>
  );
}
