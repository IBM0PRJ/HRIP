"use client";

import { useState, useEffect, useRef } from "react";

interface TelemetryLog {
  id: string;
  message: string;
  createdAt: string;
}

export function LiveTelemetryTerminal({ email }: { email: string }) {
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/telemetry?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.logs) {
          // data.logs are returned ordered by createdAt desc. 
          // We reverse them so the newest is at the bottom.
          setLogs(data.logs.reverse());
        }
      } catch (e) {}
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [email]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <section className="card fadeIn delay3" style={{ background: "#0a0a0c", borderColor: "#1a1a24" }}>
      <div className="sectionHeader" style={{ marginBottom: 16 }}>
        <div>
          <p className="statLabel" style={{ marginBottom: 6, color: "var(--primary)" }}>Endpoint Telemetry</p>
          <h3>Live Activity Stream</h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="locPulse" style={{ width: 8, height: 8, background: "var(--primary)", boxShadow: "0 0 8px var(--primary)" }} />
          <span className="muted" style={{ fontSize: "0.8rem", color: "var(--primary)" }}>Active Session</span>
        </div>
      </div>

      <div 
        ref={scrollRef}
        style={{
          fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
          fontSize: "0.85rem",
          background: "#000",
          color: "#4ade80", // Hacker green
          padding: 16,
          borderRadius: 8,
          height: 250,
          overflowY: "auto",
          boxShadow: "inset 0 0 20px rgba(0,0,0,0.8)",
          lineHeight: 1.6
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: "#666", fontStyle: "italic" }}>
            Awaiting telemetry data from endpoint agent...
          </div>
        ) : (
          logs.map((log) => {
            const date = new Date(log.createdAt);
            const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`;
            return (
              <div key={log.id} style={{ marginBottom: 4, opacity: 0.9 }}>
                <span style={{ color: "#888", marginRight: 12 }}>[{time}]</span>
                {log.message}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
