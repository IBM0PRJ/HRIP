import Link from "next/link";
import prisma from "../../../lib/db";
import { riskClass, riskColor, riskSeverityLabel } from "../../../lib/formatters";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Employee Risk — HRIP",
  description: "All employees ranked by human risk score",
};

export default async function UsersPage() {
  let users;
  try {
    users = await prisma.employee.findMany({
      orderBy: { riskScore: "desc" },
    });
  } catch {
    return (
      <div className="grid" style={{ gap: 20 }}>
        <section className="card pageIntro fadeIn delay0">
          <p className="eyebrow">Employee Risk</p>
          <h2>Unable to load employee data</h2>
          <p className="muted" style={{ marginTop: 8 }}>
            Check that the database is accessible, then refresh.{" "}
            <Link className="tableLink" href="/">← Back to dashboard</Link>
          </p>
        </section>
      </div>
    );
  }

  const critical = users.filter((u) => u.riskScore >= 85);
  const high     = users.filter((u) => u.riskScore >= 65 && u.riskScore < 85);
  const medium   = users.filter((u) => u.riskScore >= 40 && u.riskScore < 65);
  const low      = users.filter((u) => u.riskScore < 40);

  return (
    <div className="grid" style={{ gap: 20 }}>

      {/* ── Intro ── */}
      <section className="card pageIntro fadeIn delay0">
        <p className="eyebrow">Employee Risk</p>
        <h2>Employee Risk Ranking</h2>
        <p className="heroCopy" style={{ marginTop: 8 }}>
          Employees are scored 0–100 based on the threats they have received and how they
          interact with them. Higher scores mean higher exposure to social engineering attacks.
          Click any employee to see their full risk profile and tailored training plan.
        </p>

        {/* Risk scale legend */}
        <div className="riskLegend">
          <div className="riskLegendItem">
            <span className="riskLegendDot" style={{ background: "#ff8578" }} />
            <span><strong>85–100</strong> Critical</span>
          </div>
          <div className="riskLegendItem">
            <span className="riskLegendDot" style={{ background: "#e7b36b" }} />
            <span><strong>65–84</strong> High</span>
          </div>
          <div className="riskLegendItem">
            <span className="riskLegendDot" style={{ background: "#d4b471" }} />
            <span><strong>40–64</strong> Medium</span>
          </div>
          <div className="riskLegendItem">
            <span className="riskLegendDot" style={{ background: "#8dd0c2" }} />
            <span><strong>0–39</strong> Low</span>
          </div>
        </div>

        {/* Summary stats */}
        <div className="queueSummary" style={{ marginTop: 16 }}>
          <div className="queueSummaryCard">
            <span className="muted">Total employees</span>
            <strong>{users.length}</strong>
          </div>
          <div className="queueSummaryCard">
            <span className="muted">Critical risk</span>
            <strong style={{ color: "#ff8578" }}>{critical.length}</strong>
          </div>
          <div className="queueSummaryCard">
            <span className="muted">High risk</span>
            <strong style={{ color: "#e7b36b" }}>{high.length}</strong>
          </div>
          <div className="queueSummaryCard">
            <span className="muted">Medium risk</span>
            <strong style={{ color: "#d4b471" }}>{medium.length}</strong>
          </div>
          <div className="queueSummaryCard">
            <span className="muted">Low risk</span>
            <strong style={{ color: "#8dd0c2" }}>{low.length}</strong>
          </div>
        </div>
      </section>

      {/* ── Needs immediate attention ── */}
      {(critical.length > 0 || high.length > 0) && (
        <section className="card fadeIn delay1" style={{ borderColor: "rgba(255,133,120,0.2)" }}>
          <div className="sectionHeader">
            <div>
              <p className="muted" style={{ fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Action Required
              </p>
              <h3>Needs Immediate Attention</h3>
            </div>
            <span className="badge critical">{critical.length + high.length} employees</span>
          </div>
          <p className="muted" style={{ marginBottom: 16, fontSize: "0.88rem" }}>
            These employees have critical or high risk scores. Review their profiles and
            assign targeted training as soon as possible.
          </p>
          <div className="stackList">
            {[...critical, ...high].map((user, index) => (
              <Link key={user.id} href={`/users/${user.id}`} className="listRow">
                <div className="listRank">{index + 1}</div>
                <div className="listBody">
                  <div className="listTitle">{user.name}</div>
                  <div className="muted" style={{ fontSize: "0.8rem", marginTop: 2 }}>
                    {user.email} · {user.department}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className={`badge ${user.riskScore >= 85 ? "critical" : "high"}`}>
                    {riskSeverityLabel(user.riskScore)}
                  </span>
                  <div
                    className={`riskPill ${riskClass(user.riskScore)}`}
                    style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", minWidth: 60 }}
                  >
                    {user.riskScore.toFixed(1)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── All employees ── */}
      <section className="card fadeIn delay2">
        <div className="sectionHeader">
          <div>
            <p className="muted" style={{ fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Full Ranking
            </p>
            <h3>All Employees by Risk Score</h3>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="emptyState">
            <div className="emptyStateIcon">👥</div>
            <h4>No employees yet</h4>
            <p>Employees appear here once a message is ingested and a risk score is assigned.</p>
            <Link className="buttonPrimary" href="/" style={{ marginTop: 12, display: "inline-flex" }}>
              Go to dashboard →
            </Link>
          </div>
        ) : (
          <div className="stackList">
            {users.map((user, index) => {
              const color = riskColor(user.riskScore);
              const pct   = user.riskScore;
              return (
                <Link key={user.id} href={`/users/${user.id}`} className="listRow">
                  <div className="listRank" style={{ fontSize: "0.78rem" }}>{index + 1}</div>
                  <div className="listBody">
                    <div className="listTitle">{user.name}</div>
                    <div className="muted" style={{ fontSize: "0.8rem", marginTop: 2 }}>
                      {user.email}
                    </div>
                    {/* Inline mini-bar showing risk score visually */}
                    <div style={{ marginTop: 6, height: 3, width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99 }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{user.department}</span>
                    <div
                      className={`riskPill ${riskClass(user.riskScore)}`}
                      style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", minWidth: 55 }}
                    >
                      {user.riskScore.toFixed(1)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
