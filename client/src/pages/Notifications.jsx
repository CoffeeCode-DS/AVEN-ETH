import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import { api } from "../api/client.js";
import EmptyState from "../components/EmptyState.jsx";
import LoadingGrid from "../components/LoadingSkeleton.jsx";
import { timeAgo } from "../utils/format.js";

const ICONS = {
  ESCROW_FUNDED: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#818CF8]">
      <path d="M12 2L3 7L12 12L21 7L12 2Z" />
    </svg>
  ),
  AGREEMENT_CREATED: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-300">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  PROJECT_STARTED: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-emerald-400">
      <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  WORK_SUBMITTED: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-sky-400">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  REVISION_REQUESTED: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-amber-400">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  PAYMENT_RELEASED: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-emerald-400">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  PROJECT_COMPLETED: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-emerald-400">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  DISPUTE_RAISED: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-rose-400">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(null);
  const [error, setError] = useState(null);
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
      // silent — non-critical
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return (
    <AppLayout title="Notifications" subtitle="Everything that's happened across your stream vaults and agreements.">
      {notifications && notifications.length > 0 && (
        <div className="flex items-center justify-between mb-6 font-mono text-xs">
          <p className="text-slate-400">
            {unreadCount > 0 ? `${unreadCount} unread events` : "All caught up"}
          </p>
          {unreadCount > 0 && (
            <button
              className="text-[#818CF8] hover:underline"
              onClick={handleMarkAll}
              disabled={markingAll}
            >
              Mark all as read
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-xs font-mono text-rose-400 mb-6">
          {error}
        </div>
      )}

      {!notifications && !error && <LoadingGrid count={4} />}

      {notifications && notifications.length === 0 && (
        <div className="p-12 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] shadow-xl">
          <EmptyState title="No notifications yet" message="You'll see updates here as your payment streams progress." />
        </div>
      )}

      {notifications && notifications.length > 0 && (
        <div className="rounded-2xl bg-[#0A0A0A] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden shadow-xl">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`w-full text-left px-5 py-4 flex items-start gap-3.5 hover:bg-white/[0.04] transition-colors ${
                !n.read ? "bg-[#6366F1]/10" : ""
              }`}
            >
              <span className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.08] mt-0.5 shrink-0" aria-hidden="true">
                {ICONS[n.type] || (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-400">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  </svg>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-sans font-medium text-white text-sm truncate">{n.title}</p>
                  {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-[#6366F1] shrink-0" />}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-sans leading-relaxed">{n.message}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-1.5">{timeAgo(n.createdAt)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
