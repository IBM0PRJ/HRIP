"use client";
import React, { useState, useEffect } from "react";
import type { AIFlag } from "../../../lib/api";
import { X, ShieldAlert, Cpu, List, FileText, XCircle, PlayCircle, Loader2, Info } from "lucide-react";
import { confirmFlagAction, dismissFlagAction, executeFlagAction } from "./actions";

interface ModalProps {
  flag: AIFlag;
  onClose: () => void;
}

export default function FlagReviewModal({ flag, onClose }: ModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>(flag.recommended_action || "notify");

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleConfirmExecute = async () => {
    setIsProcessing(true);
    try {
      await confirmFlagAction(flag.id);
      await executeFlagAction(flag.id, selectedAction, { reason: "Analyst confirmed AI flag" });
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to execute action.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = async () => {
    setIsProcessing(true);
    try {
      await dismissFlagAction(flag.id);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to dismiss flag.");
    } finally {
      setIsProcessing(false);
    }
  };

  const actions = [
    { id: "session_suspend", label: "Suspend Active Session" },
    { id: "usb_block", label: "Revoke USB Permissions" },
    { id: "network_disconnect", label: "Isolate from Network" },
    { id: "file_quarantine", label: "Quarantine Related Files" },
    { id: "notify", label: "Notify User (Warning)" },
    { id: "training", label: "Assign Mandatory Training" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-[#0f1115]/90 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl shadow-black/50">
        
        {/* Decorative top glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-6 lg:p-8 border-b border-white/5">
          <div className="flex items-center gap-5">
            <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.15)] relative">
              <ShieldAlert className="w-7 h-7 text-rose-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white/95">Flag Review: {flag.user_name}</h2>
              <p className="text-white/40 text-sm mt-1 font-mono">Flag ID: {flag.id}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-white/50 hover:text-white group"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 lg:p-8 space-y-8 flex-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
          
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">
                <Info className="w-4 h-4" /> Threat Category
              </div>
              <div className="text-xl font-semibold text-white/90 capitalize">{flag.threat_category.replace(/_/g, " ")}</div>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col justify-center">
              <div className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">AI Confidence Score</div>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-2 bg-black/50 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full relative" 
                    style={{ width: `${flag.suspicion_score}%` }}
                  >
                  </div>
                </div>
                <span className="text-rose-400 font-black text-xl">{flag.suspicion_score}%</span>
              </div>
            </div>
          </div>

          {/* AI Reasoning */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
              <Cpu className="w-48 h-48" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">
                Qwen AI Analysis
              </h3>
            </div>
            <p className="text-white/80 leading-relaxed relative z-10 text-[15px]">
              {flag.qwen_reasoning || "No reasoning provided by AI model."}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Evidence Items */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <List className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-white/90">Correlated Evidence</h3>
              </div>
              <ul className="space-y-3">
                {flag.evidence_items?.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-white/70 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.05] shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
                {(!flag.evidence_items || flag.evidence_items.length === 0) && (
                  <li className="text-white/30 text-sm italic p-4">No specific evidence items listed.</li>
                )}
              </ul>
            </div>

            {/* Context */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-white/90">Employee Context Snapshot</h3>
              </div>
              <div className="p-4 bg-black/60 border border-white/[0.05] rounded-2xl max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20 shadow-inner">
                <pre className="text-[13px] text-white/50 font-mono whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(flag.employee_context, null, 2)}
                </pre>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="shrink-0 p-6 lg:p-8 border-t border-white/5 bg-white/[0.01]">
          <h3 className="text-white/90 font-semibold mb-4 flex items-center gap-2">
            Remediation Action <span className="text-white/40 font-normal text-sm">(Select one)</span>
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 w-full relative">
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-4 pr-10 text-white/90 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none hover:bg-white/10 transition-colors cursor-pointer shadow-sm"
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
              >
                {actions.map(a => (
                  <option key={a.id} value={a.id} className="bg-[#0f1115] text-white">{a.label}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-white/40">
                ▼
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
              <button 
                onClick={handleDismiss}
                disabled={isProcessing}
                className="flex-1 sm:flex-none bg-white/5 hover:bg-white/10 text-white/80 font-semibold py-3.5 px-6 rounded-2xl border border-white/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:text-white"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                Dismiss
              </button>
              <button 
                onClick={handleConfirmExecute}
                disabled={isProcessing}
                className="flex-1 sm:flex-none bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)] text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:shadow-[0_0_30px_rgba(244,63,94,0.5)]"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
                Confirm & Execute
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
