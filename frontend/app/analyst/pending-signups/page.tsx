"use client";

import { useState, useEffect } from "react";
import { formatRelativeTime } from "../../../lib/formatters";

export default function PendingSignupsPage() {
  const [data, setData] = useState<any>({ employees: [], analysts: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSignups();
  }, []);

  const fetchSignups = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/analyst/pending-signups");
      const json = await res.json();
      setData(json);
    } catch (e) {}
    setIsLoading(false);
  };

  const handleApprove = async (type: string, id: string, action: string) => {
    try {
      await fetch("/api/analyst/approve-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, action })
      });
      fetchSignups();
    } catch (e) {}
  };

  if (isLoading) return <div style={{ padding: 40 }}><div className="spinner" /></div>;

  return (
    <div className="card">
      <h3 className="sectionHeader" style={{ padding: 24, paddingBottom: 0 }}>Pending Signups</h3>
      
      <div style={{ padding: 24 }}>
        <h4 style={{ marginBottom: 16 }}>Employees Pending Approval</h4>
        {data.employees.length === 0 ? (
          <p className="muted">No pending employee signups.</p>
        ) : (
          <table className="table" style={{ width: "100%", textAlign: "left", marginBottom: 32 }}>
            <thead>
              <tr>
                <th className="muted">Name</th>
                <th className="muted">Email</th>
                <th className="muted">Department</th>
                <th className="muted">Requested</th>
                <th className="muted">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.employees.map((emp: any) => (
                <tr key={emp.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "16px 0" }}>{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>{emp.department}</td>
                  <td>{formatRelativeTime(emp.createdAt)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="buttonPrimary" onClick={() => handleApprove("employee", emp.id, "approve")} style={{ padding: "6px 12px", fontSize: "0.8rem" }}>Approve</button>
                      <button className="buttonSecondary" onClick={() => handleApprove("employee", emp.id, "deny")} style={{ padding: "6px 12px", fontSize: "0.8rem" }}>Deny</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h4 style={{ marginBottom: 16 }}>Analysts Pending Approval</h4>
        {data.analysts.length === 0 ? (
          <p className="muted">No pending analyst signups.</p>
        ) : (
          <table className="table" style={{ width: "100%", textAlign: "left" }}>
            <thead>
              <tr>
                <th className="muted">Name</th>
                <th className="muted">Email</th>
                <th className="muted">Requested</th>
                <th className="muted">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.analysts.map((ana: any) => (
                <tr key={ana.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "16px 0" }}>{ana.name}</td>
                  <td>{ana.email}</td>
                  <td>{formatRelativeTime(ana.createdAt)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="buttonPrimary" onClick={() => handleApprove("analyst", ana.id, "approve")} style={{ padding: "6px 12px", fontSize: "0.8rem" }}>Approve</button>
                      <button className="buttonSecondary" onClick={() => handleApprove("analyst", ana.id, "deny")} style={{ padding: "6px 12px", fontSize: "0.8rem" }}>Deny</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
