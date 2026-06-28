"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Crumb = { label: string; href?: string };

const routeMap: Record<string, Crumb[]> = {
  "/":       [{ label: "Dashboard" }],
  "/alerts": [{ label: "Dashboard", href: "/" }, { label: "Threat Monitor" }],
  "/users":  [{ label: "Dashboard", href: "/" }, { label: "Employee Risk" }],
};

function buildCrumbs(pathname: string): Crumb[] {
  // Exact match
  if (routeMap[pathname]) return routeMap[pathname];

  // Alert detail
  if (pathname.startsWith("/alerts/")) {
    return [
      { label: "Dashboard",      href: "/"       },
      { label: "Threat Monitor", href: "/alerts" },
      { label: "Alert Detail"                    },
    ];
  }

  // User profile
  if (pathname.startsWith("/users/")) {
    return [
      { label: "Dashboard",    href: "/"      },
      { label: "Employee Risk", href: "/users" },
      { label: "Profile"                       },
    ];
  }

  return [{ label: "Dashboard", href: "/" }];
}

export function Breadcrumb() {
  const pathname = usePathname();

  // Don't show breadcrumb on root
  if (pathname === "/") return null;

  const crumbs = buildCrumbs(pathname);

  return (
    <nav className="breadcrumb" aria-label="Page location">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={i} className="breadcrumbItem">
            {crumb.href && !isLast ? (
              <Link href={crumb.href} className="breadcrumbLink">
                {crumb.label}
              </Link>
            ) : (
              <span className={isLast ? "breadcrumbCurrent" : "breadcrumbLink"}>
                {crumb.label}
              </span>
            )}
            {!isLast && <span className="breadcrumbSep" aria-hidden>›</span>}
          </span>
        );
      })}
    </nav>
  );
}
