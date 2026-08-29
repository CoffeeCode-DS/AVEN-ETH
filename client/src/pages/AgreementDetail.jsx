import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import EscrowFlow from "../components/EscrowFlow.jsx";
import SmartContractPanel from "../components/SmartContractPanel.jsx";
import StreamingMeter from "../components/StreamingMeter.jsx";
import RatingModal from "../components/RatingModal.jsx";
import Modal from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { formatEth, formatDate, formatDateTime, truncateAddress } from "../utils/format.js";

const TIMELINE_ORDER = ["PENDING_FUNDING", "FUNDED", "IN_PROGRESS", "SUBMITTED", "COMPLETED"];
const TIMELINE_LABELS = {
  PENDING_FUNDING: "Stream created",
  FUNDED: "Stream funded in escrow",
  IN_PROGRESS: "Payment streaming active",
  SUBMITTED: "Work & Git metrics submitted",
  COMPLETED: "Payment settled & attestation minted",
};

function Timeline({ agreement }) {
  if (agreement.status === "CANCELLED") {
    return (
      <div className="flex items-start gap-3">
        <div className="h-2.5 w-2.5 rounded-full bg-danger-600 mt-1.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-ink-800">Stream cancelled &amp; refunded</p>
          <p className="text-xs text-ink-400 mt-0.5">{formatDateTime(agreement.updatedAt)}</p>
          {agreement.submission?.clientFeedback && (
            <p className="text-sm text-ink-500 mt-1.5 bg-danger-50 rounded-lg px-3 py-2 border border-danger-100">
              {agreement.submission.clientFeedback}
            </p>
          )}
        </div>
      </div>
    );
  }

  const currentIdx = TIMELINE_ORDER.indexOf(
    agreement.status === "REVISION_REQUESTED" || agreement.status === "PAUSED"
      ? "IN_PROGRESS"
      : agreement.status
  );

  return (
    <div className="space-y-5">
      {TIMELINE_ORDER.map((key, i) => {
        const done = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={key} className="flex items-start gap-3 relative">
            {i < TIMELINE_ORDER.length - 1 && (
              <span
                className={`absolute left-[4.5px] top-4 w-px h-[calc(100%+8px)] ${
                  done ? "bg-success/40" : "bg-border"
                }`}
              />
            )}
            <div
              className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 z-10 ${
                done ? "bg-success" : "bg-ink-900/15"
              } ${isCurrent ? "ring-4 ring-success/15" : ""}`}
            />
            <div>
              <p className={`text-sm font-medium ${done ? "text-ink-800" : "text-ink-300"}`}>
                {TIMELINE_LABELS[key]}
              </p>
              {done && i === TIMELINE_ORDER.length - 1 && (
                <p className="text-xs text-ink-400 mt-0.5">{formatDateTime(agreement.updatedAt)}</p>
              )}
            </div>
          </div>
        );
      })}
      {agreement.status === "PAUSED" && (
        <div className="ml-5 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-800 font-medium">
          Stream is currently paused by the client.
        </div>
      )}
      {agreement.status === "REVISION_REQUESTED" && (
        <div className="ml-5 rounded-lg bg-warning-50 border border-warning-100 px-3 py-2 text-xs text-warning-700 font-medium">
          Revision requested &mdash; worker is updating contribution metrics.
        </div>
      )}
    </div>
  );
}

export default function AgreementDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [agreement, setAgreement] = useState(null);
  const [error, setError] = useState(null);
  const [fundOpen, setFundOpen] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputing, setDisputing] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState(null);
  const [startingProject, setStartingProject] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [resuming, setResuming] = useState(false);

  function load() {
    api
      .agreement(id)
      .then((res) => setAgreement(res.agreement))
      .catch((err) => setError(err.message));
  }

  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <AppLayout title="Payment Stream">
        <div className="rounded-xl bg-danger-50 border border-danger-100 px-4 py-3 text-sm text-danger-700">
          {error}
        </div>
      </AppLayout>
    );
  }

  if (!agreement) {
    return (
      <AppLayout title="Payment Stream">
        <div className="skeleton h-40 w-full mb-4" />
        <div className="skeleton h-24 w-full" />
      </AppLayout>
    );
  }

  const isClient = user.role === "CLIENT";
  const isFreelancer = user.role === "FREELANCER";
  const escrowActive = ["FUNDED", "IN_PROGRESS", "PAUSED", "SUBMITTED", "REVISION_REQUESTED"].includes(
    agreement.status
  );

  async function handleStartProject() {
    setStartingProject(true);
    try {
      await api.startProject(agreement.id);
      toast.success("Project stream activated! Opening Work Session...");
      navigate(`/agreements/${agreement.id}/work`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStartingProject(false);
    }
  }

  async function handlePauseStream() {
    setPausing(true);
    try {
      await api.pauseStream(agreement.id);
      toast.info("Payment stream paused.");
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPausing(false);
    }
  }

  async function handleResumeStream() {
    setResuming(true);
    try {
      await api.resumeStream(agreement.id);
      toast.success("Payment stream resumed!");
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setResuming(false);
    }
  }

  async function handleCancelStream() {
    try {
      const res = await api.cancelStream(agreement.id);
      toast.success(
        `Stream cancelled. ${formatEth(res.unearnedRefund)} refunded to your wallet.`
      );
      setCancelOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleClaimStream(amount) {
    setClaiming(true);
    try {
      const res = await api.withdrawStream(agreement.id, amount);
      toast.success(
        `Claimed ${formatEth(res.amountWithdrawn)}! Attestation #${res.attestation?.id} minted.`
      );
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setClaiming(false);
    }
  }

  async function handleApproveWithRating({ rating, review }) {
    try {
      const res = await api.approve(agreement.id, rating, review);
      toast.success(
        `Approved with ${rating}★! Attestation #${res.attestation?.id} minted on-chain.`
      );
      setRatingModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleRevisionSubmit() {
    if (feedback.trim().length < 5) {
      setActionError("Add a bit more detail so the worker knows what to change.");
      return;
    }
    try {
      await api.requestRevision(agreement.id, feedback.trim());
      toast.success("Revision requested. The worker has been notified.");
      setRevisionOpen(false);
      setFeedback("");
      setActionError(null);
      load();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleRejectSubmit() {
    if (reason.trim().length < 5) {
      setActionError("A reason is required to reject a submission.");
      return;
    }
    try {
      await api.reject(agreement.id, reason.trim());
      toast.success("Submission rejected.");
      setRejectOpen(false);
      setReason("");
      setActionError(null);
      load();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleDisputeSubmit() {
    if (disputeReason.trim().length < 5) {
      setActionError("A reason is required to freeze this stream and raise a dispute.");
      return;
    }
    setDisputing(true);
    try {
      await api.dispute(agreement.id, disputeReason.trim());
      toast.success("Stream frozen & dispute logged. Payouts are locked.");
      setDisputeOpen(false);
      setDisputeReason("");
      setActionError(null);
      load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setDisputing(false);
    }
  }

  return (
    <AppLayout title={agreement.title} subtitle={agreement.category}>
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-ink-400 hover:text-ink-700 mb-5 inline-flex items-center gap-1"
      >
        &larr; Back
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Real-Time Streaming Meter */}
          {agreement.status !== "PENDING_FUNDING" && (
            <StreamingMeter
              agreement={agreement}
              isFreelancer={isFreelancer}
              onClaim={handleClaimStream}
              claiming={claiming}
            />
          )}

          {/* Header card */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-display text-xl font-semibold text-ink-900">{agreement.title}</h2>
                <p className="text-sm text-ink-400 mt-1">
                  Category: <span className="font-medium text-accent">{agreement.category}</span>
                </p>
              </div>
              <StatusBadge status={agreement.status} />
            </div>
            <p className="text-[15px] text-ink-600 leading-relaxed mt-4">{agreement.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border-soft">
              <div>
                <p className="text-xs text-ink-400">Total Stream Deposit</p>
                <p className="font-tabular font-semibold text-ink-900 mt-0.5">{formatEth(agreement.budget)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-400">Vault Escrow Balance</p>
                <p className="font-tabular font-semibold text-ink-900 mt-0.5">{formatEth(agreement.escrowBalance)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-400">Deadline</p>
                <p className="font-medium text-ink-900 mt-0.5">{formatDate(agreement.deadline)}</p>
              </div>
            </div>
          </div>

          {/* Escrow visualization */}
          <div className="card p-6">
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-3">
              Stream Escrow Architecture
            </p>
            <EscrowFlow
              fromLabel={agreement.client?.avatar}
              fromName={agreement.client?.name}
              toLabel={agreement.freelancer?.avatar}
              toName={agreement.freelancer?.name}
              amount={formatEth(agreement.budget)}
              active={escrowActive}
            />
          </div>

          {/* Attestations list for this stream */}
          {agreement.attestations && agreement.attestations.length > 0 && (
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">
                  Minted Attestations ({agreement.attestations.length})
                </p>
                <Link to="/attestations" className="text-xs font-semibold text-accent hover:underline">
                  View All &rarr;
                </Link>
              </div>

              <div className="divide-y divide-border-soft">
                {agreement.attestations.map((att) => (
                  <div key={att.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-accent">#{att.id}</span>
                        <span className="font-medium text-ink-800">{att.title || "Attestation"}</span>
                        {att.clientConfirmed && (
                          <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                            Confirmed
                          </span>
                        )}
                      </div>
                      <p className="text-ink-400 mt-0.5 font-tabular">
                        Paid: <strong className="text-ink-700">{formatEth(att.amountPaid)}</strong> &middot; {formatDate(att.createdAt)}
                      </p>
                    </div>
                    <span className="font-mono text-ink-400 text-[11px] truncate max-w-[120px]">
                      {truncateAddress(att.reportHash)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cryptographic Proof & Git Range Inspector */}
          {(agreement.submission || agreement.session) && (
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">
                    Cryptographic Proof &amp; Git Inspector
                  </p>
                  <p className="text-xs text-ink-500 mt-0.5">
                    Session commit range verified against Ethereum consensus ledger
                  </p>
                </div>
                {agreement.submission ? (
                  <StatusBadge status={agreement.submission.status} />
                ) : (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Live Watcher Active
                  </span>
                )}
              </div>

              {agreement.submission?.description && (
                <p className="text-[15px] text-ink-700 leading-relaxed">{agreement.submission.description}</p>
              )}

              {/* Verified Commit Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-ink-900/[0.03] text-xs font-mono border border-border-soft">
                <div>
                  <span className="text-ink-400 text-[11px] block uppercase tracking-wider mb-1">Base Commit Locked:</span>
                  <span className="font-semibold text-ink-800 break-all">
                    {agreement.submission?.baseCommit || agreement.session?.baseCommit || "0000000000000000000000000000000000000000"}
                  </span>
                </div>
                <div>
                  <span className="text-ink-400 text-[11px] block uppercase tracking-wider mb-1">Head Commit Recorded:</span>
                  <span className="font-semibold text-ink-800 break-all">
                    {agreement.submission?.headCommit || agreement.session?.headCommit || agreement.session?.baseCommit || "0000000000000000000000000000000000000000"}
                  </span>
                </div>
              </div>

              {/* Git Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-ink-900/[0.03] text-xs font-tabular">
                <div>
                  <span className="text-ink-400 block">Git Branch</span>
                  <span className="font-semibold text-ink-800 font-mono">
                    {agreement.submission?.branch || agreement.session?.branch || "main"}
                  </span>
                </div>
                <div>
                  <span className="text-ink-400 block">Commits (Session)</span>
                  <span className="font-semibold text-ink-800">
                    {agreement.submission?.commitsCount || agreement.session?.commitsCount || 0}
                  </span>
                </div>
                <div>
                  <span className="text-ink-400 block">Files Modified</span>
                  <span className="font-semibold text-ink-800">
                    {agreement.submission?.changedFilesCount || agreement.session?.changedFilesCount || 0}
                  </span>
                </div>
                <div>
                  <span className="text-ink-400 block">Cumulative Diffs</span>
                  <span className="font-semibold text-emerald-600">
                    +{agreement.submission?.linesAdded || agreement.session?.linesAdded || 0}
                  </span>{" "}
                  /{" "}
                  <span className="font-semibold text-danger-600">
                    -{agreement.submission?.linesDeleted || agreement.session?.linesDeleted || 0}
                  </span>
                </div>
              </div>

              {(agreement.submission?.reportHash || agreement.session?.reportHash) && (
                <div className="text-xs font-mono text-ink-600 bg-slate-900 text-white/90 p-3 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-accent-400 font-semibold uppercase tracking-wider">
                      SHA-256 Merkle Session Hash:
                    </span>
                    <span className="text-emerald-400 font-sans font-semibold">
                      ✓ Consensus Verified
                    </span>
                  </div>
                  <p className="break-all text-white/80">{agreement.submission?.reportHash || agreement.session?.reportHash}</p>
                </div>
              )}

              {agreement.submission?.deliverables?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {agreement.submission.deliverables.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-600 bg-ink-900/[0.04] rounded-lg px-2.5 py-1.5"
                    >
                      <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                        <path d="M9 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6l-4-4Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                      </svg>
                      {d}
                    </span>
                  ))}
                </div>
              )}

              {agreement.submission?.clientFeedback && (
                <div className="mt-4 rounded-xl bg-warning-50 border border-warning-100 px-4 py-3">
                  <p className="text-xs font-semibold text-warning-700 uppercase tracking-wide mb-1">Client feedback</p>
                  <p className="text-sm text-ink-700">{agreement.submission.clientFeedback}</p>
                </div>
              )}
            </div>
          )}

          {/* Activity Timeline */}
          <div className="card p-6">
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-4">Activity</p>
            <Timeline agreement={agreement} />
          </div>
        </div>

        {/* Right column: parties + stream actions */}
        <div className="space-y-6">
          <SmartContractPanel agreement={agreement} />

          <div className="card p-5">
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-3">Client (Sender)</p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-ink-900 text-white text-sm font-semibold flex items-center justify-center">
                {agreement.client?.avatar}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-ink-900 text-sm truncate">{agreement.client?.name}</p>
                <p className="text-xs text-ink-400 font-tabular">{truncateAddress(agreement.client?.walletAddress)}</p>
              </div>
            </div>
            <div className="h-px bg-border-soft my-4" />
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-ink-400 uppercase tracking-wide">Worker (Recipient)</p>
              {agreement.freelancer?.reputationScore > 0 && (
                <Link
                  to="/reputation"
                  className="text-[11px] font-semibold text-accent bg-accent-50 px-2 py-0.5 rounded border border-accent-100"
                >
                  Rep: {agreement.freelancer.reputationScore} pts
                </Link>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-ink-900 text-white text-sm font-semibold flex items-center justify-center">
                {agreement.freelancer?.avatar}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-ink-900 text-sm truncate">{agreement.freelancer?.name}</p>
                <p className="text-xs text-ink-400 font-tabular">{truncateAddress(agreement.freelancer?.walletAddress)}</p>
              </div>
            </div>
          </div>

          {/* Stream Actions */}
          <div className="card p-5 space-y-3">
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-2">
              {isClient ? "Client Stream Controls" : "Worker Actions"}
            </p>

            {isClient && (
              <>
                {agreement.status === "PENDING_FUNDING" && (
                  <button className="btn-primary w-full" onClick={() => setFundOpen(true)}>
                    Fund Payment Stream
                  </button>
                )}

                {agreement.status === "FUNDED" && (
                  <p className="text-sm text-ink-400">Waiting for {agreement.freelancer?.name} to start the stream.</p>
                )}

                {agreement.status === "IN_PROGRESS" && (
                  <div className="space-y-2">
                    <button
                      className="btn-secondary w-full"
                      onClick={handlePauseStream}
                      disabled={pausing}
                    >
                      {pausing ? "Pausing..." : "Pause Stream"}
                    </button>
                    <button
                      className="btn-secondary w-full !text-amber-700 !border-amber-300 hover:!bg-amber-50"
                      onClick={() => setDisputeOpen(true)}
                    >
                      🛡️ Freeze &amp; Raise Dispute
                    </button>
                    <button
                      className="btn-danger w-full !bg-transparent !text-danger-600 hover:!bg-danger-50"
                      onClick={() => setCancelOpen(true)}
                    >
                      Cancel Stream &amp; Refund
                    </button>
                  </div>
                )}

                {agreement.status === "PAUSED" && (
                  <div className="space-y-2">
                    <button
                      className="btn-primary w-full"
                      onClick={handleResumeStream}
                      disabled={resuming}
                    >
                      {resuming ? "Resuming..." : "Resume Stream"}
                    </button>
                    <button
                      className="btn-secondary w-full !text-amber-700 !border-amber-300 hover:!bg-amber-50"
                      onClick={() => setDisputeOpen(true)}
                    >
                      🛡️ Freeze &amp; Raise Dispute
                    </button>
                    <button
                      className="btn-danger w-full !bg-transparent !text-danger-600 hover:!bg-danger-50"
                      onClick={() => setCancelOpen(true)}
                    >
                      Cancel Stream &amp; Refund
                    </button>
                  </div>
                )}

                {agreement.status === "DISPUTED" && (
                  <div className="p-3 bg-danger-50 rounded-xl border border-danger-200 text-xs text-danger-800 space-y-2">
                    <p className="font-bold">⚠️ Stream Frozen &amp; Disputed</p>
                    <p>{agreement.disputeReason || "Stream has been frozen by the client for mediation."}</p>
                    <button
                      className="btn-danger w-full mt-2"
                      onClick={() => setCancelOpen(true)}
                    >
                      Settle &amp; Cancel Stream
                    </button>
                  </div>
                )}

                {agreement.status === "SUBMITTED" && (
                  <div className="space-y-2.5">
                    <button
                      className="btn-success w-full font-semibold shadow-sm"
                      onClick={() => setRatingModalOpen(true)}
                    >
                      Approve &amp; Mint Attestation
                    </button>
                    <button className="btn-secondary w-full" onClick={() => setRevisionOpen(true)}>
                      Request Revision
                    </button>
                    <button className="btn-danger w-full" onClick={() => setRejectOpen(true)}>
                      Reject Submission
                    </button>
                  </div>
                )}

                {agreement.status === "COMPLETED" && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800 space-y-1">
                    <p className="font-semibold">Stream Fully Settled</p>
                    <p>Attestation minted and reputation score updated on-chain.</p>
                  </div>
                )}

                {agreement.status === "CANCELLED" && (
                  <p className="text-sm text-danger-600">This stream was cancelled and unearned funds were refunded.</p>
                )}
              </>
            )}

            {!isClient && (
              <>
                {agreement.status === "PENDING_FUNDING" && (
                  <p className="text-sm text-ink-400">Waiting for {agreement.client?.name} to fund the payment stream.</p>
                )}

                {agreement.status === "FUNDED" && (
                  <button className="btn-primary w-full" onClick={handleStartProject} disabled={startingProject}>
                    {startingProject && <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
                    {startingProject ? "Starting Project..." : "Accept & Open Work Session"}
                  </button>
                )}

                {(agreement.status === "IN_PROGRESS" || agreement.status === "PAUSED") && (
                  <div className="space-y-2">
                    <Link to={`/agreements/${agreement.id}/work`} className="btn-primary w-full text-center flex items-center justify-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${agreement.session?.status === "RUNNING" ? "bg-emerald-400 animate-ping" : "bg-white/40"}`} />
                      {agreement.session?.status === "RUNNING" ? "Open Active Work Session (Timer ON)" : "Open Work Session & Start Timer"}
                    </Link>
                  </div>
                )}

                {agreement.status === "SUBMITTED" && (
                  <p className="text-sm text-ink-400">Waiting for {agreement.client?.name} to verify your submission.</p>
                )}

                {agreement.status === "COMPLETED" && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800 space-y-1">
                    <p className="font-semibold">You earned {formatEth(agreement.budget)}</p>
                    <Link to="/reputation" className="text-accent underline font-semibold mt-1 block">
                      View On-Chain Attestation &rarr;
                    </Link>
                  </div>
                )}

                {agreement.status === "CANCELLED" && (
                  <p className="text-sm text-danger-600">This stream was cancelled.</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Fund Escrow confirm */}
      <ConfirmDialog
        open={fundOpen}
        onClose={() => setFundOpen(false)}
        title="Fund Stream Escrow"
        subtitle={agreement.title}
        confirmLabel="Confirm & Lock Deposit"
        loadingLabel="Locking in vault..."
        onConfirm={async () => {
          await api.fundEscrow(agreement.id);
          toast.success("Stream funded successfully.");
          setFundOpen(false);
          load();
        }}
      >
        <div className="rounded-xl bg-ink-900/[0.03] p-4">
          <EscrowFlow
            fromLabel={agreement.client?.avatar}
            fromName={agreement.client?.name}
            toLabel={agreement.freelancer?.avatar}
            toName={agreement.freelancer?.name}
            amount={formatEth(agreement.budget)}
            active
          />
        </div>
        <p className="text-sm text-ink-500 mt-4">
          <strong className="text-ink-900 font-tabular">{formatEth(agreement.budget)}</strong> will be locked in the Aven Stream Contract and flow continuously as work is verified.
        </p>
      </ConfirmDialog>

      {/* Cancel Stream Confirm */}
      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel Payment Stream?"
        subtitle={agreement.title}
        tone="danger"
        confirmLabel="Confirm Cancellation"
        loadingLabel="Refunding..."
        onConfirm={handleCancelStream}
      >
        <p className="text-sm text-ink-600">
          Cancelling will immediately halt stream flow, transfer any earned-but-unwithdrawn tokens to the worker, and return all remaining unearned tokens back to your wallet.
        </p>
      </ConfirmDialog>

      {/* Rating & Review Modal upon Approval */}
      <RatingModal
        open={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        agreement={agreement}
        onApprove={handleApproveWithRating}
      />

      {/* Request revision modal */}
      <Modal
        open={revisionOpen}
        onClose={() => {
          setRevisionOpen(false);
          setActionError(null);
        }}
        title="Request Revision"
        subtitle={agreement.title}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setRevisionOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleRevisionSubmit}>
              Request Revision
            </button>
          </>
        }
      >
        <label className="field-label">Revision feedback</label>
        <textarea
          rows={4}
          className={`input resize-none ${actionError ? "input-error" : ""}`}
          placeholder="Explain what needs to change before you can approve this submission..."
          value={feedback}
          onChange={(e) => {
            setFeedback(e.target.value);
            setActionError(null);
          }}
        />
        {actionError && <p className="field-error">{actionError}</p>}
      </Modal>

      {/* Reject modal */}
      <Modal
        open={rejectOpen}
        onClose={() => {
          setRejectOpen(false);
          setActionError(null);
        }}
        title="Reject Submission"
        subtitle={agreement.title}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setRejectOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-danger !text-white !bg-danger-600 !border-danger-600 hover:!bg-danger-700"
              onClick={handleRejectSubmit}
            >
              Reject &amp; Refund
            </button>
          </>
        }
      >
        <label className="field-label">Reason for rejection</label>
        <textarea
          rows={4}
          className={`input resize-none ${actionError ? "input-error" : ""}`}
          placeholder="This ends the stream and settles earned funds, so explain clearly..."
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setActionError(null);
          }}
        />
        {actionError && <p className="field-error">{actionError}</p>}
      </Modal>

      {/* Dispute modal */}
      <Modal
        open={disputeOpen}
        onClose={() => {
          setDisputeOpen(false);
          setActionError(null);
        }}
        title="Freeze Stream & Raise Dispute"
        subtitle={agreement.title}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDisputeOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-danger !text-white !bg-amber-600 !border-amber-600 hover:!bg-amber-700"
              onClick={handleDisputeSubmit}
              disabled={disputing}
            >
              {disputing ? "Freezing..." : "Freeze & Lock Stream"}
            </button>
          </>
        }
      >
        <label className="field-label">Reason for freezing / dispute</label>
        <textarea
          rows={4}
          className={`input resize-none ${actionError ? "input-error" : ""}`}
          placeholder="Explain the issue (e.g. inactive worker, fake metrics, scope breach)..."
          value={disputeReason}
          onChange={(e) => {
            setDisputeReason(e.target.value);
            setActionError(null);
          }}
        />
        <p className="text-xs text-ink-400 mt-2">
          🛡️ Freezing immediately halts stream accrual and blocks on-demand withdrawals from the vault.
        </p>
        {actionError && <p className="field-error">{actionError}</p>}
      </Modal>
    </AppLayout>
  );
}
