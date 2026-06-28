"use client";

import { useState } from "react";

export function AuditRequestPanel({ email }: { email: string }) {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    if (!startTime || !endTime) {
      alert("Please select both a start and end time.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/log-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, startTime, endTime }),
      });
      const data = await response.json();
      
      if (data.success) {
        alert("Forensic audit request sent to the employee for approval.");
        setStartTime("");
        setEndTime("");
      } else {
        alert("Failed to send request.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card fadeIn delay3" style={{ marginTop: 24, borderColor: "rgba(141,208,194,0.2)" }}>
      <div className="sectionHeader" style={{ marginBottom: 16 }}>
        <div>
          <p className="statLabel" style={{ marginBottom: 6, color: "var(--success)" }}>Consent-Driven Forensics</p>
          <h3>Request Time-Bound Audit</h3>
        </div>
      </div>

      <p className="muted" style={{ fontSize: "0.88rem", marginBottom: 20 }}>
        Request explicit authorization from the employee to extract device telemetry for a specific timeframe.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: "0.8rem", color: "var(--muted)", marginBottom: 4 }}>Start Time</label>
          <input 
            type="datetime-local" 
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            style={{ 
              width: "100%", 
              padding: "8px 12px", 
              background: "rgba(255,255,255,0.05)", 
              border: "1px solid var(--border)", 
              color: "#fff", 
              borderRadius: 6 
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.8rem", color: "var(--muted)", marginBottom: 4 }}>End Time</label>
          <input 
            type="datetime-local" 
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            style={{ 
              width: "100%", 
              padding: "8px 12px", 
              background: "rgba(255,255,255,0.05)", 
              border: "1px solid var(--border)", 
              color: "#fff", 
              borderRadius: 6 
            }}
          />
        </div>
      </div>

      <button 
        className="buttonPrimary" 
        onClick={handleRequest}
        disabled={loading}
        style={{ width: "100%", background: "rgba(141,208,194,0.15)", border: "1px solid var(--success)", color: "#8dd0c2" }}
      >
        {loading ? "Sending Request..." : "📨 Send Authorization Request to Employee"}
      </button>
    </section>
  );
}
