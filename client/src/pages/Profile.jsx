import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import { formatEth, truncateAddress, formatDate } from "../utils/format.js";

export default function Profile() {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    api.dashboard().then(setDashboard).catch(() => {});
  }, []);

  const isClient = user.role === "CLIENT";

  return (
    <AppLayout title="Profile & Account" subtitle="Your account credentials, wallet address, and on-chain metrics.">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] shadow-xl">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-[#6366F1] text-white text-xl font-bold flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25">
                {user.avatar || "AV"}
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-medium text-white">{user.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{user.title || (isClient ? "Client" : "Freelancer")}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-block text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-[#6366F1]/15 text-[#818CF8] uppercase tracking-wide border border-indigo-500/30">
                    {user.role}
                  </span>
                  {!isClient && (
                    <Link
                      to="/reputation"
                      className="text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
                    >
                      {dashboard?.stats?.reputationScore || 0} Rep Points
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/[0.06] font-mono text-xs">
              <div>
                <p className="text-slate-500 text-[10px]">Email</p>
                <p className="font-medium text-slate-200 mt-0.5">{user.email}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px]">Wallet Address</p>
                <p className="font-medium text-slate-200 mt-0.5">{truncateAddress(user.walletAddress)}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px]">Available Balance</p>
                <p className="font-bold text-emerald-400 mt-0.5">
                  {formatEth(dashboard?.stats?.walletBalance ?? 10.0)}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px]">Member since</p>
                <p className="font-medium text-slate-200 mt-0.5">{formatDate(user.createdAt)}</p>
              </div>
              {!isClient && (
                <div>
                  <p className="text-slate-500 text-[10px]">Hourly Rate</p>
                  <p className="font-medium text-slate-200 mt-0.5">{formatEth(user.hourlyRate)}/hr</p>
                </div>
              )}
            </div>

            {!isClient && user.skills && (
              <div className="mt-6 pt-6 border-t border-white/[0.06]">
                <p className="text-xs text-slate-400 mb-2.5 font-mono">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((s) => (
                    <span key={s} className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-300">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-indigo-500/25 shadow-xl">
            <p className="font-medium text-white text-sm mb-1">AVEN On-Chain Protocol</p>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Every payment stream, time-tracked contribution, and client rating automatically produces cryptographic proof-of-work hashes and permanent EAS attestations recorded on the local blockchain ledger.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] shadow-xl">
            <p className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Metrics</p>
            {dashboard ? (
              <dl className="space-y-3 text-xs font-mono">
                <div className="flex justify-between pb-2 border-b border-white/[0.06]">
                  <dt className="text-slate-400">Active Streams</dt>
                  <dd className="font-medium text-white">{dashboard.stats.activeProjects}</dd>
                </div>
                {isClient ? (
                  <>
                    <div className="flex justify-between pb-2 border-b border-white/[0.06]">
                      <dt className="text-slate-400">Locked in Escrow</dt>
                      <dd className="font-bold text-amber-400">{formatEth(dashboard.stats.lockedInEscrow)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Released Streamed</dt>
                      <dd className="font-bold text-emerald-400">{formatEth(dashboard.stats.released)}</dd>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between pb-2 border-b border-white/[0.06]">
                      <dt className="text-slate-400">Claimable Now</dt>
                      <dd className="font-bold text-emerald-400">{formatEth(dashboard.stats.claimableStreamBalance || 0)}</dd>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-white/[0.06]">
                      <dt className="text-slate-400">Total Settled</dt>
                      <dd className="font-bold text-white">{formatEth(dashboard.stats.totalEarned)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Reputation Score</dt>
                      <dd className="font-bold text-[#818CF8]">{dashboard.stats.reputationScore || 0} pts</dd>
                    </div>
                  </>
                )}
              </dl>
            ) : (
              <div className="skeleton h-20 w-full rounded-xl" />
            )}
          </div>

          <button
            onClick={logout}
            className="w-full h-10 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 font-mono text-xs font-medium uppercase transition-all shadow-md"
          >
            Log Out
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
