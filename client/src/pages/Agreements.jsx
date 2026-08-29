import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import ProjectCard from "../components/ProjectCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LoadingGrid from "../components/LoadingSkeleton.jsx";

const FILTERS = [
  { key: "ALL", label: "All Streams" },
  { key: "ACTIVE", label: "Active & Streaming" },
  { key: "SUBMITTED", label: "Awaiting Review" },
  { key: "COMPLETED", label: "Completed" },
];

export default function Agreements() {
  const { user } = useAuth();
  const [agreements, setAgreements] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    api
      .agreements()
      .then((res) => setAgreements(res.agreements))
      .catch((err) => setError(err.message));
  }, []);

  const filtered = useMemo(() => {
    if (!agreements) return [];
    if (filter === "ALL") return agreements;
    if (filter === "ACTIVE") return agreements.filter((a) => ["FUNDED", "IN_PROGRESS", "REVISION_REQUESTED"].includes(a.status));
    if (filter === "SUBMITTED") return agreements.filter((a) => a.status === "SUBMITTED");
    if (filter === "COMPLETED") return agreements.filter((a) => a.status === "COMPLETED");
    return agreements;
  }, [agreements, filter]);

  const isClient = user.role === "CLIENT";

  return (
    <AppLayout
      title={isClient ? "Payment Streams & Agreements" : "My Payment Streams"}
      subtitle={isClient ? "Every agreement you've created, funded, or streamed." : "Every project payment stream assigned to you."}
    >
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-1.5 bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-1 shadow-lg">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors whitespace-nowrap ${
                filter === f.key ? "bg-[#6366F1] text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {isClient && (
          <Link
            to="/agreements/new"
            className="h-10 px-4 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white font-medium text-xs font-mono tracking-wider uppercase transition-all shadow-md shadow-indigo-500/25 flex items-center gap-2"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
              <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            New Agreement
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-xs font-mono text-rose-400 mb-6">
          {error}
        </div>
      )}

      {!agreements && !error && <LoadingGrid count={6} />}

      {agreements && filtered.length === 0 && (
        <div className="p-12 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] shadow-xl">
          <EmptyState
            title="Nothing here yet"
            message={
              isClient
                ? "Agreements matching this filter will appear here."
                : "Projects matching this filter will appear here."
            }
          />
        </div>
      )}

      {filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a) => (
            <ProjectCard key={a.id} agreement={a} role={user.role} />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
