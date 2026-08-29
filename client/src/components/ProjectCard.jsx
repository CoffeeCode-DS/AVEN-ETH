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
      className="p-5 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] text-left w-full hover:border-[#6366F1]/50 hover:bg-[#141414] transition-all duration-200 group shadow-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-sans font-medium text-white text-[15px] truncate group-hover:text-[#818CF8] transition-colors">
            {agreement.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="h-5 w-5 rounded-full bg-[#6366F1] text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
              {counterpart?.avatar || "A"}
            </span>
            <span className="text-xs text-slate-400 truncate">{counterpart?.name}</span>
          </div>
        </div>
        <StatusBadge status={agreement.status} />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-mono">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              agreement.status === "CANCELLED"
                ? "bg-rose-500"
                : agreement.status === "COMPLETED"
                ? "bg-emerald-400"
                : "bg-[#6366F1]"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs font-mono">
        <div>
          <p className="text-slate-500">Escrow</p>
          <p className="font-semibold text-white mt-0.5">{formatEth(agreement.escrowBalance)}</p>
        </div>
        <div className="text-right">
          <p className="text-slate-500">Deadline</p>
          <p className={`font-semibold mt-0.5 ${overdue ? "text-rose-400" : "text-slate-200"}`}>
            {formatDate(agreement.deadline)}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3.5 border-t border-white/[0.06] flex items-center justify-between">
        <span className="text-xs font-medium text-[#818CF8] group-hover:text-white transition-colors">
          {nextActionLabel(agreement.status, role)}
        </span>
        <span className="text-slate-500 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
      </div>
    </button>
  );
}
