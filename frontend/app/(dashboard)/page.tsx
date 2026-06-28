import Link from "next/link";
import { WorkflowGuide } from "../../components/WorkflowGuide";
import prisma from "../../lib/db";
import { riskSeverityLabel, formatRelativeTime } from "../../lib/formatters";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    // Fetch from Prisma
    const [employees, alerts, incidents] = await Promise.all([
      prisma.employee.findMany({ orderBy: { riskScore: 'desc' } }),
      prisma.employeeAlert.findMany({ orderBy: { createdAt: 'desc' }, include: { employee: true } }),
      prisma.incidentReport.findMany({ orderBy: { createdAt: 'desc' }, include: { employee: true } })
    ]);

    const totalAlerts = alerts.length;
    const openAlerts = alerts.filter(a => !a.isRead);
    const criticalAlerts = alerts.filter(a => (a.severity === "critical" || a.severity === "high") && !a.isRead);
    const highRiskUsers = employees.filter(e => e.riskScore > 60).slice(0, 6);
    
    const avgRisk = employees.length > 0 
      ? employees.reduce((sum, e) => sum + e.riskScore, 0) / employees.length 
      : 0;

    return (
      <div className="grid" style={{ gap: 24 }}>
        <WorkflowGuide />

        {criticalAlerts.length > 0 && (
          <section className="urgentBanner fadeIn delay0">
            <div className="urgentBannerLeft">
              <span className="urgentIcon">⚠</span>
              <div>
                <div className="urgentBannerTitle">
                  {criticalAlerts.length} critical or high-severity alerts need your attention
                </div>
                <div className="muted" style={{ fontSize: "0.84rem", marginTop: 2 }}>
                  These have not been reviewed yet — open the queue to start triaging
                </div>
              </div>
            </div>
            <Link className="buttonPrimary" href="/alerts?status=open">
              Triage now →
            </Link>
          </section>
        )}

        <section className="hero heroLuxury fadeIn delay0">
          <div className="heroContent">
            <p className="eyebrow">Security Operations</p>
            <h1>One console from detection to containment.</h1>
            <p className="heroCopy">
              HRIP watches endpoint telemetry and training performance to identify human risk
              — surfacing the right information so you can act immediately.
            </p>
            <div className="heroActions">
              <Link className="buttonPrimary" href="/alerts">
                Open threat queue →
              </Link>
              <Link className="buttonSecondary" href="/users">
                Review employee exposure
              </Link>
            </div>
          </div>

          <div className="heroStatsPanel heroStats">
            <div className="card statHeroCard fadeIn delay1">
              <div className="statLabel">Total alerts detected</div>
              <h3 className="statNumber">{totalAlerts}</h3>
              <p className="heroStatCopy">Threats identified across the platform.</p>
            </div>
            <div className="card statHeroCard warning fadeIn delay2">
              <div className="statLabel">Need immediate action</div>
              <h3 className="statNumber" style={{ color: "var(--warning)" }}>
                {criticalAlerts.length}
              </h3>
              <p className="heroStatCopy">Critical and high-severity alerts still open.</p>
              {criticalAlerts.length > 0 && (
                <Link className="statAction" href="/alerts?severity=critical">
                  Start triaging →
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="cards fadeIn delay1">
          <div className="card metricCard accent">
            <div className="statLabel">Overall organisation risk</div>
            <h3 style={{ marginTop: 8 }}>{avgRisk.toFixed(1)}<span style={{ fontSize: "1rem", color: "var(--muted)", marginLeft: 4 }}>/100</span></h3>
            <div className="metricContext">
              <span className={`badge ${avgRisk >= 65 ? "high" : avgRisk >= 40 ? "medium" : "low"}`}>
                {riskSeverityLabel(avgRisk)}
              </span>
              <span className="muted" style={{ fontSize: "0.78rem" }}>avg across all employees</span>
            </div>
          </div>

          <div className="card metricCard neutral">
            <div className="statLabel">Employees tracked</div>
            <h3 style={{ marginTop: 8 }}>{employees.length}</h3>
            <div className="metricContext">
              <span className="muted" style={{ fontSize: "0.78rem" }}>
                {highRiskUsers.length} at high or critical risk
              </span>
              <Link className="tableLink" href="/users" style={{ fontSize: "0.8rem" }}>See all →</Link>
            </div>
          </div>
          
          <div className="card metricCard neutral">
            <div className="statLabel">User Reported Incidents</div>
            <h3 style={{ marginTop: 8 }}>{incidents.length}</h3>
            <div className="metricContext">
              <span className="muted" style={{ fontSize: "0.78rem" }}>
                {incidents.filter(i => i.status === 'pending_review').length} pending review
              </span>
              <Link className="tableLink" href="/incidents" style={{ fontSize: "0.8rem" }}>View reports →</Link>
            </div>
          </div>
        </section>

        <div className="grid splitGrid fadeIn delay2">
          {/* Recent Activity Log (Alerts) */}
          <section className="card flexCard">
            <div className="cardHeader">
              <div>
                <h3>Recent Alerts</h3>
                <p className="muted" style={{ fontSize: "0.85rem", marginTop: 4 }}>
                  Latest security events
                </p>
              </div>
              <Link className="tableLink" href="/alerts">View All</Link>
            </div>
            
            <div className="activityList">
              {alerts.slice(0, 8).map((alert, i) => (
                <div key={alert.id} className="activityItem">
                  <div className={`activityIcon ${alert.severity === "critical" ? "danger" : alert.severity === "high" ? "danger" : "warning"}`}>
                    ⚠️
                  </div>
                  <div className="activityContent">
                    <div className="activityTop">
                      <span className="activitySender">{alert.title}</span>
                      <span className="activityTime">{formatRelativeTime(alert.createdAt)}</span>
                    </div>
                    <div className="activityDesc">
                      <span className="muted">Employee:</span> {alert.employee.name} ({alert.employee.email})
                    </div>
                    <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center" }}>
                      <span className={`badge ${alert.severity}`} style={{ padding: "2px 6px", fontSize: "0.7rem" }}>
                        {alert.type.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="muted" style={{ padding: 20, textAlign: "center", fontStyle: "italic" }}>
                  No alerts detected yet.
                </div>
              )}
            </div>
          </section>

          {/* High Risk Employees */}
          <section className="card flexCard">
            <div className="cardHeader">
              <div>
                <h3>Highest Exposure Risk</h3>
                <p className="muted" style={{ fontSize: "0.85rem", marginTop: 4 }}>
                  Employees needing immediate training
                </p>
              </div>
              <Link className="tableLink" href="/users">View All</Link>
            </div>
            
            <div className="tableWrap" style={{ flex: 1 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: "60%" }}>Employee</th>
                    <th style={{ textAlign: "right" }}>Risk Score</th>
                  </tr>
                </thead>
                <tbody>
                  {highRiskUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="tableCell userCell">
                          <Link href={`/users`} className="userAvatarLink">
                            <div className="userAvatar">{user.name.charAt(0)}</div>
                          </Link>
                          <div>
                            <Link href={`/users`} className="userName textLink">
                              {user.name}
                            </Link>
                            <div className="userRole">{user.department}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className={`riskBadge ${avgRisk >= 65 ? "high" : avgRisk >= 40 ? "medium" : "low"}`}>
                          {user.riskScore}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {highRiskUsers.length === 0 && (
                    <tr>
                      <td colSpan={2} className="muted" style={{ textAlign: "center", padding: "32px 16px" }}>
                        No high risk users tracked yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="grid" style={{ gap: 20 }}>
        <section className="card pageIntro">
          <h2>Database Error</h2>
          <p className="muted" style={{ marginTop: 8 }}>Could not connect to the database.</p>
        </section>
      </div>
    );
  }
}
