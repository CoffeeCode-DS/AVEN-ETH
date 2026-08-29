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
      <div className="flex items-start gap-3 font-mono text-xs">
        <div className="h-2.5 w-2.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
        <div>
          <p className="font-medium text-white">Stream cancelled &amp; refunded</p>
          <p className="text-slate-500 mt-0.5">{formatDateTime(agreement.updatedAt)}</p>
          {agreement.submission?.clientFeedback && (
            <p className="text-slate-300 mt-1.5 bg-rose-500/10 rounded-lg px-3 py-2 border border-rose-500/20">
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
    <div className="space-y-5 font-mono text-xs">
      {TIMELINE_ORDER.map((key, i) => {
        const done = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={key} className="flex items-start gap-3 relative">
            {i < TIMELINE_ORDER.length - 1 && (
              <span
                className={`absolute left-[4.5px] top-4 w-px h-[calc(100%+8px)] ${
                  done ? "bg-emerald-500/40" : "bg-white/[0.08]"
                }`}
              />
            )}
            <div
              className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 z-10 ${
                done ? "bg-emerald-400" : "bg-white/[0.15]"
              } ${isCurrent ? "ring-4 ring-emerald-500/20" : ""}`}
            />
            <div>
              <p className={`font-medium ${done ? "text-slate-200" : "text-slate-500"}`}>
                {TIMELINE_LABELS[key]}
              </p>
              {done && i === TIMELINE_ORDER.length - 1 && (
                <p className="text-[10px] text-slate-500 mt-0.5">{formatDateTime(agreement.updatedAt)}</p>
              )}
            </div>
          </div>
        );
      })}
      {agreement.status === "PAUSED" && (
        <div className="ml-5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-300 font-mono">
          Stream is currently paused by the client.
        </div>
      )}
      {agreement.status === "REVISION_REQUESTED" && (
        <div className="ml-5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-300 font-mono">
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
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-xs font-mono text-rose-400">
          {error}
        </div>
      </AppLayout>
    );
  }

  if (!agreement) {
    return (
      <AppLayout title="Payment Stream">
        <div className="skeleton h-40 w-full mb-4 rounded-2xl" />
        <div className="skeleton h-24 w-full rounded-2xl" />
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
        `Approved with ${rating}/5 rating! Attestation #${res.attestation?.id} minted on-chain.`
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
        className="text-xs font-mono text-slate-400 hover:text-white mb-5 inline-flex items-center gap-1 transition-colors"
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
          <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] shadow-xl">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-medium text-white">{agreement.title}</h2>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Category: <span className="text-[#818CF8]">{agreement.category}</span>
                </p>
              </div>
              <StatusBadge status={agreement.status} />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mt-4 font-sans">{agreement.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/[0.06] font-mono text-xs">
              <div>
                <p className="text-slate-500 text-[10px]">Total Stream Deposit</p>
                <p className="font-semibold text-white mt-0.5">{formatEth(agreement.budget)}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px]">Vault Escrow Balance</p>
                <p className="font-semibold text-emerald-400 mt-0.5">{formatEth(agreement.escrowBalance)}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px]">Deadline</p>
                <p className="font-medium text-slate-200 mt-0.5">{formatDate(agreement.deadline)}</p>
              </div>
            </div>
          </div>

          {/* Escrow visualization */}
          <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] shadow-xl">
            <p className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider mb-3">
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
            <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                  Minted EAS Attestations ({agreement.attestations.length})
                </p>
                <Link to="/attestations" className="text-xs font-mono text-[#818CF8] hover:underline">
                  View All &rarr;
                </Link>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {agreement.attestations.map((att) => (
                  <div key={att.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs font-mono">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#818CF8]">#{att.id}</span>
                        <span className="font-medium text-slate-200">{att.title || "Attestation"}</span>
                        {att.clientConfirmed && (
                          <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[10px]">
                            Confirmed
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 mt-0.5">
                        Paid: <strong className="text-white">{formatEth(att.amountPaid)}</strong> &middot; {formatDate(att.createdAt)}
                      </p>
                    </div>
                    <span className="text-slate-400 text-[11px] truncate max-w-[120px]">
                      {truncateAddress(att.reportHash)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cryptographic Proof & Git Range Inspector */}
          {(agreement.submission || agreement.session) && (
            <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                    Cryptographic Proof &amp; Git Inspector
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 font-sans">
                    Session commit range verified against Ethereum consensus ledger
                  </p>
                </div>
                {agreement.submission ? (
                  <StatusBadge status={agreement.submission.status} />
                ) : (
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Live Watcher Active
                  </span>
                )}
              </div>

              {agreement.submission?.description && (
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{agreement.submission.description}</p>
              )}

              {/* Verified Commit Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#141414] text-xs font-mono border border-white/[0.06]">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase tracking-wider mb-1">Base Commit Locked:</span>
                  <span className="font-semibold text-[#818CF8] break-all">
                    {agreement.submission?.baseCommit || agreement.session?.baseCommit || "0000000000000000000000000000000000000000"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase tracking-wider mb-1">Head Commit Recorded:</span>
                  <span className="font-semibold text-[#818CF8] break-all">
                    {agreement.submission?.headCommit || agreement.session?.headCommit || agreement.session?.baseCommit || "0000000000000000000000000000000000000000"}
                  </span>
                </div>
              </div>

              {/* Git Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-[#141414] text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">Git Branch</span>
                  <span className="font-semibold text-white">
                    {agreement.submission?.branch || agreement.session?.branch || "main"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Commits</span>
                  <span className="font-semibold text-white">
                    {agreement.submission?.commitsCount || agreement.session?.commitsCount || 0}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Files Modified</span>
                  <span className="font-semibold text-white">
                    {agreement.submission?.changedFilesCount || agreement.session?.changedFilesCount || 0}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Cumulative Diffs</span>
                  <span className="font-semibold text-emerald-400">
                    +{agreement.submission?.linesAdded || agreement.session?.linesAdded || 0}
                  </span>{" "}
                  /{" "}
                  <span className="font-semibold text-rose-400">
                    -{agreement.submission?.linesDeleted || agreement.session?.linesDeleted || 0}
                  </span>
                </div>
              </div>

              {(agreement.submission?.reportHash || agreement.session?.reportHash) && (
                <div className="text-xs font-mono bg-[#050505] p-3 rounded-xl border border-white/[0.06] space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#818CF8] font-semibold uppercase tracking-wider">
                      SHA-256 Merkle Session Hash:
                    </span>
                    <span className="text-emerald-400 font-semibold">
                      ✓ Consensus Verified
                    </span>
                  </div>
                  <p className="break-all text-slate-300">{agreement.submission?.reportHash || agreement.session?.reportHash}</p>
                </div>
              )}

              {agreement.submission?.deliverables?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {agreement.submission.deliverables.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-300 bg-white/[0.05] border border-white/[0.08] rounded-lg px-2.5 py-1.5"
                    >
                      <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 text-slate-400">
                        <path d="M9 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6l-4-4Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                      </svg>
                      {d}
                    </span>
                  ))}
                </div>
              )}

              {agreement.submission?.clientFeedback && (
                <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 font-sans">
                  <p className="text-xs font-mono font-semibold text-amber-300 uppercase tracking-wide mb-1">Client feedback</p>
                  <p className="text-xs text-slate-300">{agreement.submission.clientFeedback}</p>
                </div>
              )}
            </div>
          )}

          {/* Activity Timeline */}
          <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] shadow-xl">
            <p className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider mb-4">Activity Timeline</p>
            <Timeline agreement={agreement} />
          </div>
        </div>

        {/* Right column: parties + stream actions */}
        <div className="space-y-6">
          <SmartContractPanel agreement={agreement} />

          <div className="p-5 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] shadow-xl">
            <p className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider mb-3">Client (Sender)</p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#6366F1] text-white text-sm font-bold flex items-center justify-center">
                {agreement.client?.avatar || "C"}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-white text-sm truncate">{agreement.client?.name}</p>
                <p className="text-xs text-slate-400 font-mono">{truncateAddress(agreement.client?.walletAddress)}</p>
              </div>
            </div>
            <div className="h-px bg-white/[0.06] my-4" />
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider">Worker (Recipient)</p>
              {agreement.freelancer?.reputationScore > 0 && (
                <Link
                  to="/reputation"
                  className="text-[10px] font-mono font-medium text-[#818CF8] bg-[#6366F1]/15 px-2 py-0.5 rounded border border-indigo-500/30"
                >
                  Rep: {agreement.freelancer.reputationScore} pts
                </Link>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#6366F1] text-white text-sm font-bold flex items-center justify-center">
                {agreement.freelancer?.avatar || "F"}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-white text-sm truncate">{agreement.freelancer?.name}</p>
                <p className="text-xs text-slate-400 font-mono">{truncateAddress(agreement.freelancer?.walletAddress)}</p>
              </div>
            </div>
          </div>

          {/* Stream Actions */}
          <div className="p-5 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] shadow-xl space-y-3 font-mono">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">
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
                  <p className="text-xs text-slate-400 font-sans">Waiting for {agreement.freelancer?.name} to start the stream.</p>
                )}

                {agreement.status === "IN_PROGRESS" && (
                  <div className="space-y-2">
                    <button
                      className="btn-secondary w-full text-xs"
                      onClick={handlePauseStream}
                      disabled={pausing}
                    >
                      {pausing ? "Pausing..." : "Pause Stream"}
                    </button>
                    <button
                      className="h-10 px-4 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 w-full text-xs uppercase font-medium transition-all"
                      onClick={() => setDisputeOpen(true)}
                    >
                      Freeze &amp; Raise Dispute
                    </button>
                    <button
                      className="btn-danger w-full text-xs"
                      onClick={() => setCancelOpen(true)}
                    >
                      Cancel Stream &amp; Refund
                    </button>
                  </div>
                )}

                {agreement.status === "PAUSED" && (
                  <div className="space-y-2">
                    <button
                      className="btn-primary w-full text-xs"
                      onClick={handleResumeStream}
                      disabled={resuming}
                    >
                      {resuming ? "Resuming..." : "Resume Stream"}
                    </button>
                    <button
                      className="h-10 px-4 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 w-full text-xs uppercase font-medium transition-all"
                      onClick={() => setDisputeOpen(true)}
                    >
                      Freeze &amp; Raise Dispute
                    </button>
                    <button
                      className="btn-danger w-full text-xs"
                      onClick={() => setCancelOpen(true)}
                    >
                      Cancel Stream &amp; Refund
                    </button>
                  </div>
                )}

                {agreement.status === "DISPUTED" && (
                  <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-xs text-rose-300 space-y-2">
                    <p className="font-bold">Stream Frozen &amp; Disputed</p>
                    <p>{agreement.disputeReason || "Stream has been frozen by the client for mediation."}</p>
                    <button
                      className="btn-danger w-full mt-2 text-xs"
                      onClick={() => setCancelOpen(true)}
                    >
                      Settle &amp; Cancel Stream
                    </button>
                  </div>
                )}

                {agreement.status === "SUBMITTED" && (
                  <div className="space-y-2.5">
                    <button
                      className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-mono text-xs font-semibold uppercase tracking-wide transition-all shadow-md w-full"
                      onClick={() => setRatingModalOpen(true)}
                    >
                      Approve &amp; Mint Attestation
                    </button>
                    <button className="btn-secondary w-full text-xs" onClick={() => setRevisionOpen(true)}>
                      Request Revision
                    </button>
                    <button className="btn-danger w-full text-xs" onClick={() => setRejectOpen(true)}>
                      Reject Submission
                    </button>
                  </div>
                )}

                {agreement.status === "COMPLETED" && (
                  <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
                    <p className="font-semibold">Stream Fully Settled</p>
                    <p>Attestation minted and reputation score updated on-chain.</p>
                  </div>
                )}

                {agreement.status === "CANCELLED" && (
                  <p className="text-xs text-rose-400 font-sans">This stream was cancelled and unearned funds were refunded.</p>
                )}
              </>
            )}

            {!isClient && (
              <>
                {agreement.status === "PENDING_FUNDING" && (
                  <p className="text-xs text-slate-400 font-sans">Waiting for {agreement.client?.name} to fund the payment stream.</p>
                )}

                {agreement.status === "FUNDED" && (
                  <button className="btn-primary w-full text-xs" onClick={handleStartProject} disabled={startingProject}>
                    {startingProject && <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin mr-2" />}
                    {startingProject ? "Starting Project..." : "Accept & Open Work Session"}
                  </button>
                )}

                {(agreement.status === "IN_PROGRESS" || agreement.status === "PAUSED") && (
                  <div className="space-y-2">
                    <Link to={`/agreements/${agreement.id}/work`} className="btn-primary w-full text-center flex items-center justify-center gap-2 text-xs">
                      <span className={`h-2 w-2 rounded-full ${agreement.session?.status === "RUNNING" ? "bg-emerald-400 animate-ping" : "bg-white/40"}`} />
                      {agreement.session?.status === "RUNNING" ? "Open Active Work Session (Timer ON)" : "Open Work Session & Start Timer"}
                    </Link>
                  </div>
                )}

                {agreement.status === "SUBMITTED" && (
                  <p className="text-xs text-slate-400 font-sans">Waiting for {agreement.client?.name} to verify your submission.</p>
                )}

                {agreement.status === "COMPLETED" && (
                  <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
                    <p className="font-semibold">You earned {formatEth(agreement.budget)}</p>
                    <Link to="/reputation" className="text-[#818CF8] underline font-semibold mt-1 block">
                      View On-Chain Attestation &rarr;
                    </Link>
                  </div>
                )}

                {agreement.status === "CANCELLED" && (
                  <p className="text-xs text-rose-400 font-sans">This stream was cancelled.</p>
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
        <div className="rounded-xl bg-[#141414] p-4 border border-white/[0.06]">
          <EscrowFlow
            fromLabel={agreement.client?.avatar}
            fromName={agreement.client?.name}
            toLabel={agreement.freelancer?.avatar}
            toName={agreement.freelancer?.name}
            amount={formatEth(agreement.budget)}
            active
          />
        </div>
        <p className="text-xs text-slate-400 mt-4 font-mono">
          <strong className="text-white">{formatEth(agreement.budget)}</strong> will be locked in the AVEN Stream Contract and flow continuously as work is verified.
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
        <p className="text-xs text-slate-400 font-sans">
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
              className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs font-semibold uppercase tracking-wide transition-all shadow-md"
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
              className="h-10 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs font-semibold uppercase tracking-wide transition-all shadow-md"
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
        <p className="text-xs text-slate-400 mt-2 font-mono">
          Freezing immediately halts stream accrual and blocks on-demand withdrawals from the vault.
        </p>
        {actionError && <p className="field-error">{actionError}</p>}
      </Modal>
    </AppLayout>
  );
}
