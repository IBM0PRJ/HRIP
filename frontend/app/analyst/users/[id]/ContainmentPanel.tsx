"use client";

import { useState } from "react";
import { SessionState } from "../../../../lib/store";

export function ContainmentPanel({ userId, email }: { userId: string; email: string }) {
  const [loading, setLoading] = useState<SessionState | null>(null);

  const handleAction = async (state: SessionState) => {
    setLoading(state);
    try {
      await fetch(`/api/auth/session/${encodeURIComponent(email)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });
      alert(`Session state for ${email} changed to: ${state}`);
    } catch (e) {
      console.error(e);
      alert("Failed to update session state");
    } finally {
      setLoading(null);
    }
  };

  return (
    <section className="card fadeIn delay2" style={{ borderColor: "rgba(255,133,120,0.2)" }}>
      <div className="sectionHeader" style={{ marginBottom: 16 }}>
        <div>
          <p className="statLabel" style={{ marginBottom: 6, color: "var(--danger)" }}>Zero-Trust Containment</p>
          <h3>Active Response Actions</h3>
        </div>
        <span className="liveBadge" style={{ background: "rgba(255,133,120,0.1)", color: "var(--danger)" }}>
          Live Connection
        </span>
      </div>

      <p className="muted" style={{ fontSize: "0.88rem", marginBottom: 20 }}>
        These actions take immediate effect on the employee's active portal session.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <button 
          className="buttonSecondary" 
          onClick={() => handleAction("reauth_required")}
          disabled={loading !== null}
        >
          📷 Force Re-Authentication
        </button>
        <button 
          className="buttonSecondary"
          onClick={() => alert("Simulated: Access to Financial systems revoked.")}
        >
          🔒 Restrict SSO Apps
        </button>
        <button 
          className="buttonSecondary"
          onClick={() => handleAction("active")}
          disabled={loading !== null}
        >
          ✅ Restore Normal Access
        </button>
        <button 
          className="buttonPrimary" 
          style={{ background: "rgba(255,50,50,0.15)", border: "1px solid var(--danger)", color: "#ffb4ac" }}
          onClick={() => {
            if (confirm("Are you sure you want to isolate this device? The user will be locked out immediately.")) {
              handleAction("isolated");
            }
          }}
          disabled={loading !== null}
        >
          ⚠️ Isolate Device
        </button>
      </div>
    </section>
  );
}
