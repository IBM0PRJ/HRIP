"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const employeeLinks = [
  { href: "/dashboard", icon: "⬡", label: "Overview", note: "Security status & risk score" },
  { href: "/dashboard/alerts", icon: "◈", label: "My Alerts", note: "Threats targeting you" },
  { href: "/dashboard/training", icon: "◎", label: "Training", note: "Security modules & quizzes" },
  { href: "/dashboard/incidents", icon: "⚠️", label: "Report Threat", note: "Submit suspicious emails" },
  { href: "/dashboard/activity", icon: "◉", label: "Activity Log", note: "Telemetry & integrations" },
];

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [employee, setEmployee] = useState<{ name: string; email: string; department: string } | null>(null);

  useEffect(() => {
    fetch("/api/employee/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.employee) setEmployee(d.employee);
        else router.push("/login");
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <div className="layout">
      {/* ── Employee Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebarBrand">
          <div className="brandMark"><span>HRIP</span></div>
          <div className="brandBlock">
            <div className="eyebrow">Employee Portal</div>
            <h1 className="sidebarTitle">Security<br />Dashboard</h1>
            <p className="sidebarCopy">
              Your personal security hub — manage threats, training, and access.
            </p>
          </div>
        </div>

        <nav>
          {employeeLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`navLink${isActive(link.href) ? " active" : ""}`}
            >
              <span className="navIcon">{link.icon}</span>
              <span className="navText">
                <span className="navLabel">{link.label}</span>
                <span className="navNote">{link.note}</span>
              </span>
            </Link>
          ))}
        </nav>

        {/* ── Employee Identity Block ── */}
        {employee && (
          <div style={{
            borderTop: "1px solid var(--line)",
            paddingTop: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                display: "grid", placeItems: "center",
                fontSize: "0.85rem", fontWeight: 700, color: "#081019"
              }}>
                {employee.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text)" }}>{employee.name}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{employee.department}</div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              style={{
                background: "rgba(255,133,120,0.08)",
                border: "1px solid rgba(255,133,120,0.18)",
                color: "var(--danger)",
                borderRadius: 10,
                padding: "8px 14px",
                cursor: "pointer",
                fontSize: "0.82rem",
                fontWeight: 600,
                letterSpacing: "0.02em",
                width: "100%",
                transition: "background 0.2s",
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </aside>

      <main className="content">
        {children}
      </main>
    </div>
  );
}
