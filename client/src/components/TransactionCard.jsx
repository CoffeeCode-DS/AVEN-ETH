import StatusBadge from "./StatusBadge.jsx";
import { formatEth, formatDateTime, truncateAddress } from "../utils/format.js";

const TYPE_CONFIG = {
  ESCROW_FUNDED: { label: "Escrow Funded", tone: "text-[#818CF8] bg-[#6366F1]/15 border border-indigo-500/30" },
  WORK_SUBMITTED: { label: "Work Submitted", tone: "text-sky-300 bg-sky-500/15 border border-sky-500/30" },
  REVISION_REQUESTED: { label: "Revision Requested", tone: "text-amber-300 bg-amber-500/15 border border-amber-500/30" },
  PAYMENT_RELEASED: { label: "Payment Released", tone: "text-emerald-300 bg-emerald-500/15 border border-emerald-500/30" },
  PROJECT_COMPLETED: { label: "Project Completed", tone: "text-emerald-300 bg-emerald-500/15 border border-emerald-500/30" },
  WALLET_DEPOSIT: { label: "Wallet Deposit", tone: "text-emerald-300 bg-emerald-500/15 border border-emerald-500/30" },
  WALLET_TRANSFER: { label: "Wallet Transfer", tone: "text-[#818CF8] bg-[#6366F1]/15 border border-indigo-500/30" },
  STREAM_CLAIMED: { label: "Stream Claim", tone: "text-emerald-300 bg-emerald-500/15 border border-emerald-500/30" },
  DISPUTE_RAISED: { label: "Dispute Freeze", tone: "text-rose-300 bg-rose-500/15 border border-rose-500/30" },
};

export default function TransactionCard({ txn, onClick }) {
  const conf = TYPE_CONFIG[txn.type] || { label: txn.type?.replace(/_/g, " "), tone: "text-slate-300 bg-white/[0.08] border border-white/[0.12]" };
  const hasAmount = txn.amount > 0;

  return (
    <button
      onClick={onClick}
      className="p-5 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] text-left w-full hover:border-indigo-500/50 hover:bg-[#141414] transition-all duration-200 shadow-xl group"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <span className={`inline-block text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full ${conf.tone}`}>
            {conf.label}
          </span>
          <p className="font-sans font-medium text-white text-[15px] mt-2 group-hover:text-[#818CF8] transition-colors">
            {txn.projectTitle || txn.title || "Transaction"}
          </p>
        </div>
        <StatusBadge status={txn.status} />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-mono text-slate-500">From</p>
          <p className="text-xs font-medium text-slate-200 truncate mt-0.5">{txn.fromName || truncateAddress(txn.from)}</p>
        </div>
        <span className="text-slate-500">&rarr;</span>
        {hasAmount && (
          <p className="font-mono text-xs font-bold text-white whitespace-nowrap px-2 py-1 rounded bg-white/[0.05]">
            {formatEth(txn.amount)}
          </p>
        )}
        <span className="text-slate-500">&rarr;</span>
        <div className="min-w-0 flex-1 text-right">
          <p className="text-[11px] font-mono text-slate-500">To</p>
          <p className="text-xs font-medium text-slate-200 truncate mt-0.5">{txn.toName || truncateAddress(txn.to)}</p>
        </div>
      </div>

      <div className="mt-4 pt-3.5 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div>
          <p className="text-slate-500 text-[10px]">Tx Hash</p>
          <p className="text-slate-300 mt-0.5 truncate">{truncateAddress(txn.simulatedTxHash)}</p>
        </div>
        <div>
          <p className="text-slate-500 text-[10px]">Block</p>
          <p className="text-slate-300 mt-0.5">#{txn.block}</p>
        </div>
        <div>
          <p className="text-slate-500 text-[10px]">Network</p>
          <p className="text-slate-300 mt-0.5">ETH 31337</p>
        </div>
        <div>
          <p className="text-slate-500 text-[10px]">Timestamp</p>
          <p className="text-slate-300 mt-0.5">{formatDateTime(txn.timestamp)}</p>
        </div>
      </div>
    </button>
  );
}
