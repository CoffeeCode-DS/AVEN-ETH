import { useEffect, useState } from "react";
import AppLayout from "../layouts/AppLayout.jsx";
import { api } from "../api/client.js";
import { formatEth, formatDate, truncateAddress } from "../utils/format.js";

export default function Attestations() {
  const [attestations, setAttestations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedHash, setCopiedHash] = useState(null);

  function load() {
    api
      .attestations()
      .then((res) => {
        setAttestations(res.attestations || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }

  useEffect(load, []);

  function copyHash(hash) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 2000);
    }
  }

  const filtered = attestations.filter((att) => {
    if (filterCategory !== "ALL" && att.category?.toUpperCase() !== filterCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (att.streamTitle || att.title || "").toLowerCase().includes(q);
      const matchRecipient = (att.recipientUser?.name || "").toLowerCase().includes(q);
      const matchHash = (att.reportHash || "").toLowerCase().includes(q);
      const matchId = (att.id || "").toLowerCase().includes(q);
      return matchTitle || matchRecipient || matchHash || matchId;
    }
    return true;
  });

  return (
    <AppLayout
      title="Attestation Explorer"
      subtitle="Immutable cryptographic records of verified work and paid streaming milestones."
    >
      <div className="space-y-6">
        {/* Filter / Search Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm dark:shadow-xl">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search by title, recipient, hash..."
              className="input pl-9 font-mono text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg
              className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 font-mono text-xs">
            {["ALL", "FREELANCE", "GRANT", "BOUNTY", "SALARY", "AGENTTASK"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-colors ${
                  filterCategory === cat
                    ? "bg-[#6366F1] text-white shadow-md shadow-indigo-500/25"
                    : "bg-slate-100 dark:bg-[#171717] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-[#1F1F1F] hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {cat === "ALL" ? "All Categories" : cat}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-xs font-mono text-rose-500 dark:text-rose-400">
            {error}
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-28 w-full rounded-2xl" />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="p-12 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] text-center shadow-sm dark:shadow-xl">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-mono">No on-chain attestations found matching your query.</p>
          </div>
        )}

        {/* Attestation Records Feed */}
        <div className="grid gap-4">
          {filtered.map((att) => (
            <div
              key={att.id}
              className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] hover:border-[#6366F1]/40 transition-all shadow-sm dark:shadow-xl space-y-4"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#6366F1] dark:text-[#818CF8] px-2 py-0.5 bg-indigo-50 dark:bg-[#6366F1]/15 rounded border border-indigo-200 dark:border-indigo-500/30">
                      #{att.id}
                    </span>
                    <h3 className="font-sans font-semibold text-base text-slate-900 dark:text-white">
                      {att.streamTitle || att.title || "Payment Stream"}
                    </h3>
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300">
                      {att.category}
                    </span>
                    {att.clientConfirmed ? (
                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                        Client Confirmed
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30">
                        Stream Claim
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Stream: <span className="text-slate-800 dark:text-slate-200">#{att.streamId}</span> &middot; Kind: <span className="text-slate-800 dark:text-slate-200">{att.kind}</span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-mono">Amount Paid</p>
                  <p className="font-mono text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {formatEth(att.amountPaid)}
                  </p>
                </div>
              </div>

              {/* Parties & Evidence Hash */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-200 dark:border-white/[0.06] text-xs font-mono">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Worker (Recipient)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {att.recipientUser?.name || truncateAddress(att.recipient)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Client (Sender)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {att.senderUser?.name || truncateAddress(att.sender)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Active Duration</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {Math.round((att.activeDurationSeconds || 0) / 3600 * 10) / 10} hours
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Minted Timestamp</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatDate(att.createdAt)}
                  </span>
                </div>
              </div>

              {/* Cryptographic Hash */}
              {att.reportHash && (
                <div className="rounded-xl bg-slate-50 dark:bg-[#141414] p-3 border border-slate-200 dark:border-white/[0.06] flex items-center justify-between gap-2 flex-wrap text-xs font-mono">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                      Report SHA-256:
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-md">
                      {att.reportHash}
                    </span>
                  </div>
                  <button
                    onClick={() => copyHash(att.reportHash)}
                    className="text-[#6366F1] dark:text-[#818CF8] hover:underline font-mono text-xs shrink-0 font-medium"
                  >
                    {copiedHash === att.reportHash ? "Copied" : "Copy Hash"}
                  </button>
                </div>
              )}

              {/* Review / Feedback if present */}
              {att.review && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3 text-xs text-amber-800 dark:text-amber-300 font-sans">
                  <strong>Client Rating ({att.rating}/5):</strong> &ldquo;{att.review}&rdquo;
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
