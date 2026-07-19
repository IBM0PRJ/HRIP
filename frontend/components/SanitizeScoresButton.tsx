"use client";

import { useState } from "react";

export function SanitizeScoresButton() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState<{ fixed: number; message: string } | null>(null);

  const handleSanitize = async () => {
    if (!confirm("This will clamp all employee risk scores back to 0–100. Continue?")) return;
    setStatus("running");
    try {
      const res = await fetch("/api/analyst/sanitize-scores", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult({ fixed: data.fixed, message: data.message });
        setStatus("done");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "done" && result?.fixed === 0) return null; // No corrupted scores, hide button

  return (
    <div style={{
      padding: "14px 20px",
      background: status === "done" ? "rgba(141,208,194,0.08)" : "rgba(255,133,120,0.07)",
      border: `1px solid ${status === "done" ? "rgba(141,208,194,0.25)" : "rgba(255,133,120,0.2)"}`,
      borderRadius: 14,
      display: "flex",
      alignItems: "center",
      gap: 14,
      flexWrap: "wrap" as const
    }}>
      <div style={{ flex: 1 }}>
        {status === "done" ? (
          <>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--success)" }}>
              ✓ Scores sanitized
            </div>
            <div className="muted" style={{ fontSize: "0.8rem", marginTop: 2 }}>
              {result?.message}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--danger)" }}>
              ⚠ Corrupted risk scores detected
            </div>
            <div className="muted" style={{ fontSize: "0.8rem", marginTop: 2 }}>
              A bug caused employee scores to exceed 100. Click to clamp all scores back to 0–100.
            </div>
          </>
        )}
      </div>
      {status !== "done" && (
        <button
          onClick={handleSanitize}
          disabled={status === "running"}
          style={{
            padding: "8px 18px",
            background: "rgba(255,133,120,0.15)",
            border: "1px solid rgba(255,133,120,0.3)",
            color: "var(--danger)",
            borderRadius: 10,
            cursor: status === "running" ? "not-allowed" : "pointer",
            fontWeight: 700,
            fontSize: "0.85rem",
            opacity: status === "running" ? 0.6 : 1,
            whiteSpace: "nowrap" as const
          }}
        >
          {status === "running" ? "Fixing…" : "Fix Scores Now"}
        </button>
      )}
    </div>
  );
}
