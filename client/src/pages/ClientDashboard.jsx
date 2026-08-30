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

export default function ClientDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .dashboard()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <AppLayout
      title={`Welcome to AVEN`}
      subtitle="Connect your tools, track real-time payment streams, and verify cryptographic work."
    >
      {/* 1. Top Git CLI Alert / Quick Connect Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm dark:shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-white/[0.05] border border-indigo-200 dark:border-white/[0.08] flex items-center justify-center text-[#6366F1] dark:text-[#818CF8] flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Connect your Git CLI watcher to stream code proof &amp; monitor live milestones.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Run <code className="text-[#6366F1] dark:text-[#818CF8] bg-slate-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded">aven watch --agreement [id]</code> locally
            </p>
          </div>
        </div>

        <Link
          to="/agreements/new"
          className="h-9 px-4 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white font-medium text-xs font-mono tracking-wider uppercase transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5 flex-shrink-0"
        >
          + New Agreement
        </Link>
      </div>

      {/* 2. 3 Bento Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* Card 1: Connect Git Provider */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] flex flex-col justify-between shadow-sm dark:shadow-xl hover:border-slate-300 dark:hover:border-white/[0.14] transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-900 dark:text-white">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">GitHub &middot; GitLab</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-[#6366F1]/15 text-[#6366F1] dark:text-[#818CF8] text-[10px] font-mono font-medium border border-indigo-200 dark:border-indigo-500/30">
                Required
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5">Connect Git CLI Watcher</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
              Monitor git diffs, commits, and cryptographic Merkle proofs automatically across your repo.
            </p>
          </div>
          <Link
            to="/security"
            className="mt-6 w-full h-9 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white font-medium text-xs font-mono tracking-wide uppercase transition-all flex items-center justify-center shadow-md"
          >
            + Connect CLI Watcher
          </Link>
        </div>

        {/* Card 2: Non-Custodial Stream Vaults */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] flex flex-col justify-between shadow-sm dark:shadow-xl hover:border-slate-300 dark:hover:border-white/[0.14] transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-white/[0.06] text-[#6366F1] dark:text-[#818CF8]">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M12 2L3 7L12 12L21 7L12 2Z" />
                  </svg>
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Vault Contract</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-medium border border-emerald-200 dark:border-emerald-500/30">
                Active
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5">Non-Custodial Stream Vaults</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
              Lock agreement funds safely in smart contracts and stream micro-payments to workers on every valid tick.
            </p>
          </div>
          <Link
            to="/agreements/new"
            className="mt-6 w-full h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#171717] dark:hover:bg-[#1F1F1F] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] font-medium text-xs font-mono tracking-wide uppercase transition-all flex items-center justify-center shadow-sm"
          >
            + Create Escrow
          </Link>
        </div>

        {/* Card 3: On-Chain Reputation */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] flex flex-col justify-between shadow-sm dark:shadow-xl hover:border-slate-300 dark:hover:border-white/[0.14] transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-white/[0.06] text-amber-600 dark:text-amber-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <circle cx="12" cy="8" r="6" />
                    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                  </svg>
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">EAS Protocol</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 text-[10px] font-mono font-medium border border-slate-200 dark:border-white/[0.1]">
                Beta
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5">Ethereum Attestation Engine</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
              Mint immutable EAS attestation credentials for completed milestones, git proofs, and client ratings.
            </p>
          </div>
          <Link
            to="/reputation"
            className="mt-6 w-full h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#171717] dark:hover:bg-[#1F1F1F] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] font-medium text-xs font-mono tracking-wide uppercase transition-all flex items-center justify-center shadow-sm"
          >
            View Reputation
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-xs font-mono text-rose-500 dark:text-rose-400 mb-6">
          Unable to load dashboard data: {error}
        </div>
      )}

      {!data && !error && <LoadingGrid count={5} kind="stat" />}

      {data && (
        <>
          {/* 3. Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <StatCard label="Active Streams" value={data.stats.activeProjects} />
            <StatCard label="Total Funded" value={formatEth(data.stats.totalFunded)} tone="accent" />
            <StatCard label="Locked in Escrow" value={formatEth(data.stats.lockedInEscrow)} tone="warning" />
            <StatCard label="Released" value={formatEth(data.stats.released)} tone="success" />
            <StatCard
              label="Pending Reviews"
              value={data.stats.pendingReviews}
              tone={data.stats.pendingReviews > 0 ? "warning" : "default"}
              hint={data.stats.pendingReviews > 0 ? "Needs attention" : undefined}
            />
          </div>

          {/* 4. What's New In AVEN Banner */}
          <div className="mb-8 p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-mono font-bold tracking-wider text-[#6366F1] dark:text-[#818CF8] uppercase">
                WHAT'S NEW IN AVEN &middot; NOW IN PROTOCOL v2.0
              </span>
            </div>
            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 font-sans">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 dark:text-slate-500">&bull;</span>
                <span>Match stream settlement rate to wall-clock bounds</span>
                <Link to="/agreements" className="text-[#6366F1] dark:text-[#818CF8] hover:underline font-mono ml-1">
                  &rarr; Configure rates
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 dark:text-slate-500">&bull;</span>
                <span>Track Git Merkle tree proofs for every commit diff</span>
                <Link to="/attestations" className="text-[#6366F1] dark:text-[#818CF8] hover:underline font-mono ml-1">
                  &rarr; View attestations
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 dark:text-slate-500">&bull;</span>
                <span>Non-custodial dispute freezes with zero-trust safety</span>
                <Link to="/security" className="text-[#6366F1] dark:text-[#818CF8] hover:underline font-mono ml-1">
                  &rarr; Explore security
                </Link>
              </div>
            </div>
          </div>

          {/* 5. Active Payment Streams Header & Grid */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Active Payment Streams</h2>
            <Link to="/agreements" className="text-xs font-mono text-[#6366F1] dark:text-[#818CF8] hover:underline">
              View all streams &rarr;
            </Link>
          </div>

          {data.activeAgreements.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl">
              <EmptyState
                title="No active payment streams yet"
                message="Create your first agreement to fund escrow and begin streaming micro-payments for verified work."
                action={
                  <Link
                    to="/agreements/new"
                    className="h-10 px-5 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white font-medium text-xs font-mono tracking-wide uppercase transition-all shadow-md shadow-indigo-500/20 inline-flex items-center"
                  >
                    + New Agreement
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.activeAgreements.map((a) => (
                <ProjectCard key={a.id} agreement={a} role="CLIENT" />
              ))}
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
