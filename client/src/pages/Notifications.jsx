import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import { api } from "../api/client.js";
import EmptyState from "../components/EmptyState.jsx";
import LoadingGrid from "../components/LoadingSkeleton.jsx";
import { timeAgo } from "../utils/format.js";

const ICONS = {
  ESCROW_FUNDED: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#6366F1] dark:text-[#818CF8]">
      <path d="M12 2L3 7L12 12L21 7L12 2Z" />
    </svg>
  ),
  AGREEMENT_CREATED: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-500 dark:text-slate-300">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  PROJECT_STARTED: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-emerald-500">
      <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  WORK_SUBMITTED: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-sky-500">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  REVISION_REQUESTED: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-amber-500">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  PAYMENT_RELEASED: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-emerald-500">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  PROJECT_COMPLETED: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-emerald-500">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  DISPUTE_RAISED: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-rose-500">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("ALL");
  const [markingAll, setMarkingAll] = useState(false);

  function load() {
    api
      .notifications()
      .then((res) => setNotifications(res.notifications))
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function handleClick(n) {
    if (!n.read) {
      api.markNotificationRead(n.id).catch(() => {});
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    if (n.agreementId) navigate(`/agreements/${n.agreementId}`);
  }

  async function handleMarkAll() {
    setMarkingAll(true);
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silent
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const filtered = useMemo(() => {
    if (!notifications) return [];
    if (tab === "UNREAD") return notifications.filter((n) => !n.read);
    if (tab === "PAYMENTS") return notifications.filter((n) => ["ESCROW_FUNDED", "PAYMENT_RELEASED", "STREAM_CLAIMED"].includes(n.type));
    if (tab === "PROOFS") return notifications.filter((n) => ["WORK_SUBMITTED", "PROJECT_STARTED", "REVISION_REQUESTED"].includes(n.type));
    return notifications;
  }, [notifications, tab]);

  return (
    <AppLayout
      title="Notifications"
      subtitle="Real-time on-chain events across all stream vaults, Git proofs, and milestone settlements."
    >
      {/* 3-Bento Notification Stat Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 font-mono">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl">
          <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Total Events</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">{notifications?.length || 0}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Logged protocol events</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl">
          <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Unread Alerts</p>
          <p className="text-2xl font-bold text-[#6366F1] dark:text-[#818CF8] mt-1.5">{unreadCount}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Pending your attention</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl">
          <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Event Stream</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Synced
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Real-time localnet watcher</p>
        </div>
      </div>

      {/* Tabs & Mark All Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] rounded-xl p-1 overflow-x-auto shadow-sm dark:shadow-lg max-w-full font-mono text-xs">
          {[
            { key: "ALL", label: "All Events" },
            { key: "UNREAD", label: `Unread (${unreadCount})` },
            { key: "PAYMENTS", label: "Vaults & Payments" },
            { key: "PROOFS", label: "Git Proofs & Work" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                tab === t.key
                  ? "bg-[#6366F1] text-white shadow-md shadow-indigo-500/25"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={markingAll}
            className="h-9 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#141414] dark:hover:bg-[#1F1F1F] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] text-xs font-mono font-medium uppercase tracking-wider transition-all shadow-sm"
          >
            {markingAll ? "Marking..." : "Mark all as read"}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-xs font-mono text-rose-500 dark:text-rose-400 mb-6">
          {error}
        </div>
      )}

      {!notifications && !error && <LoadingGrid count={4} />}

      {notifications && filtered.length === 0 && (
        <div className="p-12 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl text-center">
          <EmptyState
            title="No notifications in this filter"
            message="You're all caught up on this category. Updates will appear as stream agreements proceed."
          />
        </div>
      )}

      {filtered.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] divide-y divide-slate-200 dark:divide-white/[0.06] overflow-hidden shadow-sm dark:shadow-xl">
          {filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors ${
                !n.read ? "bg-indigo-50/50 dark:bg-[#6366F1]/10" : ""
              }`}
            >
              <span className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] mt-0.5 shrink-0" aria-hidden="true">
                {ICONS[n.type] || (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-500 dark:text-slate-400">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  </svg>
                )}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="font-sans font-medium text-slate-900 dark:text-white text-sm truncate">{n.title}</p>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-[#6366F1] shadow-[0_0_6px_rgba(99,102,241,0.8)] shrink-0" />}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono shrink-0">{timeAgo(n.createdAt)}</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-sans leading-relaxed">{n.message}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
