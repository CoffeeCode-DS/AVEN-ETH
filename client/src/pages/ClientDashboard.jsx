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

export default function ClientDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .dashboard()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <AppLayout
      title={`${greeting()}, ${firstName(user.name)}.`}
      subtitle="Manage your projects, escrow and freelancer payments."
    >
      <div className="flex items-center justify-end mb-6">
        <Link to="/agreements/new" className="btn-primary">
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          New Agreement
        </Link>
      </div>

      {error && (
        <div className="rounded-xl bg-danger-50 border border-danger-100 px-4 py-3 text-sm text-danger-700 mb-6">
          Unable to load your dashboard. {error}
        </div>
      )}

      {!data && !error && <LoadingGrid count={5} kind="stat" />}

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <StatCard label="Active Projects" value={data.stats.activeProjects} />
            <StatCard label="Total Funded" value={formatEth(data.stats.totalFunded)} tone="accent" />
            <StatCard label="Locked in Escrow" value={formatEth(data.stats.lockedInEscrow)} tone="warning" />
            <StatCard label="Released" value={formatEth(data.stats.released)} tone="success" />
            <StatCard
              label="Pending Reviews"
              value={data.stats.pendingReviews}
              tone={data.stats.pendingReviews > 0 ? "warning" : "default"}
              hint={data.stats.pendingReviews > 0 ? "Needs your attention" : undefined}
            />
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-ink-900">Active Projects</h2>
            <Link to="/agreements" className="text-sm font-medium text-accent hover:underline">
              View all
            </Link>
          </div>

          {data.activeAgreements.length === 0 ? (
            <div className="card">
              <EmptyState
                title="No active projects yet"
                message="Create your first agreement to fund escrow and bring a freelancer on board."
                action={
                  <Link to="/agreements/new" className="btn-primary">
                    + New Agreement
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.activeAgreements.map((a) => (
                <ProjectCard key={a.id} agreement={a} role="CLIENT" />
              ))}
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
