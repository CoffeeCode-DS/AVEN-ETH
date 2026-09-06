import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { api } from "../api/client.js";
import { formatEth, truncateAddress, formatDate } from "../utils/format.js";
import Avatar from "../components/Avatar.jsx";
import AvatarUploadModal from "../components/AvatarUploadModal.jsx";

export default function Profile() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [dashboard, setDashboard] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  useEffect(() => {
    api.dashboard().then(setDashboard).catch(() => {});
  }, []);

  const isClient = user.role === "CLIENT";

  function copyAddress() {
    if (!user?.walletAddress) return;
    navigator.clipboard.writeText(user.walletAddress);
    setCopied(true);
    toast.success("Wallet address copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AppLayout
      title="Profile & Identity"
      subtitle="Your on-chain cryptographic identity, Ethereum wallet parameters, and reputation metrics."
    >
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Main Profile Info (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Identity Header Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-2xl space-y-6">
            <div className="flex items-center gap-5 flex-wrap">
              <div
                className="relative group cursor-pointer shrink-0"
                onClick={() => setIsAvatarModalOpen(true)}
                title="Click to update profile photo"
              >
                <Avatar
                  user={user}
                  size="xl"
                  rounded="rounded-2xl"
                  showBorder
                  className="shadow-lg shadow-indigo-500/20"
                />
                <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center text-white text-[10px] font-mono font-medium">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 mb-0.5">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span>Edit</span>
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">{user.name}</h2>
                  <span className="text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-[#6366F1]/15 text-[#6366F1] dark:text-[#818CF8] uppercase tracking-wide border border-indigo-200 dark:border-indigo-500/30">
                    {user.role}
                  </span>
                  {!isClient && (
                    <Link
                      to="/reputation"
                      className="text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 transition-colors"
                    >
                      {dashboard?.stats?.reputationScore || 0} Rep Points
                    </Link>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">{user.title || (isClient ? "Engineering Client" : "Smart Contract Engineer")}</p>
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 text-[11px] font-mono font-medium transition-colors border border-slate-200 dark:border-white/[0.08]"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span>Change Photo / Avatar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4-Bento Parameter Grid */}
            <div className="grid sm:grid-cols-2 gap-3.5 pt-6 border-t border-slate-200 dark:border-white/[0.06] font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.06]">
                <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Account Email</p>
                <p className="font-semibold text-slate-900 dark:text-white mt-1 truncate">{user.email}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Ethereum Wallet</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1 truncate">{truncateAddress(user.walletAddress)}</p>
                </div>
                <button
                  type="button"
                  onClick={copyAddress}
                  className="px-2 py-1 rounded bg-slate-200 dark:bg-white/[0.06] hover:bg-slate-300 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 text-[11px] font-medium transition-all shrink-0 ml-2"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.06]">
                <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Available Balance</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-1">
                  {formatEth(dashboard?.stats?.walletBalance ?? 10.0)}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.06]">
                <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Member Since</p>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">{formatDate(user.createdAt)}</p>
              </div>
            </div>

            {!isClient && user.skills && user.skills.length > 0 && (
              <div className="pt-6 border-t border-slate-200 dark:border-white/[0.06]">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-mono">Verified Engineering Competencies</p>
                <div className="flex flex-wrap gap-2 font-mono text-xs">
                  {user.skills.map((s) => (
                    <span key={s} className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cryptographic Protocol Notice */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-indigo-200 dark:border-indigo-500/25 shadow-sm dark:shadow-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-[#6366F1] dark:text-[#818CF8]">
              <span className="h-2 w-2 rounded-full bg-[#6366F1] animate-pulse" />
              <span>Sidekick Consensus Identity Active</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              All payment stream contracts, time-tracked contribution sessions, Git commit diffs, and EAS skill attestations are permanently anchored to your wallet address: <strong className="font-mono text-slate-900 dark:text-white">{truncateAddress(user.walletAddress)}</strong>.
            </p>
          </div>
        </div>

        {/* Right Column (4 cols): Quick Metrics & Actions */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-2xl space-y-4">
            <p className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              On-Chain Activity Metrics
            </p>
            {dashboard ? (
              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.04]">
                  <span className="text-slate-500 dark:text-slate-400">Active Streams:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{dashboard.stats.activeProjects}</span>
                </div>
                {isClient ? (
                  <>
                    <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.04]">
                      <span className="text-slate-500 dark:text-slate-400">Locked in Escrow:</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">{formatEth(dashboard.stats.lockedInEscrow)}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.04]">
                      <span className="text-slate-500 dark:text-slate-400">Released / Paid:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatEth(dashboard.stats.released)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.04]">
                      <span className="text-slate-500 dark:text-slate-400">Claimable Now:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatEth(dashboard.stats.claimableStreamBalance || 0)}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.04]">
                      <span className="text-slate-500 dark:text-slate-400">Total Settled:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{formatEth(dashboard.stats.totalEarned)}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.04]">
                      <span className="text-slate-500 dark:text-slate-400">Reputation:</span>
                      <span className="font-bold text-[#6366F1] dark:text-[#818CF8]">{dashboard.stats.reputationScore || 0} pts</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="skeleton h-32 w-full rounded-xl" />
            )}
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-2xl space-y-3 font-mono">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Account Actions</p>
            <Link
              to="/wallet"
              className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#141414] text-slate-800 dark:text-slate-200 dark:hover:bg-[#1F1F1F] dark:hover:text-white border border-slate-200 dark:border-white/[0.08] text-xs font-medium uppercase tracking-wider transition-all flex items-center justify-center shadow-sm"
            >
              Manage Wallet &amp; Vault Funds &rarr;
            </Link>
            <button
              onClick={logout}
              className="w-full h-10 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 hover:bg-rose-100 dark:hover:bg-rose-500/25 text-xs font-medium uppercase tracking-wider transition-all"
            >
              Sign Out Account
            </button>
          </div>
        </div>
      </div>

      <AvatarUploadModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
      />
    </AppLayout>
  );
}

