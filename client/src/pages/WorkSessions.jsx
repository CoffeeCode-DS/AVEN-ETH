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
    <AppLayout title="Work Sessions" subtitle="Cryptographic time logged and stream activity across projects.">
      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-xs font-mono text-rose-400 mb-6">
          {error}
        </div>
      )}

      {!agreements && !error && <LoadingGrid count={4} />}

      {agreements && withSessions.length === 0 && active.length === 0 && (
        <div className="p-12 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] shadow-xl">
          <EmptyState
            title="No work sessions yet"
            message="Once you start a funded project, your time tracking sessions and cryptographic Git Merkle proofs will show up here."
          />
        </div>
      )}

      {(withSessions.length > 0 || active.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 font-mono">
          {[...withSessions, ...active].map((a) => (
            <Link
              key={a.id}
              to={a.status === "IN_PROGRESS" ? `/agreements/${a.id}/work` : `/agreements/${a.id}`}
              className="p-5 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] hover:border-white/[0.18] transition-all duration-200 block shadow-xl"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-white text-sm truncate font-sans">{a.title}</h3>
                <StatusBadge status={a.session?.status || "IDLE"} />
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">{a.client?.name}</p>

              <div className="mt-4 flex items-center justify-between text-xs">
                <div>
                  <p className="text-[10px] text-slate-500">Time logged</p>
                  <p className="font-bold text-white">
                    {formatDuration(a.session?.accumulatedSeconds || 0)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500">Vault Escrow</p>
                  <p className="font-bold text-emerald-400">{formatEth(a.escrowBalance)}</p>
                </div>
              </div>

              {a.status === "IN_PROGRESS" && (
                <p className="text-xs font-semibold text-[#818CF8] mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <span>{a.session?.status === "RUNNING" ? "Session in progress" : "Continue work"}</span>
                  <span>&rarr;</span>
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
