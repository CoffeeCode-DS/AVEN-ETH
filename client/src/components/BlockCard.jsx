import { formatEth, formatDateTime, truncateAddress } from "../utils/format.js";

const TYPE_LABELS = {
  GENESIS: "Genesis Block",
  ESCROW_FUNDED: "Escrow Funded",
  WORK_SUBMITTED: "Work Submitted",
  REVISION_REQUESTED: "Revision Requested",
  PAYMENT_RELEASED: "Payment Released",
  PROJECT_COMPLETED: "Project Completed",
};

export default function BlockCard({ block, broken = false }) {
  const isGenesis = block.type === "GENESIS";

  return (
    <div
      className={`card p-5 transition-colors ${
        broken ? "!border-danger-600 ring-2 ring-danger-100" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div
            className={`h-9 w-9 rounded-lg flex items-center justify-center font-display font-bold text-xs shrink-0 ${
              broken ? "bg-danger-50 text-danger-600" : isGenesis ? "bg-ink-900 text-white" : "bg-accent-50 text-accent-700"
            }`}
          >
            #{block.blockNumber}
          </div>
          <div>
            <p className="font-display font-semibold text-ink-900 text-sm">
              Block #{block.blockNumber}
            </p>
            <p className="text-xs text-ink-400">{TYPE_LABELS[block.type] || block.type}</p>
          </div>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            broken
              ? "bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-100"
              : "bg-success-50 text-success-700 ring-1 ring-inset ring-success-100"
          }`}
        >
          {broken ? "INTEGRITY FAILED" : "CONFIRMED"}
        </span>
      </div>

      {!isGenesis && (
        <div className="mt-3.5 flex items-center gap-3 text-sm">
          <p className="text-ink-600 truncate">{block.fromName}</p>
          <span className="text-ink-300 shrink-0">&rarr;</span>
          {block.amount > 0 && (
            <p className="font-tabular font-semibold text-ink-900 whitespace-nowrap shrink-0">
              {formatEth(block.amount)}
            </p>
          )}
          <span className="text-ink-300 shrink-0">&rarr;</span>
          <p className="text-ink-600 truncate">{block.toName}</p>
        </div>
      )}
      {block.projectTitle && !isGenesis && (
        <p className="text-xs text-ink-400 mt-1">{block.projectTitle}</p>
      )}

      <div className="mt-4 pt-4 border-t border-border-soft grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <p className="text-ink-400">Hash</p>
          <p className="font-tabular text-ink-700 mt-0.5">{truncateAddress(block.hash)}</p>
        </div>
        <div>
          <p className="text-ink-400">Previous Hash</p>
          <p className="font-tabular text-ink-700 mt-0.5">{truncateAddress(block.previousHash)}</p>
        </div>
        <div>
          <p className="text-ink-400">Nonce</p>
          <p className="font-tabular text-ink-700 mt-0.5">{block.nonce.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-ink-400">Difficulty</p>
          <p className="font-tabular text-ink-700 mt-0.5">{block.difficulty}</p>
        </div>
      </div>
      <p className="text-xs text-ink-300 mt-3">{formatDateTime(block.timestamp)} &middot; Proof of Work &middot; AVEN-ETH Simulation Network</p>
    </div>
  );
}
