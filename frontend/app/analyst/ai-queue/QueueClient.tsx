"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import type { AIFlag } from "../../../lib/api";
import FlagReviewModal from "./FlagReviewModal";
import { Shield, Usb, Wifi, AlertTriangle, Clock, ChevronRight, Sparkles, Filter } from "lucide-react";

export default function QueueClient({ initialFlags }: { initialFlags: AIFlag[] }) {
  const [selectedFlag, setSelectedFlag] = useState<AIFlag | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Unique employees from flags
  const employees = useMemo(() => {
    const map = new Map<string, { user_id: string; user_name: string }>();
    initialFlags.forEach((f) => {
      if (!map.has(f.user_id)) map.set(f.user_id, { user_id: f.user_id, user_name: f.user_name });
    });
    return Array.from(map.values()).sort((a, b) => a.user_name.localeCompare(b.user_name));
  }, [initialFlags]);

  // Unique sources
  const sources = useMemo(() => {
    return Array.from(new Set(initialFlags.map((f) => f.source))).sort();
  }, [initialFlags]);

  // Filter + sort
  const filtered = useMemo(() => {
    return initialFlags
      .filter((f) => {
        if (selectedEmployee !== "all" && f.user_id !== selectedEmployee) return false;
        if (selectedSource !== "all" && f.source !== selectedSource) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (
            !f.user_name.toLowerCase().includes(q) &&
            !f.threat_category.toLowerCase().includes(q) &&
            !(f.qwen_reasoning || "").toLowerCase().includes(q)
          ) return false;
        }
        return true;
      })
      .sort((a, b) => b.suspicion_score - a.suspicion_score);
  }, [initialFlags, selectedEmployee, selectedSource, searchQuery]);

  const highRiskCount = filtered.filter((f) => f.suspicion_score >= 80).length;
  const pendingCount = filtered.filter((f) => f.status === "pending").length;

  const getSourceIcon = (source: string) => {
    switch(source.toLowerCase()) {
      case 'usb': return <Usb className="w-5 h-5 text-cyan-400" />;
      case 'network': return <Wifi className="w-5 h-5 text-emerald-400" />;
      default: return <Shield className="w-5 h-5 text-violet-400" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]";
    if (score >= 50) return "bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]";
    return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
  };

  return (
    <div className="w-full relative space-y-6">
      {/* Background ambient glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* ── Stats Bar ── */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          { label: "Total Flags", value: filtered.length, color: "rgba(255,255,255,0.9)" },
          { label: "High Risk (≥80%)", value: highRiskCount, color: "#f87171" },
          { label: "Pending Review", value: pendingCount, color: "#fbbf24" },
          { label: "Employees Flagged", value: employees.length, color: "#818cf8" },
        ].map(stat => (
          <div key={stat.label} style={{
            flex: "1 1 140px", padding: "14px 18px", borderRadius: 12,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", flexDirection: "column", gap: 4
          }}>
            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{stat.label}</span>
            <span style={{ fontSize: "1.4rem", fontWeight: 700, color: stat.color }}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{
        display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center",
        padding: "14px 18px", borderRadius: 12,
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)"
      }}>
        <Filter style={{ width: 16, height: 16, color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />

        {/* Search */}
        <input
          type="text"
          placeholder="Search flags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: "8px 14px", borderRadius: 8, flex: 1, minWidth: 160,
            background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff", fontSize: "0.85rem"
          }}
        />

        {/* Employee Filter */}
        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          style={{
            padding: "8px 14px", borderRadius: 8, minWidth: 200,
            background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff", fontSize: "0.85rem"
          }}
        >
          <option value="all">All Employees ({employees.length})</option>
          {employees.map((emp) => (
            <option key={emp.user_id} value={emp.user_id}>{emp.user_name}</option>
          ))}
        </select>

        {/* Source Filter */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["all", ...sources].map((src) => (
            <button
              key={src}
              onClick={() => setSelectedSource(src)}
              style={{
                padding: "6px 12px", borderRadius: 20, fontSize: "0.78rem",
                fontWeight: 600, textTransform: "capitalize",
                background: selectedSource === src ? "var(--accent)" : "rgba(255,255,255,0.05)",
                color: selectedSource === src ? "#000" : "rgba(255,255,255,0.5)",
                border: "none", cursor: "pointer", transition: "all 0.2s"
              }}
            >
              {src === "all" ? "All Sources" : src}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="relative backdrop-blur-2xl bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="p-5 text-white/40 text-xs font-semibold uppercase tracking-widest whitespace-nowrap">Source</th>
                <th className="p-5 text-white/40 text-xs font-semibold uppercase tracking-widest whitespace-nowrap">Employee</th>
                <th className="p-5 text-white/40 text-xs font-semibold uppercase tracking-widest whitespace-nowrap">Threat Category</th>
                <th className="p-5 text-white/40 text-xs font-semibold uppercase tracking-widest whitespace-nowrap">Risk Score</th>
                <th className="p-5 text-white/40 text-xs font-semibold uppercase tracking-widest whitespace-nowrap">Time Detected</th>
                <th className="p-5 text-right text-white/40 text-xs font-semibold uppercase tracking-widest whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                        <Sparkles className="w-8 h-8 text-white/40" />
                      </div>
                      <div className="text-white/60 font-medium text-lg">
                        {initialFlags.length === 0 ? "Queue is empty" : "No flags match filters"}
                      </div>
                      <div className="text-white/40 text-sm">
                        {initialFlags.length === 0 ? "No anomalous activities detected." : "Try adjusting your filter criteria."}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : null}
              {filtered.map((flag) => (
                <tr
                  key={flag.id}
                  className="group transition-all duration-300 hover:bg-white/[0.06]"
                >
                  {/* Source */}
                  <td className="p-5 cursor-pointer" onClick={() => setSelectedFlag(flag)}>
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-300">
                        {getSourceIcon(flag.source)}
                      </div>
                      <span className="capitalize text-white/80 font-medium tracking-wide">{flag.source}</span>
                    </div>
                  </td>

                  {/* Employee — name links to their profile via analyst/users list */}
                  <td className="p-5">
                    <button
                      onClick={() => setSelectedEmployee(flag.user_id === selectedEmployee ? "all" : flag.user_id)}
                      title="Filter by this employee"
                      style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
                    >
                      <div className="font-semibold text-white/90 hover:text-cyan-400 transition-colors" style={{ fontSize: "0.95rem" }}>
                        {flag.user_name}
                      </div>
                      <div className="text-white/40 text-xs mt-1">
                        click to filter · {flag.status}
                      </div>
                    </button>
                  </td>

                  {/* Threat Category */}
                  <td className="p-5 cursor-pointer" onClick={() => setSelectedFlag(flag)}>
                    <div className="flex items-center gap-2.5 text-white/70">
                      <AlertTriangle className="w-4 h-4 text-white/30" />
                      <span className="capitalize tracking-wide">{flag.threat_category.replace(/_/g, " ")}</span>
                    </div>
                  </td>

                  {/* Score */}
                  <td className="p-5 cursor-pointer" onClick={() => setSelectedFlag(flag)}>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-sm ${getScoreColor(flag.suspicion_score)}`}>
                      {flag.suspicion_score}%
                    </div>
                  </td>

                  {/* Time */}
                  <td className="p-5 cursor-pointer" onClick={() => setSelectedFlag(flag)}>
                    <div className="flex items-center gap-2.5 text-white/50 text-sm whitespace-nowrap">
                      <Clock className="w-4 h-4" />
                      {new Date(flag.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>

                  {/* Action */}
                  <td className="p-5 text-right cursor-pointer" onClick={() => setSelectedFlag(flag)}>
                    <div className="inline-flex p-2.5 rounded-xl group-hover:bg-white/10 group-hover:text-white transition-all duration-300 text-white/30">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedFlag && (
        <FlagReviewModal
          flag={selectedFlag}
          onClose={() => setSelectedFlag(null)}
        />
      )}
    </div>
  );
}
