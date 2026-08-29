import React from "react";

export default function StatCard({ label, value, hint, tone = "default", icon }) {
  const toneClass =
    tone === "success"
      ? "text-emerald-400"
      : tone === "warning"
      ? "text-amber-400"
      : tone === "accent"
      ? "text-[#818CF8]"
      : tone === "danger"
      ? "text-rose-400"
      : "text-white";

  return (
    <div className="p-5 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] shadow-xl hover:border-white/[0.15] transition-all">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider">{label}</p>
        {icon && <span className="text-slate-500">{icon}</span>}
      </div>
      <p className={`font-mono text-2xl font-bold mt-2 ${toneClass}`}>{value}</p>
      {hint && <p className="text-xs text-slate-400 mt-1 font-sans">{hint}</p>}
    </div>
  );
}
