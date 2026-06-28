"use client";

import { useState, useEffect } from "react";
import { formatRelativeTime } from "../../../lib/formatters";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [analystNote, setAnalystNote] = useState("");

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/analyst/incidents");
      const json = await res.json();
      setIncidents(json.incidents || []);
    } catch (e) {}
    setIsLoading(false);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/analyst/incidents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, analystNote: selectedIncident?.id === id ? analystNote : undefined })
      });
      fetchIncidents();
      setSelectedIncident(null);
    } catch (e) {}
  };

  if (isLoading) return <div style={{ padding: 40 }}><div className="spinner" /></div>;

  return (
    <div className="card">
      <h3 className="sectionHeader" style={{ padding: 24, paddingBottom: 0 }}>Employee Incident Reports</h3>
      
      <div style={{ padding: 24 }}>
        {incidents.length === 0 ? (
          <p className="muted">No incidents reported.</p>
        ) : (
          <table className="table" style={{ width: "100%", textAlign: "left" }}>
            <thead>
              <tr>
                <th className="muted">Reporter</th>
                <th className="muted">Date</th>
                <th className="muted">Subject</th>
                <th className="muted">Status</th>
                <th className="muted">Action</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc: any) => (
                <tr key={inc.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "16px 0" }}>
                    <div style={{ fontWeight: 600 }}>{inc.employee.name}</div>
                    <div className="muted" style={{ fontSize: "0.8rem" }}>{inc.employee.department}</div>
                  </td>
                  <td>{formatRelativeTime(inc.createdAt)}</td>
                  <td>{inc.subject}</td>
                  <td><span className="statusTag">{inc.status.replace("_", " ")}</span></td>
                  <td>
                    <button className="buttonSecondary" onClick={() => { setSelectedIncident(inc); setAnalystNote(inc.analystNote || ""); }} style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedIncident && (
        <div className="lockoutOverlay" style={{ zIndex: 100 }}>
          <div className="lockoutModal card" style={{ maxWidth: 600, width: "100%" }}>
            <h3 style={{ marginBottom: 16 }}>Review Incident</h3>
            
            <div style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 8, marginBottom: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 8, marginBottom: 16 }}>
                <div className="muted">Reporter</div>
                <div>{selectedIncident.employee.name} ({selectedIncident.employee.email})</div>
                
                <div className="muted">Date</div>
                <div>{new Date(selectedIncident.createdAt).toLocaleString()}</div>
                
                <div className="muted">Sender</div>
                <div>{selectedIncident.senderEmail}</div>
                
                <div className="muted">Subject</div>
                <div>{selectedIncident.subject}</div>
              </div>
              
              <div className="muted" style={{ marginBottom: 8 }}>Description:</div>
              <div style={{ whiteSpace: "pre-wrap", background: "rgba(0,0,0,0.2)", padding: 12, borderRadius: 4 }}>
                {selectedIncident.description}
              </div>
            </div>

            <div className="inputGroup">
              <label>Analyst Notes</label>
              <textarea 
                value={analystNote} 
                onChange={e => setAnalystNote(e.target.value)} 
                placeholder="Add notes for this incident..." 
                style={{ minHeight: 80 }} 
              />
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button className="buttonSecondary" onClick={() => setSelectedIncident(null)} style={{ flex: 1 }}>Close</button>
              
              {selectedIncident.status !== "investigating" && (
                <button className="buttonSecondary" onClick={() => handleUpdateStatus(selectedIncident.id, "investigating")} style={{ flex: 1 }}>Mark Investigating</button>
              )}
              
              {selectedIncident.status !== "resolved" && (
                <button className="buttonPrimary" onClick={() => handleUpdateStatus(selectedIncident.id, "resolved")} style={{ flex: 1 }}>Mark Resolved</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
