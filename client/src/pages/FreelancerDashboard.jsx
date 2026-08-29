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
      title={`${greeting()}, ${firstName(user.name)}.`}
      subtitle="Track your real-time payment streams, work sessions and on-chain reputation."
    >
      {error && (
        <div className="rounded-xl bg-danger-50 border border-danger-100 px-4 py-3 text-sm text-danger-700 mb-6">
          Unable to load your dashboard. {error}
        </div>
      )}

      {!data && !error && <LoadingGrid count={4} kind="stat" />}

      {data && (
        <>
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

          {current && (
            <div className="card p-6 mb-8 bg-navy-900 !border-navy-800 relative overflow-hidden text-white">
              <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <p className="text-xs font-semibold tracking-widest text-accent-400 uppercase">
                      Active Payment Stream
                    </p>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-white">{current.title}</h3>
                  <p className="text-white/50 text-sm mt-1 font-tabular">
                    Client: {current.client?.name} &middot; {formatEth(current.escrowBalance)} in vault
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link to={`/agreements/${current.id}`} className="btn-secondary !bg-white/10 !text-white !border-white/20 hover:!bg-white/20">
                    Stream Hub
                  </Link>
                  <Link to={`/agreements/${current.id}/work`} className="btn-primary">
                    Work Session &amp; Proof
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-ink-900">Payment Streams</h2>
            <Link to="/agreements" className="text-sm font-medium text-accent hover:underline">
              View all
            </Link>
          </div>

          {data.activeAgreements.length === 0 ? (
            <div className="card">
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
