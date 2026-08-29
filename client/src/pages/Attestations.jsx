import { useEffect, useState } from "react";
import AppLayout from "../layouts/AppLayout.jsx";
import { api } from "../api/client.js";
import { formatEth, formatDate, formatDateTime, truncateAddress } from "../utils/format.js";

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
        <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search by title, recipient, hash..."
              className="input pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg
              className="absolute left-3 top-3 h-4 w-4 text-ink-400 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "FREELANCE", "GRANT", "BOUNTY", "SALARY", "AGENTTASK"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterCategory === cat
                    ? "bg-navy-900 text-white"
                    : "bg-ink-900/[0.04] text-ink-600 hover:bg-ink-900/[0.08]"
                }`}
              >
                {cat === "ALL" ? "All Categories" : cat}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-danger-50 border border-danger-100 px-4 py-3 text-sm text-danger-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-28 w-full" />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="card p-12 text-center">
            <p className="text-ink-500 font-medium">No on-chain attestations found matching your query.</p>
          </div>
        )}

        {/* Attestation Records Feed */}
        <div className="grid gap-4">
          {filtered.map((att) => (
            <div
              key={att.id}
              className="card p-6 hover:border-accent/40 transition-all hover:shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-accent px-2 py-0.5 bg-accent-50 rounded border border-accent-100">
                      #{att.id}
                    </span>
                    <h3 className="font-display font-semibold text-lg text-ink-900">
                      {att.streamTitle || att.title || "Payment Stream"}
                    </h3>
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {att.category}
                    </span>
                    {att.clientConfirmed ? (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                        ✓ Client Confirmed
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
                        ⚡ Stream Claim
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-400">
                    Stream: <span className="font-mono text-ink-600">#{att.streamId}</span> &middot; Kind: <span className="font-medium text-ink-600">{att.kind}</span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-ink-400">Amount Paid</p>
                  <p className="font-tabular text-xl font-bold text-ink-900">
                    {formatEth(att.amountPaid)}
                  </p>
                </div>
              </div>

              {/* Parties & Evidence Hash */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-border-soft text-xs">
                <div>
                  <span className="text-ink-400 block mb-0.5">Worker (Recipient)</span>
                  <span className="font-medium text-ink-800">
                    {att.recipientUser?.name || truncateAddress(att.recipient)}
                  </span>
                </div>
                <div>
                  <span className="text-ink-400 block mb-0.5">Client (Sender)</span>
                  <span className="font-medium text-ink-800">
                    {att.senderUser?.name || truncateAddress(att.sender)}
                  </span>
                </div>
                <div>
                  <span className="text-ink-400 block mb-0.5">Active Duration</span>
                  <span className="font-tabular font-medium text-ink-800">
                    {Math.round((att.activeDurationSeconds || 0) / 3600 * 10) / 10} hours
                  </span>
                </div>
                <div>
                  <span className="text-ink-400 block mb-0.5">Minted Timestamp</span>
                  <span className="font-medium text-ink-800">
                    {formatDate(att.createdAt)}
                  </span>
                </div>
              </div>

              {/* Cryptographic Hash */}
              {att.reportHash && (
                <div className="rounded-xl bg-ink-900/[0.03] p-3 border border-border-soft flex items-center justify-between gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-ink-500 uppercase tracking-wider text-[10px]">
                      Report SHA-256:
                    </span>
                    <span className="font-mono text-ink-700 truncate max-w-md">
                      {att.reportHash}
                    </span>
                  </div>
                  <button
                    onClick={() => copyHash(att.reportHash)}
                    className="text-accent hover:underline font-semibold shrink-0"
                  >
                    {copiedHash === att.reportHash ? "Copied!" : "Copy Hash"}
                  </button>
                </div>
              )}

              {/* Review / Feedback if present */}
              {att.review && (
                <div className="rounded-xl bg-amber-50/70 border border-amber-100 p-3 text-xs text-amber-900">
                  <strong>Client Review ({att.rating}★):</strong> &ldquo;{att.review}&rdquo;
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
