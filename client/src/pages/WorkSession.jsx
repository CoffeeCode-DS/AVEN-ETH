import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { formatEth, formatDuration, formatDate } from "../utils/format.js";

export default function WorkSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [agreement, setAgreement] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const tickRef = useRef(null);

  const [description, setDescription] = useState("");
  const [deliverablesText, setDeliverablesText] = useState("");
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api
      .agreement(id)
      .then((res) => setAgreement(res.agreement))
      .catch((err) => setError(err.message));
  }

  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live-ticking timer while the session is RUNNING.
  useEffect(() => {
    clearInterval(tickRef.current);
    if (!agreement?.session) return;
    const { status, accumulatedSeconds, startedAt } = agreement.session;

    function computeLive() {
      if (status === "RUNNING" && startedAt) {
        const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
        return accumulatedSeconds + Math.max(elapsed, 0);
      }
      return accumulatedSeconds;
    }

    setLiveSeconds(computeLive());
    if (status === "RUNNING") {
      tickRef.current = setInterval(() => setLiveSeconds(computeLive()), 1000);
    }
    return () => clearInterval(tickRef.current);
  }, [agreement]);

  async function runAction(action) {
    setBusy(true);
    try {
      const res = await api.workAction(agreement.id, action);
      setAgreement((prev) => ({ ...prev, session: res.session }));
      if (action === "start" || action === "resume") toast.success("Timer started.");
      if (action === "pause") toast.info("Session paused.");
      if (action === "stop") toast.success("Session stopped. Ready to submit for review.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit() {
    setSubmitError(null);
    if (description.trim().length < 10) {
      setSubmitError("Add a work summary of at least 10 characters.");
      return;
    }
    const deliverables = deliverablesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    setSubmitting(true);
    try {
      await api.submitWork(agreement.id, { description: description.trim(), deliverables });
      toast.success("Work submitted for client review.");
      navigate(`/agreements/${agreement.id}`);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <AppLayout title="Work Session">
        <div className="rounded-xl bg-danger-50 border border-danger-100 px-4 py-3 text-sm text-danger-700">
          {error}
        </div>
      </AppLayout>
    );
  }

  if (!agreement) {
    return (
      <AppLayout title="Work Session">
        <div className="skeleton h-64 w-full" />
      </AppLayout>
    );
  }

  if (agreement.status !== "IN_PROGRESS") {
    return (
      <AppLayout title={agreement.title}>
        <div className="card p-8 text-center max-w-md mx-auto mt-10">
          <StatusBadge status={agreement.status} className="mb-3" />
          <h2 className="font-display text-lg font-semibold text-ink-900">
            Work sessions are only available while a project is in progress.
          </h2>
          <Link to={`/agreements/${agreement.id}`} className="btn-primary mt-5 inline-flex">
            View Agreement
          </Link>
        </div>
      </AppLayout>
    );
  }

  const session = agreement.session;
  const status = session?.status || "IDLE";
  const estimatedEarnings = ((liveSeconds / 3600) * (agreement.freelancer?.hourlyRate || 0)) || 0;
  const showSubmissionForm = status === "STOPPED";
  const isRevision = agreement.submission?.status === "REVISION_REQUESTED";

  return (
    <AppLayout title={agreement.title} subtitle={agreement.client?.name}>
      <Link to={`/agreements/${agreement.id}`} className="text-sm text-ink-400 hover:text-ink-700 mb-5 inline-flex items-center gap-1">
        &larr; Back to agreement
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {isRevision && (
            <div className="rounded-xl bg-warning-50 border border-warning-100 px-4 py-3.5">
              <p className="text-xs font-semibold text-warning-700 uppercase tracking-wide mb-1">
                Revision requested
              </p>
              <p className="text-sm text-ink-700">{agreement.submission.clientFeedback}</p>
            </div>
          )}

          {/* Timer card */}
          <div className="card p-8 bg-navy-900 !border-navy-900 text-center relative overflow-hidden">
            <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
            <p className="relative text-xs font-semibold tracking-widest text-accent-400 uppercase mb-4">
              {status === "RUNNING" ? "Session Running" : status === "PAUSED" ? "Session Paused" : status === "STOPPED" ? "Session Stopped" : "Not Started"}
            </p>
            <p className="relative font-tabular text-5xl sm:text-6xl font-semibold text-white tracking-tight">
              {formatDuration(liveSeconds)}
            </p>
            <p className="relative text-white/40 text-sm mt-3">
              Est. earnings this session &middot; <span className="font-tabular text-white/70">{formatEth(estimatedEarnings)}</span>
            </p>

            <div className="relative flex items-center justify-center gap-3 mt-7">
              {(status === "IDLE" || status === "STOPPED") && !showSubmissionForm && (
                <button className="btn-primary" onClick={() => runAction("start")} disabled={busy}>
                  Start Work
                </button>
              )}
              {status === "PAUSED" && (
                <>
                  <button className="btn-primary" onClick={() => runAction("resume")} disabled={busy}>
                    Resume
                  </button>
                  <button className="btn-secondary !bg-transparent !text-white !border-white/20 hover:!bg-white/10" onClick={() => runAction("stop")} disabled={busy}>
                    Stop Session
                  </button>
                </>
              )}
              {status === "RUNNING" && (
                <>
                  <button className="btn-secondary !bg-transparent !text-white !border-white/20 hover:!bg-white/10" onClick={() => runAction("pause")} disabled={busy}>
                    Pause
                  </button>
                  <button className="btn-danger !bg-danger-600 !text-white !border-danger-600 hover:!bg-danger-700" onClick={() => runAction("stop")} disabled={busy}>
                    Stop Session
                  </button>
                </>
              )}
              {status === "STOPPED" && (
                <button className="btn-secondary !bg-transparent !text-white !border-white/20 hover:!bg-white/10" onClick={() => runAction("start")} disabled={busy}>
                  Log More Time
                </button>
              )}
            </div>
          </div>

          {/* Task description */}
          <div className="card p-6">
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-2">Task Description</p>
            <p className="text-[15px] text-ink-700 leading-relaxed">{agreement.description}</p>
          </div>

          {/* Submission form */}
          {showSubmissionForm && (
            <div className="card p-6 animate-fadeUp">
              <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-4">
                {isRevision ? "Resubmit Work" : "Submit Work for Review"}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="field-label">Work summary</label>
                  <textarea
                    rows={4}
                    className={`input resize-none ${submitError ? "input-error" : ""}`}
                    placeholder="Summarize what you completed and any notes for the client..."
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setSubmitError(null);
                    }}
                  />
                </div>
                <div>
                  <label className="field-label">Deliverables (comma-separated)</label>
                  <input
                    className="input"
                    placeholder="design-final.zip, notes.pdf"
                    value={deliverablesText}
                    onChange={(e) => setDeliverablesText(e.target.value)}
                  />
                </div>
                {submitError && <p className="field-error !mt-0">{submitError}</p>}
                <button className="btn-primary w-full" onClick={handleSubmit} disabled={submitting}>
                  {submitting && <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
                  {submitting ? "Submitting..." : "Submit for Client Review"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-3">Project</p>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-400">Client</dt>
                <dd className="font-medium text-ink-800">{agreement.client?.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-400">Deadline</dt>
                <dd className="font-medium text-ink-800">{formatDate(agreement.deadline)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-400">Escrow</dt>
                <dd className="font-tabular font-medium text-ink-800">{formatEth(agreement.escrowBalance)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-400">Hourly rate</dt>
                <dd className="font-tabular font-medium text-ink-800">{formatEth(agreement.freelancer?.hourlyRate || 0)}/hr</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-400">Status</dt>
                <dd><StatusBadge status={status} /></dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
