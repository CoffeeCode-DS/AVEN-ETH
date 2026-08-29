import { useEffect, useMemo, useState } from "react";
import AppLayout from "../layouts/AppLayout.jsx";
import { api } from "../api/client.js";
import TransactionCard from "../components/TransactionCard.jsx";
import TransactionDetailModal from "../components/TransactionDetailModal.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LoadingGrid from "../components/LoadingSkeleton.jsx";

const FILTERS = [
  { key: "ALL", label: "All Events" },
  { key: "ESCROW", label: "Escrow Deposits", types: ["ESCROW_FUNDED", "WALLET_DEPOSIT"] },
  { key: "PAYMENTS", label: "Streams & Releases", types: ["PAYMENT_RELEASED", "STREAM_CLAIMED", "WALLET_TRANSFER"] },
  { key: "WORK", label: "Work Proofs", types: ["WORK_SUBMITTED", "REVISION_REQUESTED"] },
  { key: "COMPLETED", label: "Completed", types: ["PROJECT_COMPLETED"] },
];

export default function Transactions() {
  const [transactions, setTransactions] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [selectedTxn, setSelectedTxn] = useState(null);

  useEffect(() => {
    api
      .transactions()
      .then((res) => setTransactions(res.transactions))
      .catch((err) => setError(err.message));
  }, []);

  const filtered = useMemo(() => {
    if (!transactions) return [];
    if (filter === "ALL") return transactions;
    const conf = FILTERS.find((f) => f.key === filter);
    return transactions.filter((t) => conf.types.includes(t.type));
  }, [transactions, filter]);

  return (
    <AppLayout title="Transactions" subtitle="Every simulated on-chain event across your payment streams and escrow vaults.">
      <div className="flex items-center gap-1.5 bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-1 mb-6 w-fit overflow-x-auto max-w-full shadow-lg">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors whitespace-nowrap ${
              filter === f.key ? "bg-[#6366F1] text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-xs font-mono text-rose-400 mb-6">
          {error}
        </div>
      )}

      {!transactions && !error && <LoadingGrid count={4} />}

      {transactions && filtered.length === 0 && (
        <div className="p-12 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] shadow-xl">
          <EmptyState title="No transactions yet" message="Simulated transactions will appear here as your agreements and streams progress." />
        </div>
      )}

      {filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((t) => (
            <TransactionCard key={t.id} txn={t} onClick={() => setSelectedTxn(t)} />
          ))}
        </div>
      )}

      <TransactionDetailModal txn={selectedTxn} open={Boolean(selectedTxn)} onClose={() => setSelectedTxn(null)} />
    </AppLayout>
  );
}
