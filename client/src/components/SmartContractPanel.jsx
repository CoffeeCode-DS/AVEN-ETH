import { formatEth, formatDate, truncateAddress } from "../utils/format.js";

function Condition({ met, label }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5 font-mono text-xs">
      <span
        className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] shrink-0 border ${
          met ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold" : "bg-white/[0.05] text-slate-500 border-white/[0.08]"
        }`}
      >
        {met ? "✓" : ""}
      </span>
      <span className={`${met ? "text-slate-200" : "text-slate-500"}`}>{label}</span>
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
    <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] shadow-xl">
      <div className="flex items-center justify-between mb-4 font-mono">
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Stream Vault Contract</p>
        <span className="text-xs text-[#818CF8]">ESC-{agreement.id.replace(/^agr_/, "").slice(0, 8).toUpperCase()}</span>
      </div>

      <div className="flex items-center justify-between mb-4 font-mono text-xs">
        <span className="text-slate-400">Vault State</span>
        <span className="font-semibold text-white">{agreement.status.replace(/_/g, " ")}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs font-mono mb-4">
        <div>
          <p className="text-slate-500 text-[10px]">Client Address</p>
          <p className="text-slate-300 mt-0.5">{truncateAddress(agreement.client?.walletAddress)}</p>
        </div>
        <div>
          <p className="text-slate-500 text-[10px]">Worker Address</p>
          <p className="text-slate-300 mt-0.5">{truncateAddress(agreement.freelancer?.walletAddress)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 font-mono">
        <div className="rounded-xl bg-[#141414] p-3 border border-white/[0.06]">
          <p className="text-[10px] text-slate-500">Locked</p>
          <p className="font-bold text-white text-xs mt-0.5">{formatEth(remaining)}</p>
        </div>
        <div className="rounded-xl bg-[#141414] p-3 border border-white/[0.06]">
          <p className="text-[10px] text-slate-500">Released</p>
          <p className="font-bold text-emerald-400 text-xs mt-0.5">{formatEth(released)}</p>
        </div>
        <div className="rounded-xl bg-[#141414] p-3 border border-white/[0.06]">
          <p className="text-[10px] text-slate-500">Remaining</p>
          <p className="font-bold text-white text-xs mt-0.5">{formatEth(remaining)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-mono mb-4 pb-4 border-b border-white/[0.06]">
        <span className="text-slate-400">Deadline</span>
        <span className="font-medium text-slate-200">{formatDate(agreement.deadline)}</span>
      </div>

      <p className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">Contract Conditions</p>
      <Condition met={workSubmitted} label="Work proof recorded" />
      <Condition met={approvalRecorded} label="Client settlement signed" />
      <Condition met={consensusValidated} label="PoW Consensus validated" />
    </div>
  );
}
