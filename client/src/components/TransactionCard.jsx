import StatusBadge from "./StatusBadge.jsx";
import { formatEth, formatDateTime, truncateAddress } from "../utils/format.js";

const TYPE_CONFIG = {
  ESCROW_FUNDED: { label: "Escrow Funded", tone: "text-accent-700 bg-accent-50" },
  WORK_SUBMITTED: { label: "Work Submitted", tone: "text-ink-600 bg-ink-900/5" },
  REVISION_REQUESTED: { label: "Revision Requested", tone: "text-warning-700 bg-warning-50" },
  PAYMENT_RELEASED: { label: "Payment Released", tone: "text-success-700 bg-success-50" },
  PROJECT_COMPLETED: { label: "Project Completed", tone: "text-success-700 bg-success-50" },
};

export default function TransactionCard({ txn, onClick }) {
  const conf = TYPE_CONFIG[txn.type] || { label: txn.type, tone: "text-ink-600 bg-ink-900/5" };
  const hasAmount = txn.amount > 0;

  return (
    <button
      onClick={onClick}
      className="card p-5 text-left w-full hover:shadow-popover hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${conf.tone}`}>
            {conf.label}
          </span>
          <p className="font-display font-medium text-ink-900 mt-2">{txn.projectTitle}</p>
        </div>
        <StatusBadge status={txn.status} />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-ink-400">From</p>
          <p className="text-sm font-medium text-ink-800 truncate">{txn.fromName}</p>
        </div>
        <span className="text-ink-300">&rarr;</span>
        {hasAmount && (
          <p className="font-tabular text-sm font-semibold text-ink-900 whitespace-nowrap">
            {formatEth(txn.amount)}
          </p>
        )}
        <span className="text-ink-300">&rarr;</span>
        <div className="min-w-0 flex-1 text-right">
          <p className="text-xs text-ink-400">To</p>
          <p className="text-sm font-medium text-ink-800 truncate">{txn.toName}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border-soft grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <p className="text-ink-400">Tx Hash</p>
          <p className="font-tabular text-ink-700 mt-0.5">{truncateAddress(txn.simulatedTxHash)}</p>
        </div>
        <div>
          <p className="text-ink-400">Block</p>
          <p className="font-tabular text-ink-700 mt-0.5">#{txn.block}</p>
        </div>
        <div>
          <p className="text-ink-400">Network</p>
          <p className="text-ink-700 mt-0.5">AVEN-ETH Sim</p>
        </div>
        <div>
          <p className="text-ink-400">Timestamp</p>
          <p className="text-ink-700 mt-0.5">{formatDateTime(txn.timestamp)}</p>
        </div>
      </div>
    </button>
  );
}
