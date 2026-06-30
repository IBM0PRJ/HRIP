import { ReactNode } from "react";
import { AppHeader } from "../../components/AppHeader";
import { Sidebar } from "../../components/Sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="layout">
      <Sidebar />
      <main className="content">
        <AppHeader />
        {children}
      </main>
    </div>
  );
}
