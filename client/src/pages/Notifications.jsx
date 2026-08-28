import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import { api } from "../api/client.js";
import EmptyState from "../components/EmptyState.jsx";
import LoadingGrid from "../components/LoadingSkeleton.jsx";
import { timeAgo } from "../utils/format.js";

const ICONS = {
  ESCROW_FUNDED: "\ud83d\udd12",
  AGREEMENT_CREATED: "\ud83d\udcdd",
  PROJECT_STARTED: "\ud83d\ude80",
  WORK_SUBMITTED: "\ud83d\udce4",
  REVISION_REQUESTED: "\u270f\ufe0f",
  PAYMENT_RELEASED: "\ud83d\udcb0",
  PROJECT_COMPLETED: "\u2705",
  SUBMISSION_REJECTED: "\u26d4",
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
    <AppLayout title="Notifications" subtitle="Everything that's happened across your agreements.">
      {notifications && notifications.length > 0 && (
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-ink-400">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
          {unreadCount > 0 && (
            <button className="btn-ghost btn-sm" onClick={handleMarkAll} disabled={markingAll}>
              Mark all as read
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-danger-50 border border-danger-100 px-4 py-3 text-sm text-danger-700 mb-6">
          {error}
        </div>
      )}

      {!notifications && !error && <LoadingGrid count={4} />}

      {notifications && notifications.length === 0 && (
        <div className="card">
          <EmptyState title="No notifications yet" message="You'll see updates here as your projects progress." />
        </div>
      )}

      {notifications && notifications.length > 0 && (
        <div className="card divide-y divide-border-soft overflow-hidden">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`w-full text-left px-5 py-4 flex items-start gap-3.5 hover:bg-ink-900/[0.02] transition-colors ${
                !n.read ? "bg-accent-50/30" : ""
              }`}
            >
              <span className="text-lg mt-0.5 shrink-0" aria-hidden="true">
                {ICONS[n.type] || "\ud83d\udd14"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={`text-sm ${!n.read ? "font-semibold text-ink-900" : "font-medium text-ink-700"}`}>
                    {n.title}
                  </p>
                  {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />}
                </div>
                <p className="text-sm text-ink-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-ink-300 mt-1.5">{timeAgo(n.createdAt)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
