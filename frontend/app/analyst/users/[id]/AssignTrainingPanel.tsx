"use client";

import { useState, useEffect } from "react";

export function AssignTrainingPanel({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");

  useEffect(() => {
    fetch("/api/training/modules")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setModules(data);
      })
      .catch(console.error);
  }, []);

  const handleAssign = async () => {
    if (!selectedModuleId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/training/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, module_id: selectedModuleId }),
      });
      if (res.ok) {
        alert("Training assigned successfully.");
        setSelectedModuleId("");
      } else {
        const error = await res.json();
        alert(`Failed to assign training: ${error.detail || "Unknown error"}`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to assign training.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card fadeIn delay2" style={{ borderColor: "rgba(141,208,194,0.2)" }}>
      <div className="sectionHeader" style={{ marginBottom: 16 }}>
        <div>
          <p className="statLabel" style={{ marginBottom: 6, color: "var(--accent-2)" }}>Employee Education</p>
          <h3>Assign Training Module</h3>
        </div>
      </div>

      <p className="muted" style={{ fontSize: "0.88rem", marginBottom: 20 }}>
        Assign a targeted training module based on the employee's threat exposure.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", marginBottom: 6, fontWeight: 600 }}>Select Module</label>
          <select 
            value={selectedModuleId}
            onChange={(e) => setSelectedModuleId(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "white" }}
          >
            <option value="">-- Choose a Training Module --</option>
            {modules.map(mod => (
              <option key={mod.id} value={mod.id}>{mod.title} ({mod.threat_type})</option>
            ))}
          </select>
        </div>
        <button 
          className="buttonPrimary" 
          onClick={handleAssign}
          disabled={loading || !selectedModuleId}
          style={{ alignSelf: "flex-start", background: "var(--accent-2)", color: "#000" }}
        >
          {loading ? "Assigning..." : "Assign Module"}
        </button>
      </div>
    </section>
  );
}
