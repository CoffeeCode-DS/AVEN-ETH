import { useEffect, useMemo, useState } from "react";
import AppLayout from "../layouts/AppLayout.jsx";
import { api } from "../api/client.js";
import TransactionCard from "../components/TransactionCard.jsx";
import TransactionDetailModal from "../components/TransactionDetailModal.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LoadingGrid from "../components/LoadingSkeleton.jsx";

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "ESCROW", label: "Escrow", types: ["ESCROW_FUNDED"] },
  { key: "PAYMENTS", label: "Payments", types: ["PAYMENT_RELEASED"] },
  { key: "WORK", label: "Work", types: ["WORK_SUBMITTED", "REVISION_REQUESTED"] },
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
    <AppLayout title="Transactions" subtitle="Every simulated on-chain event across your projects.">
      <div className="flex items-center gap-1.5 bg-ink-900/[0.04] rounded-xl p-1 mb-6 w-fit overflow-x-auto max-w-full">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filter === f.key ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl bg-danger-50 border border-danger-100 px-4 py-3 text-sm text-danger-700 mb-6">
          {error}
        </div>
      )}

      {!transactions && !error && <LoadingGrid count={4} />}

      {transactions && filtered.length === 0 && (
        <div className="card">
          <EmptyState title="No transactions yet" message="Simulated transactions will appear here as your agreements progress." />
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
