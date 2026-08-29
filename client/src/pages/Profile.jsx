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
    <AppLayout title="Profile" subtitle="Your account, wallet and reputation metrics.">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-ink-900 text-white text-xl font-semibold flex items-center justify-center shrink-0">
                {user.avatar}
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-xl font-semibold text-ink-900">{user.name}</h2>
                <p className="text-sm text-ink-400 mt-0.5">{user.title || (isClient ? "Client" : "Freelancer")}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-accent-50 text-accent-700 uppercase tracking-wide">
                    {user.role}
                  </span>
                  {!isClient && (
                    <Link
                      to="/reputation"
                      className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-colors"
                    >
                      ★ {dashboard?.stats?.reputationScore || 0} Rep Points
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-border-soft">
              <div>
                <p className="text-xs text-ink-400">Email</p>
                <p className="text-sm font-medium text-ink-800 mt-0.5">{user.email}</p>
              </div>
              <div>
                <p className="text-xs text-ink-400">Simulated Wallet Address</p>
                <p className="text-sm font-medium text-ink-800 font-tabular mt-0.5">{truncateAddress(user.walletAddress)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-400">Wallet Available Balance</p>
                <p className="text-sm font-bold text-emerald-600 font-tabular mt-0.5">
                  {formatEth(dashboard?.stats?.walletBalance ?? 10.0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-400">Member since</p>
                <p className="text-sm font-medium text-ink-800 mt-0.5">{formatDate(user.createdAt)}</p>
              </div>
              {!isClient && (
                <div>
                  <p className="text-xs text-ink-400">Hourly Rate</p>
                  <p className="text-sm font-medium text-ink-800 font-tabular mt-0.5">{formatEth(user.hourlyRate)}/hr</p>
                </div>
              )}
            </div>

            {!isClient && user.skills && (
              <div className="mt-6 pt-6 border-t border-border-soft">
                <p className="text-xs text-ink-400 mb-2.5">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((s) => (
                    <span key={s} className="text-xs font-medium px-2.5 py-1 rounded-full bg-ink-900/5 text-ink-600">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card p-6 border-accent-100 bg-accent-50/20">
            <p className="font-display font-semibold text-ink-900 mb-1">Aven On-Chain Protocol</p>
            <p className="text-sm text-ink-500 leading-relaxed">
              Every payment stream, time-tracked contribution, and client rating automatically produces cryptographic proof-of-work hashes and permanent attestations recorded on the Ethereum blockchain ledger.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-3">Quick Metrics</p>
            {dashboard ? (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-400">Active Streams</dt>
                  <dd className="font-medium text-ink-800">{dashboard.stats.activeProjects}</dd>
                </div>
                {isClient ? (
                  <>
                    <div className="flex justify-between">
                      <dt className="text-ink-400">Locked in Escrow</dt>
                      <dd className="font-tabular font-medium text-ink-800">{formatEth(dashboard.stats.lockedInEscrow)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-ink-400">Released Streamed</dt>
                      <dd className="font-tabular font-medium text-ink-800">{formatEth(dashboard.stats.released)}</dd>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <dt className="text-ink-400">Claimable Now</dt>
                      <dd className="font-tabular font-bold text-emerald-600">{formatEth(dashboard.stats.claimableStreamBalance || 0)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-ink-400">Total Settled</dt>
                      <dd className="font-tabular font-medium text-ink-800">{formatEth(dashboard.stats.totalEarned)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-ink-400">Reputation Score</dt>
                      <dd className="font-tabular font-bold text-accent">{dashboard.stats.reputationScore || 0} pts</dd>
                    </div>
                  </>
                )}
              </dl>
            ) : (
              <div className="skeleton h-20 w-full" />
            )}
          </div>

          <button onClick={logout} className="btn-secondary w-full">
            Log Out
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
