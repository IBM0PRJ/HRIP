import Link from "next/link";
import { AlertStatusForm } from "../../../../components/AlertStatusForm";
import { getAlert } from "../../../../lib/api";
import {
  formatThreatType,
  formatChannelShort,
  formatStatus,
  confidenceLabel,
  formatFeatureName,
  formatPsychologyLabel,
  featureLevel,
} from "../../../../lib/formatters";

export default async function AlertDetailPage({ params }: { params: { id: string } }) {
  let detail;
  try {
    detail = await getAlert(params.id);
  } catch {
    return (
      <div className="grid" style={{ gap: 20 }}>
        <section className="card pageIntro">
          <p className="eyebrow">Alert Detail</p>
          <h2>Alert not found</h2>
          <p className="muted" style={{ marginTop: 8 }}>
            This alert may have been removed or the ID is incorrect.{" "}
            <Link className="tableLink" href="/analyst/alerts">← Back to alert queue</Link>
          </p>
        </section>
      </div>
    );
  }

  const psychoEntries = Object.entries(detail.detection.psychology_scores);
  const confidence    = detail.detection.confidence;

  return (
    <div className="grid" style={{ gap: 20 }}>

      {/* ── Identity + Action (primary action card — always first) ── */}
      <section className="card pageIntro fadeIn delay0" style={{
        borderColor: detail.alert.severity === "critical" ? "rgba(255,133,120,0.3)"
                   : detail.alert.severity === "high"     ? "rgba(231,179,107,0.3)"
                   : undefined
      }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
          <span className={`badge ${detail.alert.severity}`}>{detail.alert.severity}</span>
          <span className="statusTag">{formatStatus(detail.alert.status)}</span>
          <span className="muted" style={{ fontSize: "0.8rem" }}>
            Detected {new Date(detail.alert.created_at).toLocaleString("en-IN")}
          </span>
        </div>

        <h2 style={{ marginBottom: 6 }}>{formatThreatType(detail.detection.threat_type)}</h2>
        <p className="muted" style={{ fontSize: "0.9rem", marginBottom: 20 }}>
          Arrived via <strong>{formatChannelShort(detail.message.channel)}</strong> from{" "}
          <strong>{detail.message.sender}</strong>
          {detail.message.subject ? ` · Subject: "${detail.message.subject}"` : ""}
        </p>

        {/* ── Primary action: status update ── */}
        <div className="statusUpdateCard">
          <div className="statusUpdateHeader">
            <div>
              <div className="statLabel">Update investigation status</div>
              <div className="muted" style={{ fontSize: "0.82rem", marginTop: 2 }}>
                Move this alert through the triage workflow as you investigate
              </div>
            </div>
            <Link className="tableLink" href={`/users/${detail.alert.user_id}`} style={{ fontSize: "0.84rem", flexShrink: 0 }}>
              View linked employee →
            </Link>
          </div>
          <AlertStatusForm alertId={detail.alert.id} initialStatus={detail.alert.status} />
        </div>
      </section>

      {/* ── Message evidence ── */}
      <section className="card fadeIn delay1">
        <h3 style={{ marginBottom: 4 }}>Message Evidence</h3>
        <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 18 }}>
          The original message that triggered this alert.
        </p>
        <div className="grid detailSplit" style={{ gap: 20 }}>
          <div>
            <dl className="detailList">
              <div className="infoRow">
                <dt>Received via</dt>
                <dd>{formatChannelShort(detail.message.channel)}</dd>
              </div>
              <div className="infoRow">
                <dt>Sent from</dt>
                <dd>{detail.message.sender}</dd>
              </div>
              <div className="infoRow">
                <dt>Sent to</dt>
                <dd>
                  <Link className="tableLink" href={`/users/${detail.alert.user_id}`}>
                    {detail.message.receiver}
                  </Link>
                  <span className="muted" style={{ fontSize: "0.78rem", marginLeft: 6 }}>← view employee profile</span>
                </dd>
              </div>
              {detail.message.subject && (
                <div className="infoRow">
                  <dt>Subject line</dt>
                  <dd>{detail.message.subject}</dd>
                </div>
              )}
            </dl>
          </div>
          <div>
            <div className="statLabel" style={{ marginBottom: 8 }}>Message body</div>
            <div className="messageBody">{detail.message.body || "No message body available."}</div>
          </div>
        </div>
      </section>

      {/* ── Detection analysis ── */}
      <section className="grid detailSplit fadeIn delay2">

        {/* AI detection summary */}
        <div className="card">
          <h3 style={{ marginBottom: 4 }}>Why this was flagged</h3>
          <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 18 }}>
            How confident the AI is and which features in the message contributed to this detection.
          </p>

          {/* Confidence */}
          <div className="confidenceSummary">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span className="statLabel">AI detection confidence</span>
              <span style={{
                fontWeight: 700,
                fontFamily: "var(--font-serif)",
                color: confidence >= 0.85 ? "var(--danger)" : confidence >= 0.65 ? "var(--warning)" : "var(--success)"
              }}>
                {Math.round(confidence * 100)}%
              </span>
            </div>
            <div className="featureTrack">
              <div className={`featureFill ${featureLevel(confidence)}`} style={{ width: `${confidence * 100}%` }} />
            </div>
            <div className="muted" style={{ fontSize: "0.8rem", marginTop: 6 }}>
              {confidenceLabel(confidence)}
            </div>
          </div>

          <div className="infoRow" style={{ marginTop: 14 }}>
            <span className="muted">Detection model</span>
            <strong>{detail.detection.model_used}</strong>
          </div>

          {/* SHAP feature bars */}
          {detail.detection.features.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div className="statLabel" style={{ marginBottom: 10 }}>What triggered this alert</div>
              <div style={{ display: "grid", gap: 12 }}>
                {detail.detection.features.map((f) => (
                  <div key={f.feature_name} className="featureBar">
                    <div className="featureLabel">
                      <span className="featureName">{formatFeatureName(f.feature_name)}</span>
                      <span className="featureValue">{Math.round(f.feature_value * 100)}%</span>
                    </div>
                    <div className="featureTrack">
                      <div
                        className={`featureFill ${featureLevel(f.feature_value)}`}
                        style={{ width: `${Math.min(f.feature_value * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Manipulation tactics */}
        <div className="card">
          <h3 style={{ marginBottom: 4 }}>Manipulation tactics detected</h3>
          <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 18 }}>
            Social engineering attacks exploit psychological triggers. Higher bars mean this
            message used that tactic more heavily.
          </p>

          {psychoEntries.length === 0 ? (
            <p className="muted">No psychology data available.</p>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {psychoEntries.map(([name, rawValue]) => {
                const value = rawValue as number;
                const pct   = Math.round(value * 100);
                return (
                  <div key={name} className="featureBar">
                    <div className="featureLabel">
                      <span className="featureName">{formatPsychologyLabel(name)}</span>
                      <span className="featureValue" style={{
                        color: value >= 0.7 ? "var(--danger)" : value >= 0.5 ? "var(--warning)" : "var(--muted)"
                      }}>
                        {pct >= 70 ? "Strong" : pct >= 40 ? "Moderate" : "Weak"} · {pct}%
                      </span>
                    </div>
                    <div className="featureTrack">
                      <div className={`featureFill ${featureLevel(value)}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Next step */}
          <div className="nextStepPanel" style={{ marginTop: 20 }}>
            <div className="statLabel" style={{ marginBottom: 10 }}>Analyst next step</div>
            <div className="infoRow">
              <span className="muted">Linked employee</span>
              <Link className="tableLink" href={`/users/${detail.alert.user_id}`}>
                Open risk profile →
              </Link>
            </div>
            <div className="infoRow">
              <span className="muted">Alert created</span>
              <span>{new Date(detail.alert.created_at).toLocaleString("en-IN")}</span>
            </div>
            <div className="infoRow">
              <span className="muted">Alert ID</span>
              <code style={{ fontSize: "0.76rem", color: "var(--muted)" }}>
                {detail.alert.id.slice(0, 16)}…
              </code>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
