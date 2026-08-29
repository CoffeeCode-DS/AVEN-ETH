import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import StatCard from "../components/StatCard.jsx";
import ProjectCard from "../components/ProjectCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LoadingGrid from "../components/LoadingSkeleton.jsx";
import { formatEth } from "../utils/format.js";
import { greeting, firstName } from "../utils/greeting.js";

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .dashboard()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  const current = data?.activeAgreements.find((a) => a.status === "IN_PROGRESS") || data?.activeAgreements[0];

  return (
    <AppLayout
      title={`Welcome to AVEN`}
      subtitle="Track your real-time payment streams, work sessions, and verified on-chain reputation."
    >
      {/* 1. Top Git CLI Alert / Quick Connect Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="h-9 w-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#818CF8] flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" x2="20" y1="19" y2="19" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              Launch local CLI watcher to stream code commits and auto-mint EAS attestations.
            </p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Run <code className="text-[#818CF8] bg-white/[0.06] px-1.5 py-0.5 rounded">aven watch</code> in your project repository
            </p>
          </div>
        </div>

        {current && (
          <Link
            to={`/agreements/${current.id}/work`}
            className="h-9 px-4 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white font-medium text-xs font-mono tracking-wider uppercase transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5 flex-shrink-0"
          >
            Launch Work Session &rarr;
          </Link>
        )}
      </div>

      {/* 2. 3 Bento Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* Card 1: Work Sessions & Proof */}
        <div className="p-5 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] flex flex-col justify-between shadow-xl hover:border-white/[0.14] transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-white/[0.06] text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
                <span className="text-xs font-mono text-slate-400">Time & Proof</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#6366F1]/15 text-[#818CF8] text-[10px] font-mono font-medium border border-indigo-500/30">
                Live
              </span>
            </div>
            <h3 className="text-base font-medium text-white mb-1.5">Stream Work Sessions</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Record verified git diff intervals and claim micro-payments directly from smart contract escrow.
            </p>
          </div>
          <Link
            to="/work-sessions"
            className="mt-6 w-full h-9 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white font-medium text-xs font-mono tracking-wide uppercase transition-all flex items-center justify-center shadow-md"
          >
            View Work Sessions
          </Link>
        </div>

        {/* Card 2: Wallet & Available Balance */}
        <div className="p-5 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] flex flex-col justify-between shadow-xl hover:border-white/[0.14] transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-white/[0.06] text-emerald-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </svg>
                </span>
                <span className="text-xs font-mono text-slate-400">Non-Custodial</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-medium border border-emerald-500/30">
                Instant
              </span>
            </div>
            <h3 className="text-base font-medium text-white mb-1.5">Settled Stream Balance</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Withdraw earned ETH to your external wallet address anytime with 1-click settlement transactions.
            </p>
          </div>
          <Link
            to="/wallet"
            className="mt-6 w-full h-9 rounded-xl bg-[#171717] hover:bg-[#1F1F1F] text-slate-200 border border-white/[0.08] font-medium text-xs font-mono tracking-wide uppercase transition-all flex items-center justify-center"
          >
            Open Wallet Hub
          </Link>
        </div>

        {/* Card 3: EAS Reputation Score */}
        <div className="p-5 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] flex flex-col justify-between shadow-xl hover:border-white/[0.14] transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-white/[0.06] text-amber-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </span>
                <span className="text-xs font-mono text-slate-400">EAS Attestations</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-mono font-medium border border-amber-500/30">
                10k Max
              </span>
            </div>
            <h3 className="text-base font-medium text-white mb-1.5">On-Chain Reputation</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Build an immutable developer resume backed by EAS cryptographic proofs and client reviews.
            </p>
          </div>
          <Link
            to="/reputation"
            className="mt-6 w-full h-9 rounded-xl bg-[#171717] hover:bg-[#1F1F1F] text-slate-200 border border-white/[0.08] font-medium text-xs font-mono tracking-wide uppercase transition-all flex items-center justify-center"
          >
            My Reputation
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-xs font-mono text-rose-400 mb-6">
          Unable to load dashboard data: {error}
        </div>
      )}

      {!data && !error && <LoadingGrid count={4} kind="stat" />}

      {data && (
        <>
          {/* 3. Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Active Streams" value={data.stats.activeProjects} />
            <StatCard
              label="Claimable Now"
              value={formatEth(data.stats.claimableStreamBalance || 0)}
              tone={data.stats.claimableStreamBalance > 0 ? "accent" : "default"}
              hint="Accrued from active streams"
            />
            <StatCard
              label="On-Chain Reputation"
              value={`${data.stats.reputationScore || 0} pts`}
              tone="success"
              hint={`${data.stats.totalAttestations || 0} verified attestations`}
            />
            <StatCard label="Total Settled" value={formatEth(data.stats.totalEarned)} tone="default" />
          </div>

          {/* Active Stream Highlight */}
          {current && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#141414] to-[#0A0A0A] border border-indigo-500/30 mb-8 relative overflow-hidden shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <p className="text-[11px] font-mono font-medium tracking-wider text-[#818CF8] uppercase">
                      ACTIVE PAYMENT STREAM
                    </p>
                  </div>
                  <h3 className="text-lg font-medium text-white">{current.title}</h3>
                  <p className="text-slate-400 text-xs mt-1 font-mono">
                    Client: {current.client?.name} &middot; {formatEth(current.escrowBalance)} locked in vault
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    to={`/agreements/${current.id}`}
                    className="h-9 px-4 rounded-xl bg-[#171717] hover:bg-[#1F1F1F] text-slate-200 border border-white/[0.08] font-medium text-xs font-mono tracking-wide uppercase transition-all flex items-center"
                  >
                    Stream Hub
                  </Link>
                  <Link
                    to={`/agreements/${current.id}/work`}
                    className="h-9 px-4 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white font-medium text-xs font-mono tracking-wide uppercase transition-all flex items-center shadow-md shadow-indigo-500/20"
                  >
                    Work Session &amp; Proof
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* 4. Payment Streams Header & Grid */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-white">Payment Streams</h2>
            <Link to="/agreements" className="text-xs font-mono text-[#818CF8] hover:underline">
              View all &rarr;
            </Link>
          </div>

          {data.activeAgreements.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] shadow-xl">
              <EmptyState
                title="No active payment streams"
                message="Once a client funds a stream for you, it will appear here ready to start earning."
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.activeAgreements.map((a) => (
                <ProjectCard key={a.id} agreement={a} role="FREELANCER" />
              ))}
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
