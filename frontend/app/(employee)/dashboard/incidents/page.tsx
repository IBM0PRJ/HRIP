"use client";

import { useState, useEffect, useRef } from "react";

const PRIORITIES = ["low", "medium", "high", "critical"] as const;
const THREAT_TYPES = ["Email Phishing", "SMS Scam / Smishing", "Phone Call Scam / Vishing", "Suspicious Link", "Malware / Suspicious File", "Other"] as const;

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form state
  const [threatType, setThreatType] = useState<string>("Email Phishing");
  const [sender, setSender] = useState("");
  const [subject, setSubject] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState<string>("medium");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchIncidents(); }, []);

  const fetchIncidents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/employee/incidents");
      const data = await res.json();
      setIncidents(data.incidents || []);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { alert("Please upload an image file."); return; }
    const reader = new FileReader();
    reader.onload = e => setScreenshot(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith("image/"));
    if (item) { const file = item.getAsFile(); if (file) handleFile(file); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch("/api/employee/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderEmail: sender,
          subject: `[${threatType}] ${subject}`,
          description: `Priority: ${priority.toUpperCase()}\nThreat Type: ${threatType}\n\n${desc}`,
        })
      });
      setSubmitSuccess(true);
      setSender(""); setSubject(""); setDesc(""); setScreenshot(null); setPriority("medium"); setThreatType("Email Phishing");
      fetchIncidents();
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (e) { console.error(e); }
    setIsSubmitting(false);
  };

  const statusColor = (s: string) => {
    if (!s) return "var(--muted)";
    const sl = s.toLowerCase();
    if (sl.includes("resolv")) return "var(--success)";
    if (sl.includes("invest")) return "var(--warning)";
    return "var(--accent)";
  };

  const priorityColor = (p: string) => ({
    critical: "var(--danger)", high: "var(--warning)", medium: "var(--accent)", low: "var(--success)"
  }[p?.toLowerCase()] || "var(--muted)");

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .report-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); border-radius: 18px; padding: 28px; }
        .drop-zone { border: 2px dashed rgba(255,255,255,0.12); border-radius: 14px; padding: 28px; text-align: center; cursor: pointer; transition: all 0.2s; }
        .drop-zone.over { border-color: var(--accent); background: rgba(212,180,113,0.05); }
        .drop-zone:hover { border-color: rgba(255,255,255,0.25); }
        .priority-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .priority-btn { padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: var(--muted); font-size: 0.82rem; cursor: pointer; transition: all 0.15s; font-weight: 600; }
        .priority-btn.active-critical { background: rgba(255,133,120,0.15); border-color: rgba(255,133,120,0.3); color: var(--danger); }
        .priority-btn.active-high { background: rgba(231,179,107,0.15); border-color: rgba(231,179,107,0.3); color: var(--warning); }
        .priority-btn.active-medium { background: rgba(212,180,113,0.15); border-color: rgba(212,180,113,0.3); color: var(--accent); }
        .priority-btn.active-low { background: rgba(141,208,194,0.15); border-color: rgba(141,208,194,0.3); color: var(--success); }
        .timeline-track { position: relative; padding-left: 28px; }
        .timeline-track::before { content: ""; position: absolute; left: 7px; top: 12px; bottom: 0; width: 2px; background: rgba(255,255,255,0.08); }
        .timeline-node { position: relative; margin-bottom: 24px; }
        .timeline-node::before { content: ""; position: absolute; left: -24px; top: 8px; width: 12px; height: 12px; border-radius: 50%; background: var(--accent-2); border: 2px solid var(--accent); }
        .timeline-node.resolved::before { background: var(--success); border-color: var(--success); }
        .timeline-node.investigating::before { background: var(--warning); border-color: var(--warning); }
        .success-banner { background: rgba(141,208,194,0.1); border: 1px solid rgba(141,208,194,0.25); border-radius: 14px; padding: 16px 20px; display: flex; align-items: center; gap: 12px; animation: slideDown 0.3s ease; }
        @keyframes slideDown { from { opacity:0; transform: translateY(-8px); } to { opacity:1; transform: translateY(0); } }
      `}} />

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent)", marginBottom: 6 }}>Report Center</div>
        <h2 style={{ fontSize: "1.8rem", marginBottom: 4 }}>Report a Threat</h2>
        <p className="muted" style={{ fontSize: "0.88rem" }}>Spotted something suspicious? Submit it and our security team will investigate.</p>
      </div>

      {submitSuccess && (
        <div className="success-banner" style={{ marginBottom: 20 }}>
          <span style={{ fontSize: "1.4rem" }}>✅</span>
          <div>
            <div style={{ fontWeight: 700 }}>Report submitted successfully!</div>
            <div className="muted" style={{ fontSize: "0.82rem" }}>Our security team has been notified and will investigate.</div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20, alignItems: "start" }}>

        {/* Report Form */}
        <div className="report-card">
          <div style={{ fontWeight: 600, fontSize: "1rem", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            🚨 New Incident Report
          </div>

          <form onSubmit={handleSubmit} onPaste={handlePaste} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Threat Type */}
            <div className="inputGroup">
              <label>Threat Type</label>
              <select value={threatType} onChange={e => setThreatType(e.target.value)}
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "12px 16px", color: "var(--text)", fontSize: "0.9rem", width: "100%" }}>
                {THREAT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Priority */}
            <div className="inputGroup">
              <label>Priority Level</label>
              <div className="priority-row">
                {PRIORITIES.map(p => (
                  <button type="button" key={p} onClick={() => setPriority(p)}
                    className={`priority-btn ${priority === p ? `active-${p}` : ""}`}
                    style={{ textTransform: "capitalize" }}>
                    {p === "critical" ? "🔴" : p === "high" ? "🟠" : p === "medium" ? "🟡" : "🟢"} {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Sender */}
            <div className="inputGroup">
              <label>{threatType.includes("Phone") || threatType.includes("SMS") ? "Phone Number / Caller ID" : "Sender Email"}</label>
              <input
                type={threatType.includes("Phone") || threatType.includes("SMS") ? "text" : "text"}
                value={sender}
                onChange={e => setSender(e.target.value)}
                placeholder={threatType.includes("Phone") || threatType.includes("SMS") ? "+1-555-0123" : "phisher@suspicious.com"}
                required
              />
            </div>

            {/* Subject */}
            <div className="inputGroup">
              <label>Subject / Title</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Urgent Invoice — Click to View" required />
            </div>

            {/* Description */}
            <div className="inputGroup">
              <label>Description</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)}
                placeholder="Describe what made this suspicious — links included, pressure tactics, unexpected requests, etc."
                style={{ minHeight: 120, resize: "vertical" }} required />
            </div>

            {/* Screenshot drag-drop */}
            <div className="inputGroup">
              <label>Screenshot (optional)</label>
              <div
                className={`drop-zone ${isDragOver ? "over" : ""}`}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {screenshot ? (
                  <div>
                    <img src={screenshot} alt="screenshot" style={{ maxWidth: "100%", maxHeight: 160, borderRadius: 8, marginBottom: 10 }} />
                    <div><button type="button" className="textButton" onClick={e => { e.stopPropagation(); setScreenshot(null); }}>Remove</button></div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: "2rem", marginBottom: 8 }}>📎</div>
                    <div style={{ fontSize: "0.88rem", color: "var(--muted)" }}>Drag & drop, paste (Ctrl+V), or click to upload</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 4 }}>PNG, JPG, GIF supported</div>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>

            <button type="submit" className="buttonPrimary" style={{ width: "100%", justifyContent: "center" }} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "🚨 Submit Threat Report"}
            </button>
          </form>
        </div>

        {/* My Reports Timeline */}
        <div className="report-card">
          <div style={{ fontWeight: 600, fontSize: "1rem", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            📋 My Reports
            <span style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--muted)", fontWeight: 400 }}>{incidents.length} total</span>
          </div>

          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div className="spinner" /></div>
          ) : incidents.length === 0 ? (
            <div className="emptyState" style={{ padding: 30 }}>
              <div className="emptyStateIcon">📋</div>
              <p className="muted" style={{ fontSize: "0.85rem" }}>No incidents reported yet.</p>
            </div>
          ) : (
            <div className="timeline-track">
              {incidents.map((inc: any) => {
                const sl = (inc.status || "open").toLowerCase();
                const isResolved = sl.includes("resolv");
                const isInvestigating = sl.includes("invest");
                return (
                  <div key={inc.id} className={`timeline-node ${isResolved ? "resolved" : isInvestigating ? "investigating" : ""}`}>
                    <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginBottom: 4 }}>
                      {new Date(inc.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 4 }}>{inc.subject}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: 8 }}>{inc.senderEmail}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", background: `${statusColor(inc.status)}18`, color: statusColor(inc.status), border: `1px solid ${statusColor(inc.status)}30` }}>
                        {isResolved ? "✓ Resolved" : isInvestigating ? "⚙ Investigating" : "● Open"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
