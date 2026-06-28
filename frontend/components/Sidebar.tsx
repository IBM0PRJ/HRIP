"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  {
    href:  "/",
    icon:  "⬡",
    label: "Dashboard",
    note:  "Overview & live activity",
  },
  {
    href:  "/alerts",
    icon:  "◈",
    label: "Threat Monitor",
    note:  "Alert queue & triage",
  },
  {
    href:  "/incidents",
    icon:  "⚠️",
    label: "Employee Reports",
    note:  "Suspicious emails reported",
  },
  {
    href:  "/users",
    icon:  "◉",
    label: "Employee Risk",
    note:  "Exposure rankings & training",
  },
  {
    href:  "/pending-signups",
    icon:  "👤",
    label: "Pending Signups",
    note:  "Approve new accounts",
  },
  {
    href:  "/access-requests",
    icon:  "🛡️",
    label: "Live Verifications",
    note:  "Zero-Trust onboarding queue",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside className="sidebar">
      {/* ── Brand ── */}
      <div className="sidebarBrand">
        <div className="brandMark">
          <span>HRIP</span>
        </div>
        <div className="brandBlock">
          <div className="eyebrow">Human Risk Platform</div>
          <h1 className="sidebarTitle">Human Risk Intelligence</h1>
          <p className="sidebarCopy">
            Detection, triage, and employee risk visibility for social engineering incidents.
          </p>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav>
        {links.map((link) => (
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

      {/* ── How it works hint ── */}
      <div className="sidebarHint">
        <div className="muted" style={{ fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
          How it works
        </div>
        <div className="sidebarHintStep">
          <span className="sidebarHintNum">1</span>
          <span>AI detects threats in email, SMS, and voice</span>
        </div>
        <div className="sidebarHintStep">
          <span className="sidebarHintNum">2</span>
          <span>You triage each alert in the queue</span>
        </div>
        <div className="sidebarHintStep">
          <span className="sidebarHintNum">3</span>
          <span>High-risk employees get a training plan</span>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="sidebarFooter">
        <div className="sessionRow">
          <span className="statusDot" />
          <span className="systemStatus">System online</span>
        </div>
        <div className="sessionRow" style={{ marginTop: 4 }}>
          <span className="sessionLabel">Logged in as</span>
          <span className="sessionRole">Analyst</span>
        </div>
      </div>
    </aside>
  );
}
