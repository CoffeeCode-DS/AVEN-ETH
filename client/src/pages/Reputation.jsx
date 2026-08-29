import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import { formatEth, formatDate, formatDateTime, truncateAddress } from "../utils/format.js";

const CATEGORY_COLORS = {
  Grant: "from-purple-500 to-indigo-600 text-purple-600 bg-purple-50 border-purple-100",
  Bounty: "from-amber-500 to-orange-600 text-amber-600 bg-amber-50 border-amber-100",
  Freelance: "from-blue-500 to-cyan-600 text-blue-600 bg-blue-50 border-blue-100",
  Salary: "from-emerald-500 to-teal-600 text-emerald-600 bg-emerald-50 border-emerald-100",
  AgentTask: "from-pink-500 to-rose-600 text-pink-600 bg-pink-50 border-pink-100",
  Subscription: "from-slate-500 to-zinc-600 text-slate-600 bg-slate-50 border-slate-100",
};

export default function Reputation() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If freelancer, fetch their own reputation; if client, fetch freelancer_1 or own
    const targetUserId = user.role === "FREELANCER" ? user.id : "user_freelancer_1";
    api
      .reputation(targetUserId)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <AppLayout title="On-Chain Reputation" subtitle="Loading verified work history...">
        <div className="space-y-6">
          <div className="skeleton h-64 w-full" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton h-32 w-full" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout title="On-Chain Reputation">
        <div className="rounded-xl bg-danger-50 border border-danger-100 px-4 py-3 text-sm text-danger-700">
          Failed to load reputation data: {error}
        </div>
      </AppLayout>
    );
  }

  const { reputation, user: repUser } = data;
  const categories = Object.keys(reputation.categoryBreakdown || {});

  return (
    <AppLayout
      title="On-Chain Reputation Scorecard"
      subtitle="Portable, cryptographically-proven work metrics derived from Stellar/Ethereum attestations."
    >
      <div className="space-y-8">
        {/* Main Scorecard Hero */}
        <div className="card p-8 bg-navy-900 !border-navy-800 text-white relative overflow-hidden">
          <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-accent/25 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

          <div className="relative grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-accent-500/20 text-accent-300 uppercase tracking-wider border border-accent-500/30">
                  Verifiable Proof of Work
                </span>
                <span className="text-xs font-tabular text-white/50">
                  {truncateAddress(repUser.walletAddress)}
                </span>
              </div>

              <div>
                <h2 className="font-display text-3xl font-bold text-white tracking-tight">
                  {repUser.name}
                </h2>
                <p className="text-white/60 text-sm mt-1">
                  On-chain score computed continuously from immutable payment attestations.
                </p>
              </div>

              {/* Progress bar to 10,000 */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs text-white/70">
                  <span>Score Progress</span>
                  <span className="font-tabular font-semibold text-accent-400">
                    {reputation.totalScore.toLocaleString()} / {reputation.maxScore.toLocaleString()} pts ({reputation.scorePercentage}%)
                  </span>
                </div>
                <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.max(4, reputation.scorePercentage)}%` }}
                    className="h-full bg-gradient-to-r from-accent-400 to-purple-400 rounded-full transition-all duration-700"
                  />
                </div>
              </div>

              {/* Quick metrics */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-xs text-white/50">Total Attestations</p>
                  <p className="font-tabular text-2xl font-bold text-white mt-0.5">
                    {reputation.totalAttestations}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/50">Verified Volume Paid</p>
                  <p className="font-tabular text-2xl font-bold text-white mt-0.5">
                    {formatEth(reputation.totalVolumeEarned)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/50">Client Confirmation Rate</p>
                  <p className="font-tabular text-2xl font-bold text-emerald-400 mt-0.5">
                    100%
                  </p>
                </div>
              </div>
            </div>

            {/* Score Ring / Badge */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
              <div className="relative flex items-center justify-center h-32 w-32 rounded-full border-4 border-accent-400/40 bg-accent-500/10">
                <div className="text-center">
                  <p className="font-tabular text-3xl font-extrabold text-white">
                    {reputation.totalScore}
                  </p>
                  <p className="text-[10px] text-accent-300 font-semibold tracking-wider uppercase">
                    Rep Score
                  </p>
                </div>
              </div>
              <p className="text-xs text-white/60 mt-3">
                Max protocol capacity: 10,000 pts
              </p>
            </div>
          </div>
        </div>

        {/* Recency Windows Explanation */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="card p-5 border-l-4 !border-l-emerald-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Hot Window</span>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">150% Weight</span>
            </div>
            <p className="text-sm font-medium text-ink-800">&lt; 7 Days Old</p>
            <p className="text-xs text-ink-400 mt-1">
              Active contributions: <strong>{reputation.recencyDistribution.Hot || 0}</strong> attestations
            </p>
          </div>

          <div className="card p-5 border-l-4 !border-l-amber-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Warm Window</span>
              <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold">120% Weight</span>
            </div>
            <p className="text-sm font-medium text-ink-800">7 &ndash; 50 Days Old</p>
            <p className="text-xs text-ink-400 mt-1">
              Recent contributions: <strong>{reputation.recencyDistribution.Warm || 0}</strong> attestations
            </p>
          </div>

          <div className="card p-5 border-l-4 !border-l-slate-400">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Cold Window</span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">100% Weight</span>
            </div>
            <p className="text-sm font-medium text-ink-800">&gt; 50 Days Old</p>
            <p className="text-xs text-ink-400 mt-1">
              Historical baseline: <strong>{reputation.recencyDistribution.Cold || 0}</strong> attestations
            </p>
          </div>
        </div>

        {/* Categorized Reputation Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-lg text-ink-900">
                Categorized Work Breakdown
              </h3>
              <p className="text-xs text-ink-400">
                Points awarded based on volume, category multipliers, and explicit client approvals.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const catData = reputation.categoryBreakdown[cat] || { score: 0, count: 0, volume: 0 };
              const colorClass = CATEGORY_COLORS[cat] || "text-ink-600 bg-ink-50 border-ink-100";

              return (
                <div key={cat} className="card p-5 hover:border-accent/40 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${colorClass}`}>
                      {cat}
                    </span>
                    <span className="font-tabular text-sm font-bold text-ink-900">
                      {catData.score} pts
                    </span>
                  </div>

                  <dl className="space-y-1.5 text-xs text-ink-500 pt-2 border-t border-border-soft">
                    <div className="flex justify-between">
                      <dt>Attestation Count</dt>
                      <dd className="font-medium text-ink-800">{catData.count}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Total Volume</dt>
                      <dd className="font-tabular font-medium text-ink-800">{formatEth(catData.volume)}</dd>
                    </div>
                  </dl>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attestations Ledger */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold text-lg text-ink-900">
                Mined Attestations Feed
              </h3>
              <p className="text-xs text-ink-400">
                Cryptographic proofs of paid work tied to this identity.
              </p>
            </div>
            <Link to="/attestations" className="text-xs font-semibold text-accent hover:underline">
              View Explorer &rarr;
            </Link>
          </div>

          <div className="divide-y divide-border-soft">
            {reputation.attestations.map((att) => (
              <div key={att.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-ink-900">
                      #{att.id}
                    </span>
                    <span className="text-sm font-semibold text-ink-900">
                      {att.title || "Payment Stream"}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-accent-50 text-accent-700 border border-accent-100">
                      {att.category}
                    </span>
                    {att.clientConfirmed && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                        ✓ Client Confirmed (2x)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-ink-400 font-tabular flex-wrap">
                    <span>Paid: <strong className="text-ink-700">{formatEth(att.amountPaid)}</strong></span>
                    <span>&middot;</span>
                    <span>Recency: <strong className="text-ink-700">{att.scoreBreakdown?.recencyWindow} ({att.scoreBreakdown?.recencyMultiplier}x)</strong></span>
                    <span>&middot;</span>
                    <span>Minted: {formatDate(att.createdAt)}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-tabular font-bold text-accent-600 text-lg">
                    +{att.scoreBreakdown?.totalPoints || 0} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
