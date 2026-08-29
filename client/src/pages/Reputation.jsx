import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import { formatEth, formatDate, truncateAddress } from "../utils/format.js";

const CATEGORY_COLORS = {
  Grant: "text-purple-300 bg-purple-500/15 border-purple-500/30",
  Bounty: "text-amber-300 bg-amber-500/15 border-amber-500/30",
  Freelance: "text-blue-300 bg-blue-500/15 border-blue-500/30",
  Salary: "text-emerald-300 bg-emerald-500/15 border-emerald-500/30",
  AgentTask: "text-pink-300 bg-pink-500/15 border-pink-500/30",
  Subscription: "text-slate-300 bg-slate-500/15 border-slate-500/30",
};

export default function Reputation() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
          <div className="skeleton h-64 w-full rounded-2xl" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton h-32 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout title="On-Chain Reputation">
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-xs font-mono text-rose-400">
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
      subtitle="Portable, cryptographically-proven work metrics derived from Ethereum EAS attestations."
    >
      <div className="space-y-8">
        {/* Main Scorecard Hero */}
        <div className="p-8 rounded-2xl bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-white/[0.08] text-white relative overflow-hidden shadow-2xl">
          <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-[#6366F1]/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

          <div className="relative grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#6366F1]/15 text-[#818CF8] uppercase tracking-wider border border-indigo-500/30">
                  Verifiable Proof of Work
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {truncateAddress(repUser.walletAddress)}
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
                  {repUser.name}
                </h2>
                <p className="text-slate-400 text-xs mt-1 font-sans">
                  On-chain score computed continuously from immutable payment attestations and Git diff verifications.
                </p>
              </div>

              {/* Progress bar to 10,000 */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>Score Progress</span>
                  <span className="font-semibold text-[#818CF8]">
                    {reputation.totalScore.toLocaleString()} / {reputation.maxScore.toLocaleString()} pts ({reputation.scorePercentage}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-white/[0.08] rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.max(4, reputation.scorePercentage)}%` }}
                    className="h-full bg-gradient-to-r from-[#6366F1] to-[#818CF8] rounded-full transition-all duration-700 shadow-md shadow-indigo-500/50"
                  />
                </div>
              </div>

              {/* Quick metrics */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/[0.06] font-mono">
                <div>
                  <p className="text-xs text-slate-400">Attestations</p>
                  <p className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                    {reputation.totalAttestations}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Volume Settled</p>
                  <p className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                    {formatEth(reputation.totalVolumeEarned)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Confirmation Rate</p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-0.5">
                    100%
                  </p>
                </div>
              </div>
            </div>

            {/* Score Ring / Badge */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-[#050505]/80 border border-white/[0.08] text-center shadow-xl">
              <div className="relative flex items-center justify-center h-32 w-32 rounded-full border-2 border-indigo-500/40 bg-[#6366F1]/10">
                <div className="text-center">
                  <p className="font-mono text-3xl font-bold text-white">
                    {reputation.totalScore}
                  </p>
                  <p className="text-[10px] text-[#818CF8] font-mono font-medium tracking-wider uppercase mt-0.5">
                    Rep Score
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3 font-mono">
                Max protocol capacity: 10,000 pts
              </p>
            </div>
          </div>
        </div>

        {/* Recency Windows Explanation */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] border-l-2 !border-l-emerald-500 shadow-xl">
            <div className="flex items-center justify-between mb-1 font-mono">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Hot Window</span>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">150% Weight</span>
            </div>
            <p className="text-sm font-medium text-white font-mono mt-2">&lt; 7 Days Old</p>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              Active contributions: <strong className="text-slate-200">{reputation.recencyDistribution.Hot || 0}</strong> attestations
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] border-l-2 !border-l-amber-500 shadow-xl">
            <div className="flex items-center justify-between mb-1 font-mono">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Warm Window</span>
              <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">120% Weight</span>
            </div>
            <p className="text-sm font-medium text-white font-mono mt-2">7 &ndash; 50 Days Old</p>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              Recent contributions: <strong className="text-slate-200">{reputation.recencyDistribution.Warm || 0}</strong> attestations
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] border-l-2 !border-l-slate-500 shadow-xl">
            <div className="flex items-center justify-between mb-1 font-mono">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cold Window</span>
              <span className="text-[10px] bg-white/[0.08] text-slate-300 border border-white/[0.12] px-2 py-0.5 rounded-full font-medium">100% Weight</span>
            </div>
            <p className="text-sm font-medium text-white font-mono mt-2">&gt; 50 Days Old</p>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              Historical baseline: <strong className="text-slate-200">{reputation.recencyDistribution.Cold || 0}</strong> attestations
            </p>
          </div>
        </div>

        {/* Categorized Reputation Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-base text-white">
                Categorized Work Breakdown
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Points awarded based on volume, category multipliers, and explicit client approvals.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const catData = reputation.categoryBreakdown[cat] || { score: 0, count: 0, volume: 0 };
              const colorClass = CATEGORY_COLORS[cat] || "text-slate-300 bg-white/[0.08] border-white/[0.12]";

              return (
                <div key={cat} className="p-5 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] hover:border-indigo-500/40 transition-colors shadow-xl">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg border ${colorClass}`}>
                      {cat}
                    </span>
                    <span className="font-mono text-sm font-bold text-white">
                      {catData.score} pts
                    </span>
                  </div>

                  <dl className="space-y-1.5 text-xs font-mono text-slate-400 pt-2 border-t border-white/[0.06]">
                    <div className="flex justify-between">
                      <dt>Attestations</dt>
                      <dd className="font-medium text-slate-200">{catData.count}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Total Volume</dt>
                      <dd className="font-medium text-slate-200">{formatEth(catData.volume)}</dd>
                    </div>
                  </dl>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attestations Ledger */}
        <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-medium text-base text-white">
                Mined Attestations Feed
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Cryptographic proofs of paid work tied to this identity.
              </p>
            </div>
            <Link to="/attestations" className="text-xs font-mono text-[#818CF8] hover:underline">
              View Explorer &rarr;
            </Link>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {reputation.attestations.map((att) => (
              <div key={att.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-[#818CF8]">
                      #{att.id}
                    </span>
                    <span className="text-sm font-medium text-white">
                      {att.title || "Payment Stream"}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.08] text-slate-300 border border-white/[0.1]">
                      {att.category}
                    </span>
                    {att.clientConfirmed && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        Client Confirmed (2x)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono flex-wrap">
                    <span>Paid: <strong className="text-slate-200">{formatEth(att.amountPaid)}</strong></span>
                    <span>&middot;</span>
                    <span>Recency: <strong className="text-slate-200">{att.scoreBreakdown?.recencyWindow} ({att.scoreBreakdown?.recencyMultiplier}x)</strong></span>
                    <span>&middot;</span>
                    <span>Minted: {formatDate(att.createdAt)}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-[#818CF8] text-base">
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
