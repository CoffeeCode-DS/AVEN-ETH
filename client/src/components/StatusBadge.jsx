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
};

const TONE_CLASSES = {
  warning: "bg-warning-50 text-warning-700 ring-1 ring-inset ring-warning-100",
  accent: "bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-100",
  success: "bg-success-50 text-success-700 ring-1 ring-inset ring-success-100",
  danger: "bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-100",
  neutral: "bg-ink-900/5 text-ink-500 ring-1 ring-inset ring-ink-900/10",
};

export default function StatusBadge({ status, className = "" }) {
  const conf = CONFIG[status] || { label: status?.replace(/_/g, " ") || "Unknown", tone: "neutral" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${TONE_CLASSES[conf.tone]} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {conf.label}
    </span>
  );
}
