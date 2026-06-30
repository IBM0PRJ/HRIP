"use client";

import { useState, useEffect } from "react";

type TelemetryEvent = {
  id: string;
  employeeName: string;
  employeeEmail: string;
  category: string;
  data: any;
  flagged: boolean;
  riskLevel: string | null;
  createdAt: string;
};

export default function TelemetryStream() {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEmail, setFilterEmail] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 3000); // Fast polling for "live stream" feel
    return () => clearInterval(interval);
  }, [filterEmail, activeCategory]);

  const fetchEvents = async () => {
    try {
      const url = filterEmail ? `/api/analyst/telemetry-feed?email=${filterEmail}` : `/api/analyst/telemetry-feed`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.events) {
        if (activeCategory) {
          setEvents(data.events.filter((e: TelemetryEvent) => e.category === activeCategory));
        } else {
          setEvents(data.events);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatEventText = (e: TelemetryEvent) => {
    switch (e.category) {
      case "process":
        const procs = e.data.processes || [];
        const topNames = procs.slice(0, 3).map((p: any) => p.name.replace('.exe', '')).join(', ');
        const highestMem = procs[0];
        
        let msg = `Process Activity: Active apps detected (${topNames || 'None'}).`;
        
        if (e.data.activeWindow && e.data.activeWindow !== "Unknown") {
          msg = `👀 Screen Focus: "${e.data.activeWindow}" | ${msg}`;
        }
        
        if (highestMem) {
          msg += ` Highest memory usage: ${highestMem.name.replace('.exe', '')} (${Math.round(highestMem.memory)}MB).`;
        }
        if (e.data.isAfterHours) {
          msg = `⚠️ After-Hours Activity: ${msg}`;
        }
        return msg;
      case "usb":
        return `Hardware Alert: New USB Storage Device connected - ${e.data.device || 'Unknown'}.`;
      case "network":
        return `Network Connection: Active IP ${e.data.ip || 'Unknown'} (${e.data.connectionType || 'Standard'}). ${e.data.isVpnSuspected ? 'VPN Suspected.' : ''}`;
      case "files":
        return `Local Files: Scanned path. Found ${e.data.flaggedNames?.length || 0} files containing sensitive keywords.`;
      case "clipboard":
        if (e.data.patternMatched === "general") {
          return `Clipboard Monitor: General text copied. Preview: "${e.data.preview}"`;
        }
        return `⚠️ Clipboard Monitor: Sensitive data copied (Pattern matched: '${e.data.patternMatched}'). Preview: "${e.data.preview}"`;
      default:
        return "Unknown Event Logged.";
    }
  };

  const getEventIcon = (category: string) => {
    switch(category) {
      case "process": return "💻";
      case "usb": return "🔌";
      case "network": return "🌐";
      case "files": return "📁";
      case "clipboard": return "📋";
      default: return "◉";
    }
  };

  return (
    <div className="grid">
      <section className="card pageIntro fadeIn delay0" style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: "300px", height: "100%", background: "linear-gradient(90deg, transparent, rgba(141, 208, 194, 0.05))", pointerEvents: "none" }} />
        <p className="eyebrow">Real-Time Data</p>
        <h2>Live Telemetry Stream</h2>
        <p className="heroCopy" style={{ marginTop: 8 }}>
          Monitor raw OS-level events securely flowing from employee endpoints in real time.
        </p>

        <div style={{ marginTop: 24, display: "flex", gap: 16, alignItems: "center" }}>
          <input 
            type="text" 
            placeholder="Filter by employee email..." 
            value={filterEmail}
            onChange={(e) => setFilterEmail(e.target.value)}
            style={{ padding: "10px 16px", borderRadius: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", width: "100%", maxWidth: "300px" }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            {["All", "process", "usb", "network", "files", "clipboard"].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === "All" ? null : cat)}
                style={{
                  padding: "6px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600, textTransform: "capitalize",
                  background: activeCategory === cat || (cat === "All" && !activeCategory) ? "var(--accent)" : "rgba(255,255,255,0.05)",
                  color: activeCategory === cat || (cat === "All" && !activeCategory) ? "#000" : "var(--muted)",
                  border: "none", cursor: "pointer", transition: "all 0.2s"
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="fadeIn delay1" style={{ marginTop: 24, background: "#0a0a0c", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", padding: 24, minHeight: "60vh" }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 16 }}>
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "var(--success)", boxShadow: "0 0 10px var(--success)" }} />
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Live Connection Established</span>
        </div>

        {loading ? (
          <div style={{ color: "var(--muted)", textAlign: "center", padding: "40px" }}>Awaiting telemetry stream...</div>
        ) : events.length === 0 ? (
          <div style={{ color: "var(--muted)", textAlign: "center", padding: "40px" }}>No events found. Waiting for agent data...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {events.map(e => {
              const date = new Date(e.createdAt);
              const timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
              
              const isHighRisk = e.riskLevel === "high" || e.riskLevel === "critical";
              const isMediumRisk = e.riskLevel === "medium";
              
              let bgColor = "rgba(255,255,255,0.02)";
              let borderColor = "rgba(255,255,255,0.05)";
              let textColor = "#fff";
              
              if (isHighRisk) {
                bgColor = "rgba(255, 133, 120, 0.05)";
                borderColor = "rgba(255, 133, 120, 0.2)";
                textColor = "var(--danger)";
              } else if (isMediumRisk) {
                bgColor = "rgba(231, 179, 107, 0.05)";
                borderColor = "rgba(231, 179, 107, 0.2)";
                textColor = "var(--warning)";
              }

              return (
                <div key={e.id} style={{ 
                  display: "flex", alignItems: "flex-start", gap: 16, 
                  background: bgColor, border: `1px solid ${borderColor}`, 
                  borderRadius: 12, padding: "16px 20px",
                  transition: "all 0.2s ease"
                }}>
                  <div style={{ fontSize: "1.2rem", marginTop: 2 }}>
                    {getEventIcon(e.category)}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                        {e.employeeName} <span style={{ color: "var(--muted)", fontWeight: 400, marginLeft: 8 }}>{e.employeeEmail}</span>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--muted)", fontFamily: "monospace" }}>
                        {timeString}
                      </div>
                    </div>
                    
                    <div style={{ fontSize: "0.95rem", color: textColor, lineHeight: 1.5 }}>
                      {formatEventText(e)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
