import Link from "next/link";
import prisma from "../../../lib/db";
import AlertsFilterClient from "./AlertsFilterClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Threat Monitor — HRIP",
  description: "Alert queue and triage",
};

export default async function AlertsPage() {
  let alerts;
  try {
    alerts = await prisma.employeeAlert.findMany({
      orderBy: { createdAt: "desc" },
      include: { employee: true },
    });
  } catch {
    return (
      <div className="grid" style={{ gap: 20 }}>
        <section className="card pageIntro">
          <p className="eyebrow">Threat Monitor</p>
          <h2>Alert Queue</h2>
          <p className="muted" style={{ marginTop: 8 }}>
            Unable to load alerts — make sure the database is running.{" "}
            <Link className="tableLink" href="/">← Back to dashboard</Link>
          </p>
        </section>
      </div>
    );
  }

  // Serialize for client component
  const serializedAlerts = alerts.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description || "",
    severity: a.severity,
    type: a.type,
    isRead: a.isRead,
    resolvedAt: a.resolvedAt ? a.resolvedAt.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
    employee: {
      id: a.employee.id,
      name: a.employee.name,
      email: a.employee.email,
      department: a.employee.department,
    },
  }));

  return (
    <div className="grid" style={{ gap: 20 }}>
      {/* ── Page intro ── */}
      <section className="card pageIntro fadeIn delay0">
        <p className="eyebrow">Threat Monitor</p>
        <h2>Alert Queue</h2>
        <p className="heroCopy" style={{ marginTop: 8 }}>
          Each alert here is a security event triggered by endpoint telemetry or employee activity.
          Filter by employee or severity to focus on specific individuals.
        </p>
      </section>

      {/* ── Filterable alerts ── */}
      <section className="card fadeIn delay1">
        <AlertsFilterClient alerts={serializedAlerts} />
      </section>
    </div>
  );
}

