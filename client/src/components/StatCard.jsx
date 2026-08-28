export default function StatCard({ label, value, hint, tone = "default", icon }) {
  const toneClass =
    tone === "success"
      ? "text-success-700"
      : tone === "warning"
      ? "text-warning-700"
      : tone === "accent"
      ? "text-accent-700"
      : "text-ink-900";

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-ink-400 uppercase tracking-wide">{label}</p>
        {icon && <span className="text-ink-300">{icon}</span>}
      </div>
      <p className={`font-display font-tabular text-2xl font-semibold mt-2 ${toneClass}`}>{value}</p>
      {hint && <p className="text-xs text-ink-400 mt-1">{hint}</p>}
    </div>
  );
}
