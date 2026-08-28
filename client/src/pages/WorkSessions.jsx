import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import { api } from "../api/client.js";
import EmptyState from "../components/EmptyState.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import LoadingGrid from "../components/LoadingSkeleton.jsx";
import { formatDuration, formatEth } from "../utils/format.js";

export default function WorkSessions() {
  const [agreements, setAgreements] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .agreements()
      .then((res) => setAgreements(res.agreements))
      .catch((err) => setError(err.message));
  }, []);

  const withSessions = agreements?.filter((a) => a.session) || [];
  const active = agreements?.filter((a) => a.status === "IN_PROGRESS" && !a.session) || [];

  return (
    <AppLayout title="Work Sessions" subtitle="Time you've logged across every project.">
      {error && (
        <div className="rounded-xl bg-danger-50 border border-danger-100 px-4 py-3 text-sm text-danger-700 mb-6">
          {error}
        </div>
      )}

      {!agreements && !error && <LoadingGrid count={4} />}

      {agreements && withSessions.length === 0 && active.length === 0 && (
        <div className="card">
          <EmptyState
            title="No work sessions yet"
            message="Once you start a funded project, your time tracking sessions will show up here."
          />
        </div>
      )}

      {(withSessions.length > 0 || active.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...withSessions, ...active].map((a) => (
            <Link
              key={a.id}
              to={a.status === "IN_PROGRESS" ? `/agreements/${a.id}/work` : `/agreements/${a.id}`}
              className="card p-5 hover:shadow-popover hover:-translate-y-0.5 transition-all duration-200 block"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display font-semibold text-ink-900 text-[15px] truncate">{a.title}</h3>
                <StatusBadge status={a.session?.status || "IDLE"} />
              </div>
              <p className="text-sm text-ink-400 mt-1">{a.client?.name}</p>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-ink-400">Time logged</p>
                  <p className="font-tabular font-semibold text-ink-900">
                    {formatDuration(a.session?.accumulatedSeconds || 0)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink-400">Escrow</p>
                  <p className="font-tabular font-semibold text-ink-900">{formatEth(a.escrowBalance)}</p>
                </div>
              </div>

              {a.status === "IN_PROGRESS" && (
                <p className="text-sm font-medium text-accent mt-4 pt-4 border-t border-border-soft">
                  {a.session?.status === "RUNNING" ? "Session in progress \u2192" : "Continue \u2192"}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
