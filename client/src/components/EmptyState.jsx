import React from "react";

export default function EmptyState({ icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      {icon && (
        <div className="h-12 w-12 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-slate-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="font-sans font-medium text-white text-base">{title}</h3>
      {message && <p className="text-xs text-slate-400 mt-1.5 max-w-sm font-sans">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
