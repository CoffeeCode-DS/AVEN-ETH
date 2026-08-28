import { useNavigate } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";
import { formatEth, formatDate, statusProgress, nextActionLabel, daysUntil } from "../utils/format.js";

export default function ProjectCard({ agreement, role }) {
  const navigate = useNavigate();
  const counterpart = role === "CLIENT" ? agreement.freelancer : agreement.client;
  const progress = statusProgress(agreement.status);
  const dLeft = daysUntil(agreement.deadline);
  const overdue = dLeft !== null && dLeft < 0 && !["COMPLETED", "CANCELLED"].includes(agreement.status);

  return (
    <button
      onClick={() => navigate(`/agreements/${agreement.id}`)}
      className="card p-5 text-left w-full hover:shadow-popover hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-ink-900 text-[15px] truncate group-hover:text-accent transition-colors">
            {agreement.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="h-5 w-5 rounded-full bg-ink-900 text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
              {counterpart?.avatar}
            </span>
            <span className="text-sm text-ink-500 truncate">{counterpart?.name}</span>
          </div>
        </div>
        <StatusBadge status={agreement.status} />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-ink-400 mb-1.5">
          <span>Progress</span>
          <span className="font-tabular">{progress}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-ink-900/[0.06] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              agreement.status === "CANCELLED" ? "bg-danger-600" : agreement.status === "COMPLETED" ? "bg-success" : "bg-accent"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <div>
          <p className="text-ink-400 text-xs">Escrow</p>
          <p className="font-tabular font-medium text-ink-800">{formatEth(agreement.escrowBalance)}</p>
        </div>
        <div className="text-right">
          <p className="text-ink-400 text-xs">Deadline</p>
          <p className={`font-medium ${overdue ? "text-danger-600" : "text-ink-800"}`}>
            {formatDate(agreement.deadline)}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border-soft flex items-center justify-between">
        <span className="text-sm font-medium text-accent group-hover:underline">
          {nextActionLabel(agreement.status, role)}
        </span>
        <span className="text-ink-300 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
      </div>
    </button>
  );
}
