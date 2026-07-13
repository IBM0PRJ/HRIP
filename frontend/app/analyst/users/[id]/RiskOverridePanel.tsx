"use client";

import { useState } from "react";

export function RiskOverridePanel({ userId, currentScore }: { userId: string; currentScore: number }) {
  const [loading, setLoading] = useState(false);
  const [newScore, setNewScore] = useState<number>(Math.round(currentScore));
  const [reason, setReason] = useState("");

  const handleOverride = async () => {
    if (!reason.trim()) {
      alert("Please provide a reason for the override.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/risk/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, new_score: newScore, reason }),
      });
      if (res.ok) {
        alert("Risk score successfully overridden. Please refresh the page to see changes.");
      } else {
        const error = await res.json();
        alert(`Failed to override risk score: ${error.detail || "Unknown error"}`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to override risk score.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card fadeIn delay2" style={{ borderColor: "rgba(212,180,113,0.2)" }}>
      <div className="sectionHeader" style={{ marginBottom: 16 }}>
        <div>
          <p className="statLabel" style={{ marginBottom: 6, color: "var(--accent)" }}>Manual Intervention</p>
          <h3>Override Risk Score</h3>
        </div>
      </div>

      <p className="muted" style={{ fontSize: "0.88rem", marginBottom: 20 }}>
        Analysts can manually override the employee's risk score. This will generate a manual Risk Event in the audit log.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", marginBottom: 6, fontWeight: 600 }}>New Score (0-100)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={newScore}
            onChange={(e) => setNewScore(parseInt(e.target.value) || 0)}
            style={{ width: "100%", padding: "10px 14px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "white" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", marginBottom: 6, fontWeight: 600 }}>Reason for Override</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., False positive investigation concluded. Employee verified safe."
            rows={3}
            style={{ width: "100%", padding: "10px 14px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "white", resize: "vertical" }}
          />
        </div>
        <button 
          className="buttonPrimary" 
          onClick={handleOverride}
          disabled={loading || !reason.trim()}
          style={{ alignSelf: "flex-start" }}
        >
          {loading ? "Applying..." : "Apply Override"}
        </button>
      </div>
    </section>
  );
}
