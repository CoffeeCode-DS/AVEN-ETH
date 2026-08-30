import { formatEth, formatDate, truncateAddress } from "../utils/format.js";

function Condition({ met, label }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-white/[0.04] last:border-0 font-mono text-xs">
      <span className={`${met ? "text-slate-800 dark:text-slate-300" : "text-slate-500"}`}>{label}</span>
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
          met
            ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30"
            : "bg-slate-100 dark:bg-white/[0.04] text-slate-500 border-slate-200 dark:border-white/[0.08]"
        }`}
      >
        {met ? "VERIFIED" : "PENDING"}
      </span>
    </div>
  );
}

export default function SmartContractPanel({ agreement }) {
  const released = agreement.status === "COMPLETED" ? agreement.budget : (agreement.totalWithdrawn || 0);
  const remaining = agreement.escrowBalance;
  const workSubmitted = Boolean(agreement.submission);
  const approvalRecorded = agreement.status === "COMPLETED";
  const consensusValidated = ["FUNDED", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "COMPLETED"].includes(
    agreement.status
  );

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-2xl space-y-5">
      <div className="flex items-center justify-between font-mono">
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          On-Chain Stream Vault
        </p>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-[#6366F1]/15 text-[#6366F1] dark:text-[#818CF8] border border-indigo-200 dark:border-indigo-500/30">
          ESC-{agreement.id.replace(/^agr_/, "").slice(0, 8).toUpperCase()}
        </span>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.06] flex items-center justify-between font-mono text-xs">
        <span className="text-slate-500 dark:text-slate-400">Vault Consensus State</span>
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{agreement.status.replace(/_/g, " ")}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.06]">
          <p className="text-slate-500 text-[10px] uppercase">Client Address</p>
          <p className="text-slate-800 dark:text-slate-300 font-semibold mt-1 truncate">{truncateAddress(agreement.client?.walletAddress)}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.06]">
          <p className="text-slate-500 text-[10px] uppercase">Worker Address</p>
          <p className="text-slate-800 dark:text-slate-300 font-semibold mt-1 truncate">{truncateAddress(agreement.freelancer?.walletAddress)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 font-mono">
        <div className="rounded-xl bg-slate-50 dark:bg-[#141414] p-3 border border-slate-200 dark:border-white/[0.06]">
          <p className="text-[10px] text-slate-500 uppercase">Deposit</p>
          <p className="font-bold text-slate-900 dark:text-white text-xs mt-1">{formatEth(agreement.budget)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-[#141414] p-3 border border-slate-200 dark:border-white/[0.06]">
          <p className="text-[10px] text-slate-500 uppercase">Released</p>
          <p className="font-bold text-emerald-600 dark:text-emerald-400 text-xs mt-1">{formatEth(released)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-[#141414] p-3 border border-slate-200 dark:border-white/[0.06]">
          <p className="text-[10px] text-slate-500 uppercase">Vault Rem.</p>
          <p className="font-bold text-[#6366F1] dark:text-[#818CF8] text-xs mt-1">{formatEth(remaining)}</p>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-200 dark:border-white/[0.06]">
        <p className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          Protocol Verification Covenants
        </p>
        <Condition met={consensusValidated} label="EVM Escrow Contract Initialized" />
        <Condition met={workSubmitted} label="Git Merkle Tree Diff Recorded" />
        <Condition met={approvalRecorded} label="Client Settlement Signed" />
      </div>
    </div>
  );
}
