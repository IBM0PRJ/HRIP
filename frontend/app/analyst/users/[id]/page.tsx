import Link from "next/link";
import { getUserProfile, getUserAIFlags } from "../../../../lib/api";
import {
  riskColor, riskClass, riskSeverityLabel,
  formatThreatType, formatChannelShort, formatStatus,
  featureLevel,
} from "../../../../lib/formatters";
import { ContainmentPanel } from "./ContainmentPanel";
import { DeviceLogsDrawer } from "./DeviceLogsDrawer";
import { AuditRequestPanel } from "./AuditRequestPanel";
import { RiskOverridePanel } from "./RiskOverridePanel";
import { AssignTrainingPanel } from "./AssignTrainingPanel";
function RiskGauge({ score }: { score: number }) {
  const r     = 54;
  const circ  = 2 * Math.PI * r;
  const color = riskColor(score);

  return (
    <div className="gaugeWrap">
      <svg width="150" height="150" viewBox="0 0 150 150" aria-label={`Risk score ${score.toFixed(1)} out of 100`}>
        <circle cx="75" cy="75" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx="75" cy="75" r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - score / 100)}
          strokeLinecap="round"
          transform="rotate(-90 75 75)"
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 8px ${color}55)` }}
        />
      </svg>
      <span className={`gaugeNumber ${riskClass(score)}`}>{score.toFixed(1)}</span>
      <span className="gaugeSeverity">{riskSeverityLabel(score)}</span>
    </div>
  );
}

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  let profile;
  let aiFlags = [];
  try {
    profile = await getUserProfile(params.id);
    aiFlags = await getUserAIFlags(params.id).catch(() => []);
  } catch {
    return (
      <div className="grid" style={{ gap: 20 }}>
        <section className="card pageIntro">
          <p className="eyebrow">Employee Profile</p>
          <h2>Employee not found</h2>
          <p className="muted" style={{ marginTop: 8 }}>
            This employee may not exist or the ID is incorrect.{" "}
            <Link className="tableLink" href="/analyst/users">← Back to employee list</Link>
          </p>
        </section>
      </div>
    );
  }

  const { user, risk_history, alerts, training_plan } = profile;
  const hasHighRisk = user.risk_score >= 65;

  return (
    <div className="grid" style={{ gap: 20 }}>

      {/* ── Profile hero ── */}
      <section className="card pageIntro fadeIn delay0">
        <p className="eyebrow">Employee Profile</p>

        {/* Risk context banner */}
        {hasHighRisk && (
          <div className="riskContextBanner">
            <span>⚠</span>
            <div>
              <strong>This employee has {riskSeverityLabel(user.risk_score).toLowerCase()} exposure</strong>
              {" — "}
              <span>They have received {alerts.length} threat{alerts.length !== 1 ? "s" : ""}.
              Review their linked alerts and assign the training plan below.</span>
            </div>
          </div>
        )}

        <div className="detailHero" style={{ marginTop: 16 }}>
          <div>
            <h2 style={{ marginBottom: 10 }}>{user.full_name}</h2>
            <div style={{ display: "grid", gap: 6 }}>
              <div className="profileMetaRow">
                <span className="muted" style={{ fontSize: "0.84rem" }}>✉</span>
                <span>{user.email}</span>
              </div>
              <div className="profileMetaRow">
                <span className="muted" style={{ fontSize: "0.84rem" }}>🏢</span>
                <span className="muted">{user.department} · {user.role}</span>
              </div>
              <div className="profileMetaRow" style={{ marginTop: 4 }}>
                <span className={`badge ${hasHighRisk ? (user.risk_score >= 85 ? "critical" : "high") : "low"}`}>
                  {riskSeverityLabel(user.risk_score)}
                </span>
                <span className="muted" style={{ fontSize: "0.8rem" }}>
                  {alerts.filter(a => a.status === "open").length} open alerts
                </span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <RiskGauge score={user.risk_score} />
            <div className="muted" style={{ fontSize: "0.74rem", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Risk score (0 = safe · 100 = critical)
            </div>
          </div>
        </div>
      </section>

      {/* ── Risk history + Linked alerts ── */}
      <section className="grid detailSplit fadeIn delay1">

        {/* Risk history */}
        <div className="card">
          <h3 style={{ marginBottom: 4 }}>Risk score history</h3>
          <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 16 }}>
            Each time a threat involving this employee is processed, their risk score is
            recalculated. Higher is worse.
          </p>

          {risk_history.length === 0 ? (
            <div className="emptyState">
              <div className="emptyStateIcon">📊</div>
              <h4>No history yet</h4>
              <p>Risk events will appear here once threats are processed.</p>
            </div>
          ) : (
            <div className="stackList">
              {risk_history.map((entry) => {
                const color = riskColor(entry.score);
                return (
                  <div
                    className="listRow static"
                    key={`${entry.created_at}-${entry.score}`}
                  >
                    <div className="listBody">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span className={`riskScore ${riskClass(entry.score)}`}>
                          {entry.score.toFixed(1)}
                          <span style={{ fontSize: "0.76rem", marginLeft: 4, color: "var(--muted)" }}>/100</span>
                        </span>
                        <span className={`badge ${entry.severity}`}>{riskSeverityLabel(entry.score)}</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${entry.score}%`, background: color, borderRadius: 99 }} />
                      </div>
                      <div className="muted" style={{ fontSize: "0.78rem", marginTop: 5 }}>
                        {new Date(entry.created_at).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Linked alerts */}
        <div className="card">
          <h3 style={{ marginBottom: 4 }}>Threats linked to this employee</h3>
          <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 16 }}>
            Every message flagged as a threat that was sent to this person. Click to investigate.
          </p>

          {alerts.length === 0 ? (
            <div className="emptyState">
              <div className="emptyStateIcon">✅</div>
              <h4>No threats found</h4>
              <p>No flagged messages have been linked to this employee yet.</p>
            </div>
          ) : (
            <div className="stackList">
              {alerts.map((alert) => (
                <Link className="listRow" href={`/analyst/alerts/${alert.id}`} key={alert.id}>
                  <div className="listBody">
                    <div className="listTitle">
                      {formatThreatType(alert.threat_type)} via {formatChannelShort(alert.channel)}
                    </div>
                    <div className="muted" style={{ fontSize: "0.78rem", marginTop: 2 }}>
                      {new Date(alert.created_at).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                    <span className={`badge ${alert.severity}`}>{alert.severity}</span>
                    <span className="statusTag">{formatStatus(alert.status)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── AI Flags ── */}
      <section className="card fadeIn delay1">
        <div className="sectionHeader" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h3 style={{ marginBottom: 4 }}>AI Risk Flags</h3>
            <p className="muted" style={{ fontSize: "0.84rem" }}>
              Active behavioral anomalies detected by Qwen AI.
            </p>
          </div>
          <span className="badge medium" style={{ background: aiFlags.length > 0 ? 'rgba(239,68,68,0.2)' : undefined, color: aiFlags.length > 0 ? '#f87171' : undefined }}>{aiFlags.length} flags</span>
        </div>
        
        {aiFlags.length === 0 ? (
          <div className="emptyState">
            <div className="emptyStateIcon">✨</div>
            <h4>No AI Flags</h4>
            <p>Qwen AI has not detected any anomalous behavior for this user.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {aiFlags.map(flag => (
              <div key={flag.id} style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 12, transition: 'all 0.3s ease' }} className="hover:border-white/20">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.2rem' }}>{flag.source === 'usb' ? '🔌' : flag.source === 'network' ? '🌐' : '🛡️'}</span>
                    <span style={{ fontWeight: 600, textTransform: 'capitalize', color: 'rgba(255,255,255,0.9)' }}>{flag.threat_category.replace(/_/g, ' ')}</span>
                  </div>
                  <div style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(239,68,68,0.2)', color: '#f87171', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(239,68,68,0.3)' }}>
                    {flag.suspicion_score}% Risk
                  </div>
                </div>
                <p className="muted" style={{ fontSize: '0.85rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {flag.qwen_reasoning || "No reasoning provided."}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="muted" style={{ fontSize: '0.75rem' }}>{new Date(flag.created_at).toLocaleString("en-IN")}</span>
                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>{flag.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Containment Actions & Live Telemetry ── */}
      <RiskOverridePanel userId={user.id} currentScore={user.risk_score} />
      <ContainmentPanel userId={user.id} email={user.email} />
      
      <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <DeviceLogsDrawer email={user.email} />
        <Link
          href={`/analyst/stream?email=${encodeURIComponent(user.email)}`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 18px", borderRadius: 10,
            background: "rgba(141,208,194,0.08)", border: "1px solid rgba(141,208,194,0.2)",
            color: "var(--accent-2)", fontSize: "0.85rem", fontWeight: 600,
            textDecoration: "none", transition: "all 0.2s"
          }}
        >
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "var(--success)", boxShadow: "0 0 6px var(--success)" }} />
          View Live Stream →
        </Link>
      </div>

      <AuditRequestPanel email={user.email} />

      {/* ── Training Assignment & Plan ── */}
      <AssignTrainingPanel userId={user.id} />

      <section className="card fadeIn delay2" style={{ marginTop: 20 }}>
        <div className="sectionHeader">
          <div>
            <p className="statLabel" style={{ marginBottom: 6 }}>Recommended Actions</p>
            <h3>Targeted Training Plan</h3>
          </div>
          <span className={`badge ${training_plan.overall_priority}`}>
            {training_plan.overall_priority === "critical" ? "⚠ Critical priority"
           : training_plan.overall_priority === "high"     ? "High priority"
           : training_plan.overall_priority === "medium"   ? "Medium priority"
           : "Low priority"}
          </span>
        </div>

        <div className="trainingPlanSummary">
          <span>📋</span>
          <p className="muted">{training_plan.summary}</p>
        </div>

        {training_plan.items.length === 0 ? (
          <p className="muted">No training items generated yet.</p>
        ) : (
          <div className="recommendationGrid">
            {training_plan.items.map((item, idx) => {
              const isUrgent = item.due_in_days <= 3;
              return (
                <article key={item.title} className="recommendationCard" data-priority={item.priority}>
                  <div className="recommendationTop">
                    <div>
                      <div className="recommendationNum">Training {idx + 1}</div>
                      <div className="listTitle" style={{ marginTop: 4 }}>{item.title}</div>
                      <div className="muted" style={{ fontSize: "0.8rem", marginTop: 4 }}>
                        Focus: {item.focus_area}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                      <span className={`badge ${item.priority}`}>{item.priority}</span>
                      <span className={isUrgent ? "dueBadge" : "chip"}>
                        Due in {item.due_in_days} day{item.due_in_days !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <p className="recommendationSummary">{item.summary}</p>

                  <div className="recommendationSection">
                    <strong>Actions to take</strong>
                    <ul className="recommendationList">
                      {item.actions.map((action) => (
                        <li key={action}>{action}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="recommendationSection">
                    <strong>Why this is recommended</strong>
                    <ul className="recommendationList muted">
                      {item.evidence.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
