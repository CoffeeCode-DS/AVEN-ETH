import { formatEth, formatDate, truncateAddress } from "../utils/format.js";

function Condition({ met, label }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span
        className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
          met ? "bg-success text-white" : "bg-ink-900/[0.06] text-ink-300"
        }`}
      >
        {met ? "\u2713" : ""}
      </span>
      <span className={`text-sm ${met ? "text-ink-700" : "text-ink-300"}`}>{label}</span>
    </div>
  );
}

/**
 * A read-only view of the escrow smart contract's current state,
 * entirely derived from the agreement record — never a separate,
 * independently-editable source of truth.
 */
export default function SmartContractPanel({ agreement }) {
  const released = agreement.status === "COMPLETED" ? agreement.budget : 0;
  const remaining = agreement.escrowBalance;
  const workSubmitted = Boolean(agreement.submission);
  const approvalRecorded = agreement.status === "COMPLETED";
  const consensusValidated = ["FUNDED", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "COMPLETED"].includes(
    agreement.status
  );

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium text-ink-400 uppercase tracking-wide">Escrow Contract</p>
        <span className="text-xs font-tabular text-ink-400">ESC-{agreement.id.replace(/^agr_/, "").slice(0, 8).toUpperCase()}</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-ink-500">State</span>
        <span className="text-sm font-semibold text-ink-900">{agreement.status.replace(/_/g, " ")}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <p className="text-xs text-ink-400">Client</p>
          <p className="font-tabular text-ink-800 mt-0.5">{truncateAddress(agreement.client?.walletAddress)}</p>
        </div>
        <div>
          <p className="text-xs text-ink-400">Freelancer</p>
          <p className="font-tabular text-ink-800 mt-0.5">{truncateAddress(agreement.freelancer?.walletAddress)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl bg-ink-900/[0.03] px-3 py-2.5">
          <p className="text-xs text-ink-400">Locked</p>
          <p className="font-tabular font-semibold text-ink-900 text-sm mt-0.5">{formatEth(remaining)}</p>
        </div>
        <div className="rounded-xl bg-ink-900/[0.03] px-3 py-2.5">
          <p className="text-xs text-ink-400">Released</p>
          <p className="font-tabular font-semibold text-success-700 text-sm mt-0.5">{formatEth(released)}</p>
        </div>
        <div className="rounded-xl bg-ink-900/[0.03] px-3 py-2.5">
          <p className="text-xs text-ink-400">Remaining</p>
          <p className="font-tabular font-semibold text-ink-900 text-sm mt-0.5">{formatEth(remaining)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm mb-4 pb-4 border-b border-border-soft">
        <span className="text-ink-400">Deadline</span>
        <span className="font-medium text-ink-800">{formatDate(agreement.deadline)}</span>
      </div>

      <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-1">Conditions</p>
      <Condition met={workSubmitted} label="Work submitted" />
      <Condition met={approvalRecorded} label="Client approval recorded" />
      <Condition met={consensusValidated} label="Consensus validated" />
    </div>
  );
}
