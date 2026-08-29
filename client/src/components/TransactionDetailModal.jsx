import { useState } from "react";
import Modal from "./Modal.jsx";
import StatusBadge from "./StatusBadge.jsx";
import { formatEth, formatDateTime, truncateAddress } from "../utils/format.js";

function Disclosure({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-border-soft first:border-t-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-3.5 text-left"
        aria-expanded={open}
      >
        <span className="text-xs font-semibold text-ink-400 uppercase tracking-wide">{title}</span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className={`h-4 w-4 text-ink-300 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm gap-4">
      <span className="text-ink-400 shrink-0">{label}</span>
      <span className={`text-ink-800 font-medium text-right break-all ${mono ? "font-tabular" : ""}`}>{value}</span>
    </div>
  );
}

const TYPE_LABELS = {
  ESCROW_FUNDED: "Escrow Funded",
  WORK_SUBMITTED: "Work Submitted",
  REVISION_REQUESTED: "Revision Requested",
  PAYMENT_RELEASED: "Payment Released",
  PROJECT_COMPLETED: "Project Completed",
};

export default function TransactionDetailModal({ txn, open, onClose }) {
  if (!txn) return null;

  const timelineSteps = [
    "Created",
    "Hashed & Validated (Proof of Work)",
    "Block Confirmed",
    "Escrow State Updated",
  ];

  return (
    <Modal open={open} onClose={onClose} title={TYPE_LABELS[txn.type] || txn.type} subtitle={txn.projectTitle} width="max-w-xl">
      <Disclosure title="Overview" defaultOpen>
        <Row label="Transaction ID" value={txn.id} mono />
        <Row label="Status" value={<StatusBadge status={txn.status} />} />
        <Row label="Timestamp" value={formatDateTime(txn.timestamp)} />
        {txn.amount > 0 && <Row label="Amount" value={formatEth(txn.amount)} mono />}
      </Disclosure>

      <Disclosure title="Participants" defaultOpen>
        <Row label="From" value={txn.fromName} />
        <Row label="To" value={txn.toName} />
        <Row label="Escrow Contract" value="AVEN-ETH Stream Vault (0x3F2bA7e91)" mono />
      </Disclosure>

      <Disclosure title="Blockchain Data" defaultOpen>
        <Row label="Block Number" value={`#${txn.block}`} mono />
        <Row label="Block Hash" value={truncateAddress(txn.simulatedTxHash)} mono />
        <Row label="Previous Hash" value={truncateAddress(txn.previousHash)} mono />
        <Row label="Nonce" value={txn.nonce?.toLocaleString()} mono />
        <Row label="Difficulty" value={txn.difficulty} mono />
        <Row label="Gas (simulated)" value={`${txn.gas} ETH`} mono />
        <Row label="Consensus" value="Proof of Work" />
      </Disclosure>

      <Disclosure title="Timeline" defaultOpen={false}>
        <div className="space-y-3 mt-1">
          {timelineSteps.map((step) => (
            <div key={step} className="flex items-center gap-3">
              <span className="h-4 w-4 rounded-full bg-success text-white flex items-center justify-center text-[10px] shrink-0">
                &#10003;
              </span>
              <span className="text-sm text-ink-700 flex-1">{step}</span>
              <span className="text-xs text-ink-300">{formatDateTime(txn.timestamp)}</span>
            </div>
          ))}
        </div>
      </Disclosure>
    </Modal>
  );
}
