import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { formatEth, formatDuration, formatDate, truncateAddress } from "../utils/format.js";

export default function WorkSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [agreement, setAgreement] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const tickRef = useRef(null);

  // Work Mode: "CODE" (Git-based) vs "GENERAL" (Data entry, design, writing, research)
  const [workMode, setWorkMode] = useState("CODE");
  const [copiedCli, setCopiedCli] = useState(false);

  // Submission Form State
  const [description, setDescription] = useState("");
  const [deliverablesText, setDeliverablesText] = useState("");
  const [branch, setBranch] = useState("feature/work-session-1");
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api
      .agreement(id)
      .then((res) => {
        setAgreement(res.agreement);
        if (res.agreement?.session?.branch) {
          setBranch(res.agreement.session.branch);
        }
        // Auto-detect general work if category is not Freelance web dev
        if (["Grant", "Bounty", "Subscription", "AgentTask"].includes(res.agreement?.category)) {
          setWorkMode("GENERAL");
        }
      })
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
        return (accumulatedSeconds || 0) + Math.max(elapsed, 0);
      }
      return accumulatedSeconds || 0;
    }

    setLiveSeconds(computeLive());
    if (status === "RUNNING") {
      tickRef.current = setInterval(() => setLiveSeconds(computeLive()), 1000);
    }
    return () => clearInterval(tickRef.current);
  }, [agreement]);

  function copyCliCommand() {
    const cmd = `aven-eth watch --stream ${agreement?.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(cmd);
      setCopiedCli(true);
      setTimeout(() => setCopiedCli(null), 2000);
    }
  }

  async function runAction(action) {
    setBusy(true);
    try {
      const res = await api.workAction(agreement.id, action);
      setAgreement((prev) => ({ ...prev, session: res.session }));
      if (action === "start" || action === "resume") toast.success("Work tracking started.");
      if (action === "pause") toast.info("Work session paused.");
      if (action === "stop") toast.success("Session stopped. Cryptographic proof generated.");
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleClaimStream() {
    setClaiming(true);
    try {
      const res = await api.withdrawStream(agreement.id);
      toast.success(`Claimed ${formatEth(res.amountWithdrawn)}! Attestation #${res.attestation?.id} minted.`);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setClaiming(false);
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

    if (deliverableUrl.trim()) {
      deliverables.push(deliverableUrl.trim());
    }

    setSubmitting(true);
    try {
      await api.submitWork(agreement.id, {
        description: description.trim(),
        deliverables: deliverables.length ? deliverables : ["verified-milestone-deliverables.zip"],
        branch: workMode === "CODE" ? branch.trim() : "non-code/milestone-submission",
      });
      toast.success("Work & cryptographic proof submitted for client review.");
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

  if (!["IN_PROGRESS", "PAUSED"].includes(agreement.status)) {
    return (
      <AppLayout title={agreement.title}>
        <div className="card p-8 text-center max-w-md mx-auto mt-10">
          <StatusBadge status={agreement.status} className="mb-3" />
          <h2 className="font-display text-lg font-semibold text-ink-900">
            Work sessions are only available while a stream is in progress.
          </h2>
          <Link to={`/agreements/${agreement.id}`} className="btn-primary mt-5 inline-flex">
            View Stream
          </Link>
        </div>
      </AppLayout>
    );
  }

  const session = agreement.session;
  const status = session?.status || "IDLE";
  const ratePerSec = Number(agreement.ratePerSecond || 0.000004166);
  const liveEarnedThisSession = liveSeconds * ratePerSec;
  const availableToClaim = Number(agreement.availableAmount || 0);
  const showSubmissionForm = status === "STOPPED";
  const isRevision = agreement.submission?.status === "REVISION_REQUESTED";

  // Simulated metrics
  const commitsCount = Math.max(1, Math.floor(liveSeconds / 1800) + (session?.commitsCount || 0));
  const changedFilesCount = Math.max(1, Math.floor(liveSeconds / 3600) + 2);
  const linesAdded = Math.max(25, Math.floor(liveSeconds / 60) * 3);
  const linesDeleted = Math.max(4, Math.floor(linesAdded * 0.15));

  // General non-code metrics (e.g. data records, wireframe sheets)
  const itemsCompleted = Math.max(12, Math.floor(liveSeconds / 30));

  return (
    <AppLayout title={agreement.title} subtitle={`Client: ${agreement.client?.name} • Category: ${agreement.category}`}>
      <Link to={`/agreements/${agreement.id}`} className="text-sm text-ink-400 hover:text-ink-700 mb-5 inline-flex items-center gap-1">
        &larr; Back to stream
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

          {/* Terminal CLI Command Box */}
          <div className="card p-4 bg-slate-900 border-slate-800 text-white space-y-2">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                AVEN-ETH Session Watcher CLI
              </span>
              <button
                type="button"
                onClick={copyCliCommand}
                className="text-accent-400 hover:text-white font-mono transition-colors font-semibold"
              >
                {copiedCli ? "✓ Command Copied!" : "📋 Copy CLI Command"}
              </button>
            </div>
            <div className="bg-black/50 p-3 rounded-lg font-mono text-xs text-emerald-400 flex items-center justify-between overflow-x-auto">
              <code>aven-eth watch --stream {agreement.id}</code>
            </div>
          </div>

          {/* Work Mode Switcher */}
          <div className="flex items-center gap-2 p-1.5 bg-ink-900/[0.04] rounded-xl border border-border-soft">
            <button
              type="button"
              onClick={() => setWorkMode("CODE")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                workMode === "CODE"
                  ? "bg-navy-900 text-white shadow-sm"
                  : "text-ink-600 hover:text-ink-900"
              }`}
            >
              💻 Coding &amp; Git Repository Mode
            </button>
            <button
              type="button"
              onClick={() => setWorkMode("GENERAL")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                workMode === "GENERAL"
                  ? "bg-navy-900 text-white shadow-sm"
                  : "text-ink-600 hover:text-ink-900"
              }`}
            >
              📄 General Work / Non-Code Mode (Data Entry, Design, Writing)
            </button>
          </div>

          {/* Timer card */}
          <div className="card p-8 bg-navy-900 !border-navy-800 text-center relative overflow-hidden">
            <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

            <p className="relative text-xs font-semibold tracking-widest text-accent-400 uppercase mb-4">
              {status === "RUNNING"
                ? `⚡ ${workMode === "CODE" ? "Git Proof Tracking Active" : "General Work Session Active"}`
                : status === "PAUSED"
                ? "Session Paused"
                : status === "STOPPED"
                ? "Session Stopped & Proof Generated"
                : "Standby"}
            </p>

            <p className="relative font-tabular text-5xl sm:text-6xl font-bold text-white tracking-tight">
              {formatDuration(liveSeconds)}
            </p>

            <div className="relative flex items-center justify-center gap-4 text-xs text-white/60 mt-3 font-tabular">
              <span>Earned this session: <strong className="text-emerald-400">{formatEth(liveEarnedThisSession)}</strong></span>
              <span>&middot;</span>
              <span>Rate: <strong className="text-white/80">{formatEth(ratePerSec * 3600)}/hr</strong></span>
            </div>

            <div className="relative flex items-center justify-center gap-3 mt-7 flex-wrap">
              {(status === "IDLE" || status === "STOPPED") && (
                <button className="btn-primary" onClick={() => runAction("start")} disabled={busy}>
                  {status === "STOPPED" ? "Log More Time" : "Start Tracking Work"}
                </button>
              )}
              {status === "PAUSED" && (
                <>
                  <button className="btn-primary" onClick={() => runAction("resume")} disabled={busy}>
                    Resume Session
                  </button>
                  <button className="btn-secondary !bg-transparent !text-white !border-white/20 hover:!bg-white/10" onClick={() => runAction("stop")} disabled={busy}>
                    Stop Session &amp; Generate Proof
                  </button>
                </>
              )}
              {status === "RUNNING" && (
                <>
                  <button className="btn-secondary !bg-transparent !text-white !border-white/20 hover:!bg-white/10" onClick={() => runAction("pause")} disabled={busy}>
                    Pause
                  </button>
                  <button className="btn-danger !bg-danger-600 !text-white !border-danger-600 hover:!bg-danger-700" onClick={() => runAction("stop")} disabled={busy}>
                    Stop &amp; Generate Proof
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Proof of Work Activity Card */}
          {workMode === "CODE" ? (
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">
                  Cryptographic Git Proof Tracking
                </p>
                <span className="text-xs bg-accent-50 text-accent-700 px-2 py-0.5 rounded font-semibold border border-accent-100">
                  Privacy Protected (.avenignore)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                <div className="p-3 bg-ink-900/[0.02] rounded-xl border border-border-soft">
                  <span className="text-[11px] text-ink-400 block mb-1">Active Git Branch</span>
                  <span className="font-mono text-xs font-semibold text-ink-800 truncate block">
                    {branch}
                  </span>
                </div>
                <div className="p-3 bg-ink-900/[0.02] rounded-xl border border-border-soft">
                  <span className="text-[11px] text-ink-400 block mb-1">Commits Recorded</span>
                  <span className="font-tabular font-bold text-sm text-ink-900">
                    {commitsCount}
                  </span>
                </div>
                <div className="p-3 bg-ink-900/[0.02] rounded-xl border border-border-soft">
                  <span className="text-[11px] text-ink-400 block mb-1">Files Changed</span>
                  <span className="font-tabular font-bold text-sm text-ink-900">
                    {changedFilesCount}
                  </span>
                </div>
                <div className="p-3 bg-ink-900/[0.02] rounded-xl border border-border-soft">
                  <span className="text-[11px] text-ink-400 block mb-1">Line Diffs</span>
                  <span className="font-tabular font-semibold text-xs text-emerald-600">
                    +{linesAdded}
                  </span>{" "}
                  /{" "}
                  <span className="font-tabular font-semibold text-xs text-danger-600">
                    -{linesDeleted}
                  </span>
                </div>
              </div>

              {session?.reportHash && (
                <div className="p-3 bg-slate-900 rounded-xl text-xs font-mono text-white/80 space-y-1">
                  <p className="text-[10px] uppercase text-accent-400 font-semibold tracking-wider">
                    Mined Git Session SHA-256 Hash:
                  </p>
                  <p className="text-white break-all">{session.reportHash}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">
                  Milestone &amp; Non-Code Deliverable Tracking
                </p>
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold border border-emerald-100">
                  Data Entry / Design / Research
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
                <div className="p-3 bg-ink-900/[0.02] rounded-xl border border-border-soft">
                  <span className="text-[11px] text-ink-400 block mb-1">Task Category</span>
                  <span className="font-semibold text-xs text-ink-800">
                    {agreement.category || "General Work"}
                  </span>
                </div>
                <div className="p-3 bg-ink-900/[0.02] rounded-xl border border-border-soft">
                  <span className="text-[11px] text-ink-400 block mb-1">Items Processed</span>
                  <span className="font-tabular font-bold text-sm text-ink-900">
                    {itemsCompleted} items
                  </span>
                </div>
                <div className="p-3 bg-ink-900/[0.02] rounded-xl border border-border-soft">
                  <span className="text-[11px] text-ink-400 block mb-1">Active Duration</span>
                  <span className="font-tabular font-bold text-sm text-emerald-600">
                    {formatDuration(liveSeconds)}
                  </span>
                </div>
              </div>

              {session?.reportHash && (
                <div className="p-3 bg-slate-900 rounded-xl text-xs font-mono text-white/80 space-y-1">
                  <p className="text-[10px] uppercase text-emerald-400 font-semibold tracking-wider">
                    Mined Deliverable Integrity SHA-256 Hash:
                  </p>
                  <p className="text-white break-all">{session.reportHash}</p>
                </div>
              )}
            </div>
          )}

          {/* Submission form */}
          {showSubmissionForm && (
            <div className="card p-6 animate-fadeUp space-y-4">
              <p className="text-xs font-medium text-ink-400 uppercase tracking-wide">
                {isRevision ? "Resubmit Verified Work" : "Submit Work for Client Review & Attestation"}
              </p>
              <div className="space-y-4">
                {workMode === "CODE" ? (
                  <div>
                    <label className="field-label">Git Branch</label>
                    <input
                      type="text"
                      className="input"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="field-label">Deliverable URL / Link (Figma, Google Sheet, Notion, Docs)</label>
                    <input
                      type="url"
                      className="input"
                      placeholder="https://www.figma.com/file/... or https://docs.google.com/spreadsheets/..."
                      value={deliverableUrl}
                      onChange={(e) => setDeliverableUrl(e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <label className="field-label">Work Summary &amp; Milestone Notes</label>
                  <textarea
                    rows={4}
                    className={`input resize-none ${submitError ? "input-error" : ""}`}
                    placeholder={
                      workMode === "CODE"
                        ? "Summarize what you implemented, commits made, and architectural notes..."
                        : "Describe the completed deliverables (e.g. 500 entries verified in sheet, design system updated)..."
                    }
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setSubmitError(null);
                    }}
                  />
                </div>

                <div>
                  <label className="field-label">Attachments / Files (comma-separated)</label>
                  <input
                    className="input"
                    placeholder="data_export_v1.csv, design_assets.zip, summary.pdf"
                    value={deliverablesText}
                    onChange={(e) => setDeliverablesText(e.target.value)}
                  />
                </div>

                {submitError && <p className="field-error !mt-0">{submitError}</p>}
                <button className="btn-primary w-full" onClick={handleSubmit} disabled={submitting}>
                  {submitting && <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin mr-2" />}
                  {submitting ? "Submitting Proof..." : "Submit for Client Review"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Stream details & on-demand claim */}
        <div className="space-y-6">
          <div className="card p-5 space-y-4">
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wide">Stream Escrow Details</p>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-400">Client</dt>
                <dd className="font-medium text-ink-800">{agreement.client?.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-400">Category</dt>
                <dd className="font-medium text-accent">{agreement.category}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-400">Total Stream Budget</dt>
                <dd className="font-tabular font-medium text-ink-800">{formatEth(agreement.budget)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-400">Remaining in Vault</dt>
                <dd className="font-tabular font-medium text-ink-800">{formatEth(agreement.escrowBalance)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-400">Claimable Available</dt>
                <dd className="font-tabular font-bold text-emerald-600">{formatEth(availableToClaim)}</dd>
              </div>
            </dl>

            {availableToClaim > 0.0001 && (
              <button
                onClick={handleClaimStream}
                disabled={claiming}
                className="btn-success w-full text-xs font-semibold py-2.5"
              >
                {claiming ? "Mining Claim Tx..." : `Claim ${formatEth(availableToClaim)} Now`}
              </button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
