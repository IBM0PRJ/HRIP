"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const statuses = [
  { value: "open",           label: "Open"          },
  { value: "investigating",  label: "Investigating"  },
  { value: "resolved",       label: "Resolved"       },
  { value: "false_positive", label: "False Positive" },
];

export function AlertStatusForm({
  alertId,
  initialStatus,
}: {
  alertId: string;
  initialStatus: string;
}) {
  const router                   = useRouter();
  const [status, setStatus]      = useState(initialStatus);
  const [error, setError]        = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handlePillClick(newStatus: string) {
    if (newStatus === status || isPending) return;
    setStatus(newStatus);
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        setError("Status update failed — please try again.");
        setStatus(status); // revert
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <div className="statusPillGroup">
        {statuses.map((s) => (
          <button
            key={s.value}
            type="button"
            className={`statusPill${status === s.value ? " active" : ""}${isPending ? " saving" : ""}`}
            onClick={() => handlePillClick(s.value)}
            disabled={isPending}
          >
            {isPending && status === s.value ? "Saving…" : s.label}
          </button>
        ))}
      </div>
      {error && (
        <p className="errorText" style={{ marginTop: 10 }}>
          {error}
        </p>
      )}
    </div>
  );
}
