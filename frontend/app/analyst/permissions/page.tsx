"use client";

import { useState, useEffect } from "react";

type Employee = {
  id: string;
  name: string;
  email: string;
  department: string;
  agentDeployed: boolean;
  integrations: {
    process: boolean;
    usb: boolean;
    network: boolean;
    files: boolean;
    clipboard: boolean;
  } | null;
};

export default function PermissionManager() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestModal, setRequestModal] = useState<{ email: string, key: string, label: string } | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mdmDeploying, setMdmDeploying] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
    const interval = setInterval(fetchEmployees, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/analyst/employees");
      const data = await res.json();
      if (data.employees) setEmployees(data.employees);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeployMDM = async (email: string) => {
    setMdmDeploying(email);
    try {
      // For demo purposes, we provision the token on the backend automatically
      await fetch("/api/agent/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      // Simulate MDM deployment delay
      setTimeout(() => {
        setMdmDeploying(null);
        fetchEmployees();
      }, 2000);
    } catch (e) {
      console.error(e);
      setMdmDeploying(null);
    }
  };

  const handleRevoke = async (email: string, integration: string) => {
    try {
      await fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, integration, status: false, revokedByAnalyst: true })
      });
      fetchEmployees();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequest = async () => {
    if (!requestModal || !reason) return;
    setSubmitting(true);
    try {
      await fetch("/api/permission-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeEmail: requestModal.email,
          permissionKey: requestModal.key,
          reason: reason
        })
      });
      setRequestModal(null);
      setReason("");
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const perms = [
    { key: "intProcess", label: "Process", apiKey: "process" },
    { key: "intUsb", label: "USB", apiKey: "usb" },
    { key: "intNetwork", label: "Network", apiKey: "network" },
    { key: "intFiles", label: "Files", apiKey: "files" },
    { key: "intClipboard", label: "Clipboard", apiKey: "clipboard" }
  ];

  return (
    <div className="grid">
      <section className="card pageIntro fadeIn delay0">
        <p className="eyebrow">Data Control</p>
        <h2>Permission Manager</h2>
        <p className="heroCopy" style={{ marginTop: 8 }}>
          Manage native OS telemetry permissions. Deploy agents via MDM, revoke access instantly, or request new permissions from employees.
        </p>
      </section>

      <div className="card fadeIn delay1" style={{ marginTop: 24, overflowX: "auto" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <th style={{ padding: "12px 16px" }}>Employee</th>
                <th style={{ padding: "12px 16px", minWidth: "160px" }}>MDM Status</th>
                {perms.map(p => (
                  <th key={p.key} style={{ padding: "12px 16px" }}>{p.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600 }}>{emp.name}</div>
                    <div className="muted" style={{ fontSize: "0.8rem" }}>{emp.email}</div>
                  </td>
                  
                  {/* MDM Deployment Status */}
                  <td style={{ padding: "12px 16px" }}>
                    {emp.agentDeployed ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "var(--success)", background: "rgba(141, 208, 194, 0.1)", padding: "4px 8px", borderRadius: 4 }}>
                        ✅ Deployed
                      </span>
                    ) : mdmDeploying === emp.email ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "var(--warning)" }}>
                        <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Deploying...
                      </span>
                    ) : (
                      <button onClick={() => handleDeployMDM(emp.email)} style={{ background: "var(--accent)", color: "#000", border: "none", padding: "6px 12px", borderRadius: 4, fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>
                        Deploy via MDM
                      </button>
                    )}
                  </td>

                  {/* Permissions Toggles */}
                  {perms.map(p => {
                    const isActive = emp.integrations ? (emp.integrations as any)[p.apiKey] : false;
                    return (
                      <td key={p.key} style={{ padding: "12px 16px" }}>
                        {isActive ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ color: "var(--success)" }}>✅</span>
                            <button onClick={() => handleRevoke(emp.email, p.apiKey)} style={{ background: "transparent", border: "none", color: "var(--error)", cursor: "pointer", fontSize: "0.75rem", textDecoration: "underline" }}>Revoke</button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ color: "var(--error)" }}>❌</span>
                            <button onClick={() => setRequestModal({ email: emp.email, key: p.key, label: p.label })} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4, color: "#fff", cursor: "pointer", fontSize: "0.75rem", padding: "4px 8px" }}>Request</button>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {requestModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div className="card" style={{ width: 400, padding: 24 }}>
            <h3>Request {requestModal.label} Permission</h3>
            <p className="muted" style={{ fontSize: "0.9rem", marginTop: 8, marginBottom: 16 }}>
              Requesting from {requestModal.email}. They will receive a notification on their dashboard.
            </p>
            <textarea 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for requesting this telemetry..."
              style={{ width: "100%", height: 80, padding: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", marginBottom: 16 }}
            />
            <div style={{ display: "flex", gap: 12 }}>
              <button className="buttonSecondary" style={{ flex: 1 }} onClick={() => setRequestModal(null)}>Cancel</button>
              <button className="buttonPrimary" style={{ flex: 1 }} onClick={handleRequest} disabled={!reason || submitting}>
                {submitting ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
