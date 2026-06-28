"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Breadcrumb } from "./Breadcrumb";

type PageMeta = { title: string; subtitle: string };

function usePageMeta(): PageMeta {
  const pathname = usePathname();
  if (pathname === "/")       return { title: "HRIP Operations Console",  subtitle: "Live detection, triage, and employee exposure tracking" };
  if (pathname === "/alerts") return { title: "Threat Monitor",           subtitle: "Review, filter, and triage all active security alerts" };
  if (pathname === "/users")  return { title: "Employee Risk",            subtitle: "Ranked exposure levels and targeted training plans" };
  if (pathname.startsWith("/alerts/")) return { title: "Alert Investigation", subtitle: "Evidence, detection analysis, and analyst response" };
  if (pathname.startsWith("/users/"))  return { title: "Employee Profile",    subtitle: "Risk history, linked alerts, and training recommendations" };
  return { title: "HRIP", subtitle: "Human Risk Intelligence Platform" };
}

export function AppHeader() {
  const [time, setTime] = useState<string>("");
  const meta = usePageMeta();

  useEffect(() => {
    function tick() {
      setTime(
        new Intl.DateTimeFormat("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date())
      );
    }
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="appHeaderWrap fadeIn delay0">
      <Breadcrumb />
      <header className="appHeader">
        <div className="headerLead">
          <p className="eyebrow" style={{ marginBottom: 6 }}>Analyst Session</p>
          <h2 className="headerTitle">{meta.title}</h2>
          <p className="headerCopy">{meta.subtitle}</p>
        </div>

        <div className="headerActions">
          <div className="headerMetaCard">
            <span className="muted" style={{ fontSize: "0.74rem" }}>Last updated</span>
            <span className="headerClock">{time}</span>
            <div className="headerMetaAccent">
              <span className="statusDot" />
              Security operations ready
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
