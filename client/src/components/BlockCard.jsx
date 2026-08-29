import { formatEth, formatDateTime, truncateAddress } from "../utils/format.js";

const TYPE_LABELS = {
  GENESIS: "Genesis Block",
  ESCROW_FUNDED: "Escrow Funded",
  WORK_SUBMITTED: "Work Submitted",
  REVISION_REQUESTED: "Revision Requested",
  PAYMENT_RELEASED: "Payment Released",
  PROJECT_COMPLETED: "Project Completed",
  WALLET_DEPOSIT: "Wallet Deposit",
  WALLET_TRANSFER: "Wallet Transfer",
  STREAM_CLAIMED: "Stream Claim",
  DISPUTE_RAISED: "Dispute Freeze",
};

export default function BlockCard({ block, broken = false }) {
  const isGenesis = block.type === "GENESIS";

  return (
    <div
      className={`p-5 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] shadow-xl transition-all ${
        broken ? "!border-rose-500/80 ring-1 ring-rose-500/40" : "hover:border-indigo-500/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div
            className={`h-9 w-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 border ${
              broken
                ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                : isGenesis
                ? "bg-white/[0.08] text-white border-white/[0.12]"
                : "bg-[#6366F1]/15 text-[#818CF8] border-indigo-500/30"
            }`}
          >
            #{block.blockNumber}
          </div>
          <div>
            <p className="font-sans font-medium text-white text-sm">
              Block #{block.blockNumber}
            </p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{TYPE_LABELS[block.type] || block.type}</p>
          </div>
        </div>
        <span
          className={`text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full border ${
            broken
              ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
              : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
          }`}
        >
          {broken ? "INTEGRITY FAILED" : "CONFIRMED"}
        </span>
      </div>

      {!isGenesis && (
        <div className="mt-3.5 flex items-center gap-3 text-xs font-mono">
          <p className="text-slate-300 truncate">{block.fromName || truncateAddress(block.from)}</p>
          <span className="text-slate-500 shrink-0">&rarr;</span>
          {block.amount > 0 && (
            <p className="font-bold text-white whitespace-nowrap shrink-0 px-2 py-0.5 rounded bg-white/[0.06]">
              {formatEth(block.amount)}
            </p>
          )}
          <span className="text-slate-500 shrink-0">&rarr;</span>
          <p className="text-slate-300 truncate">{block.toName || truncateAddress(block.to)}</p>
        </div>
      )}
      {block.projectTitle && !isGenesis && (
        <p className="text-xs text-slate-400 mt-1">{block.projectTitle}</p>
      )}

      <div className="mt-4 pt-3.5 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div>
          <p className="text-slate-500 text-[10px]">Hash</p>
          <p className="text-slate-300 mt-0.5 truncate">{truncateAddress(block.hash)}</p>
        </div>
        <div>
          <p className="text-slate-500 text-[10px]">Previous Hash</p>
          <p className="text-slate-300 mt-0.5 truncate">{truncateAddress(block.previousHash)}</p>
        </div>
        <div>
          <p className="text-slate-500 text-[10px]">Nonce</p>
          <p className="text-slate-300 mt-0.5">{block.nonce?.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-slate-500 text-[10px]">Difficulty</p>
          <p className="text-slate-300 mt-0.5">{block.difficulty}</p>
        </div>
      </div>
      <p className="text-[11px] font-mono text-slate-500 mt-3">{formatDateTime(block.timestamp)} &middot; Proof of Work &middot; AVEN-ETH Localnet (Chain: 31337)</p>
    </div>
  );
}
