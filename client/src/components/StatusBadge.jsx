const CONFIG = {
  PENDING_FUNDING: { label: "Pending Funding", tone: "warning" },
  FUNDED: { label: "Funded", tone: "accent" },
  IN_PROGRESS: { label: "In Progress", tone: "accent" },
  SUBMITTED: { label: "Awaiting Review", tone: "warning" },
  REVISION_REQUESTED: { label: "Revision Requested", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  RELEASED: { label: "Released", tone: "success" },
  COMPLETED: { label: "Completed", tone: "success" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
  REJECTED: { label: "Rejected", tone: "danger" },
  PENDING_REVIEW: { label: "Pending Review", tone: "warning" },
  RUNNING: { label: "Running", tone: "success" },
  PAUSED: { label: "Paused", tone: "warning" },
  STOPPED: { label: "Stopped", tone: "neutral" },
  IDLE: { label: "Not Started", tone: "neutral" },
  CONFIRMED: { label: "Confirmed", tone: "success" },
  DISPUTED: { label: "Disputed Freeze", tone: "danger" },
};

const TONE_CLASSES = {
  warning: "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/30",
  accent: "bg-[#6366F1]/15 text-[#818CF8] ring-1 ring-inset ring-indigo-500/30",
  success: "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30",
  danger: "bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-500/30",
  neutral: "bg-white/[0.08] text-slate-300 ring-1 ring-inset ring-white/[0.12]",
};

export default function StatusBadge({ status, className = "" }) {
  const conf = CONFIG[status] || { label: status?.replace(/_/g, " ") || "Unknown", tone: "neutral" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-mono font-medium tracking-wide ${TONE_CLASSES[conf.tone]} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {conf.label}
    </span>
  );
}
