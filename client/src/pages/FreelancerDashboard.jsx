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
      subtitle="Track your projects, work sessions and earnings."
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
            <StatCard label="Active Projects" value={data.stats.activeProjects} />
            <StatCard label="In Progress" value={data.stats.inProgress} tone="accent" />
            <StatCard
              label="Pending Reviews"
              value={data.stats.pendingReviews}
              tone={data.stats.pendingReviews > 0 ? "warning" : "default"}
            />
            <StatCard label="Total Earned" value={formatEth(data.stats.totalEarned)} tone="success" />
          </div>

          {current && current.status === "IN_PROGRESS" && (
            <div className="card p-6 mb-8 bg-navy-900 !border-navy-900 relative overflow-hidden">
              <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-accent-400 uppercase mb-2">
                    Current Project
                  </p>
                  <h3 className="font-display text-xl font-semibold text-white">{current.title}</h3>
                  <p className="text-white/50 text-sm mt-1">
                    {current.client?.name} &middot; {formatEth(current.escrowBalance)} in escrow
                  </p>
                </div>
                <Link to={`/agreements/${current.id}/work`} className="btn-primary shrink-0">
                  Continue Work
                </Link>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-ink-900">Active Projects</h2>
            <Link to="/agreements" className="text-sm font-medium text-accent hover:underline">
              View all
            </Link>
          </div>

          {data.activeAgreements.length === 0 ? (
            <div className="card">
              <EmptyState
                title="No active projects"
                message="Once a client funds an agreement with you, it will show up here ready to start."
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
