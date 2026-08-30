import React from "react";

export default function StatCard({ label, value, hint, tone = "default", icon }) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warning"
      ? "text-amber-600 dark:text-amber-400"
      : tone === "accent"
      ? "text-[#6366F1] dark:text-[#818CF8]"
      : tone === "danger"
      ? "text-rose-600 dark:text-rose-400"
      : "text-slate-900 dark:text-white";

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl hover:border-slate-300 dark:hover:border-white/[0.15] transition-all">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
        {icon && <span className="text-slate-400 dark:text-slate-500">{icon}</span>}
      </div>
      <p className={`font-mono text-2xl font-bold mt-2 ${toneClass}`}>{value}</p>
      {hint && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">{hint}</p>}
    </div>
  );
}
