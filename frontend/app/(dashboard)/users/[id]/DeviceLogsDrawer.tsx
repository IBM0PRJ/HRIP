"use client";

import { useState, useEffect } from "react";
import "./drawer.css";

interface TelemetryLog {
  id: string;
  message: string;
  createdAt: string;
}

export function DeviceLogsDrawer({ email }: { email: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch(`/api/telemetry?email=${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.logs) {
            // Logs come sorted desc by default, keep them desc for a top-down historical timeline
            setLogs(data.logs);
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, email]);

  return (
    <>
      <button 
        className="buttonSecondary" 
        onClick={() => setIsOpen(true)}
        style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 8 }}
      >
        <span style={{ fontSize: "1.1rem" }}>🔍</span> Check Employee Device Logs
      </button>

      {isOpen && (
        <div className="drawerOverlay" onClick={() => setIsOpen(false)}>
          <div className="drawerPanel" onClick={e => e.stopPropagation()}>
            <div className="drawerHeader">
              <h2>Historical Device Logs</h2>
              <button className="closeButton" onClick={() => setIsOpen(false)}>✕</button>
            </div>
            
            <div className="drawerContent">
              <p className="muted" style={{ marginBottom: 24 }}>
                Forensic timeline of recent logon sessions and subsequent high-risk application activities. Noise filtered.
              </p>

              {isLoading ? (
                <div className="spinner" style={{ margin: "40px auto" }} />
              ) : logs.length === 0 ? (
                <p className="muted" style={{ fontStyle: "italic" }}>No historical data found for this employee.</p>
              ) : (
                <div className="timeline">
                  {logs.map((log, i) => {
                    const isLogon = log.message.includes("[HIST] After-hours Logon") || log.message.includes("Logon detected");
                    return (
                      <div key={log.id} className={`timelineItem ${isLogon ? "logonEvent" : "activityEvent"}`}>
                        <div className="timelineDot" />
                        <div className="timelineContent">
                          <div className="timelineTime">
                            {new Date(log.createdAt).toLocaleString("en-IN")}
                          </div>
                          <div className="timelineMessage">{log.message}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
