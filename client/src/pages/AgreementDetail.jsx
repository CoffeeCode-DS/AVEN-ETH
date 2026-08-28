import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import EscrowFlow from "../components/EscrowFlow.jsx";
import SmartContractPanel from "../components/SmartContractPanel.jsx";
import Modal from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { formatEth, formatDate, formatDateTime, truncateAddress } from "../utils/format.js";

const TIMELINE_ORDER = ["PENDING_FUNDING", "FUNDED", "IN_PROGRESS", "SUBMITTED", "COMPLETED"];
const TIMELINE_LABELS = {
  PENDING_FUNDING: "Agreement created",
  FUNDED: "Escrow funded",
  IN_PROGRESS: "Work started",
  SUBMITTED: "Work submitted",
  COMPLETED: "Payment released",
};

function Timeline({ agreement }) {
  if (agreement.status === "CANCELLED") {
    return (
      <div className="flex items-start gap-3">
        <div className="h-2.5 w-2.5 rounded-full bg-danger-600 mt-1.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-ink-800">Agreement cancelled</p>
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
    agreement.status === "REVISION_REQUESTED" ? "IN_PROGRESS" : agreement.status
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
      {agreement.status === "REVISION_REQUESTED" || (agreement.submission?.status === "REVISION_REQUESTED") ? (
        <div className="ml-5 rounded-lg bg-warning-50 border border-warning-100 px-3 py-2.5 text-sm text-warning-700">
          Revision requested &mdash; freelancer is reworking the submission.
        </div>
      ) : null}
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
  const [approveOpen, setApproveOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState(null);
  const [startingProject, setStartingProject] = useState(false);

  function load() {
    api
      .agreement(id)
      .then((res) => setAgreement(res.agreement))
      .catch((err) => setError(err.message));
  }

  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <AppLayout title="Agreement">
        <div className="rounded-xl bg-danger-50 border border-danger-100 px-4 py-3 text-sm text-danger-700">
          {error}
        </div>
      </AppLayout>
    );
  }

  if (!agreement) {
    return (
      <AppLayout title="Agreement">
        <div className="skeleton h-40 w-full mb-4" />
        <div className="skeleton h-24 w-full" />
      </AppLayout>
    );
  }

  const isClient = user.role === "CLIENT";
  const escrowActive = ["FUNDED", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED"].includes(agreement.status);

  async function handleStartProject() {
    setStartingProject(true);
    try {
      await api.startProject(agreement.id);
      toast.success("Project started. Head to Work Sessions to begin tracking time.");
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStartingProject(false);
    }
  }

  async function handleRevisionSubmit() {
    if (feedback.trim().length < 5) {
      setActionError("Add a bit more detail so the freelancer knows what to change.");
      return;
    }
    try {
      await api.requestRevision(agreement.id, feedback.trim());
      toast.success("Revision requested. The freelancer has been notified.");
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

  return (
    <AppLayout title={agreement.title} subtitle={agreement.category}>
      <button onClick={() => navigate(-1)} className="text-sm text-ink-400 hover:text-ink-700 mb-5 inline-flex items-center gap-1">
        &larr; Back
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-display text-xl font-semibold text-ink-900">{agreement.title}</h2>
                <p className="text-sm text-ink-400 mt-1">{agreement.category}</p>
              </div>
              <StatusBadge status={agreement.status} />
            </div>
            <p className="text-[15px] text-ink-600 leading-relaxed mt-4">{agreement.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border-soft">
              <div>
                <p className="text-xs text-ink-400">Budget</p>
                <p className="font-tabular font-semibold text-ink-900 mt-0.5">{formatEth(agreement.budget)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-400">Escrow Balance</p>
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
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-3">Escrow Flow</p>
            <EscrowFlow
              fromLabel={agreement.client?.avatar}
              fromName={agreement.client?.name}
              toLabel={agreement.freelancer?.avatar}
              toName={agreement.freelancer?.name}
              amount={formatEth(agreement.budget)}
              active={escrowActive}
            />
            <p className="text-center text-xs text-ink-300 mt-2">
              {agreement.status === "PENDING_FUNDING" && "Awaiting funding \u2014 simulated escrow not yet locked."}
              {escrowActive && "Funds are locked in simulated escrow."}
              {agreement.status === "COMPLETED" && "Escrow released \u2014 project complete."}
              {agreement.status === "CANCELLED" && "Agreement cancelled."}
            </p>
          </div>

          {/* Submission (visible once one exists) */}
          {agreement.submission && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-ink-400 uppercase tracking-wide">Submission</p>
                <StatusBadge status={agreement.submission.status} />
              </div>
              <p className="text-[15px] text-ink-700 leading-relaxed">{agreement.submission.description}</p>
              {agreement.submission.deliverables?.length > 0 && (
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
              <p className="text-xs text-ink-400 mt-3">Submitted {formatDateTime(agreement.submission.submittedAt)}</p>

              {agreement.submission.clientFeedback && (
                <div className="mt-4 rounded-xl bg-warning-50 border border-warning-100 px-4 py-3">
                  <p className="text-xs font-semibold text-warning-700 uppercase tracking-wide mb-1">Client feedback</p>
                  <p className="text-sm text-ink-700">{agreement.submission.clientFeedback}</p>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="card p-6">
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-4">Activity</p>
            <Timeline agreement={agreement} />
          </div>
        </div>

        {/* Right column: parties + actions */}
        <div className="space-y-6">
          <SmartContractPanel agreement={agreement} />

          <div className="card p-5">
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-3">Client</p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-ink-900 text-white text-sm font-semibold flex items-center justify-center">
                {agreement.client?.avatar}
              </div>
              <div>
                <p className="font-medium text-ink-900 text-sm">{agreement.client?.name}</p>
                <p className="text-xs text-ink-400 font-tabular">{truncateAddress(agreement.client?.walletAddress)}</p>
              </div>
            </div>
            <div className="h-px bg-border-soft my-4" />
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-3">Freelancer</p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-ink-900 text-white text-sm font-semibold flex items-center justify-center">
                {agreement.freelancer?.avatar}
              </div>
              <div>
                <p className="font-medium text-ink-900 text-sm">{agreement.freelancer?.name}</p>
                <p className="text-xs text-ink-400 font-tabular">{truncateAddress(agreement.freelancer?.walletAddress)}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="card p-5">
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-4">
              {isClient ? "Client Actions" : "Freelancer Actions"}
            </p>

            {isClient && (
              <>
                {agreement.status === "PENDING_FUNDING" && (
                  <button className="btn-primary w-full" onClick={() => setFundOpen(true)}>
                    Fund Escrow
                  </button>
                )}
                {agreement.status === "FUNDED" && (
                  <p className="text-sm text-ink-400">Waiting for {agreement.freelancer?.name} to start work.</p>
                )}
                {agreement.status === "IN_PROGRESS" && (
                  <p className="text-sm text-ink-400">
                    {agreement.freelancer?.name} is working on this project.
                    {agreement.submission?.status === "REVISION_REQUESTED" && " Waiting on your requested revisions."}
                  </p>
                )}
                {agreement.status === "SUBMITTED" && (
                  <div className="space-y-2.5">
                    <button className="btn-success w-full" onClick={() => setApproveOpen(true)}>
                      Approve &amp; Release Payment
                    </button>
                    <button className="btn-secondary w-full" onClick={() => setRevisionOpen(true)}>
                      Request Revision
                    </button>
                    <button className="btn-danger w-full" onClick={() => setRejectOpen(true)}>
                      Reject
                    </button>
                  </div>
                )}
                {agreement.status === "COMPLETED" && (
                  <p className="text-sm text-success-700">Payment released. Project complete.</p>
                )}
                {agreement.status === "CANCELLED" && <p className="text-sm text-danger-600">This agreement was cancelled.</p>}
              </>
            )}

            {!isClient && (
              <>
                {agreement.status === "PENDING_FUNDING" && (
                  <p className="text-sm text-ink-400">Waiting for {agreement.client?.name} to fund escrow.</p>
                )}
                {agreement.status === "FUNDED" && (
                  <button className="btn-primary w-full" onClick={handleStartProject} disabled={startingProject}>
                    {startingProject && <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
                    {startingProject ? "Starting..." : "Start Project"}
                  </button>
                )}
                {agreement.status === "IN_PROGRESS" && (
                  <Link to={`/agreements/${agreement.id}/work`} className="btn-primary w-full">
                    {agreement.submission?.status === "REVISION_REQUESTED" ? "Resubmit Work" : "Continue Work"}
                  </Link>
                )}
                {agreement.status === "SUBMITTED" && (
                  <p className="text-sm text-ink-400">Waiting for {agreement.client?.name} to review your submission.</p>
                )}
                {agreement.status === "COMPLETED" && (
                  <p className="text-sm text-success-700">You earned {formatEth(agreement.budget)} on this project.</p>
                )}
                {agreement.status === "CANCELLED" && <p className="text-sm text-danger-600">This agreement was cancelled.</p>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Fund Escrow confirm */}
      <ConfirmDialog
        open={fundOpen}
        onClose={() => setFundOpen(false)}
        title="Fund Escrow"
        subtitle={agreement.title}
        confirmLabel="Confirm Funding"
        loadingLabel="Creating escrow..."
        onConfirm={async () => {
          await api.fundEscrow(agreement.id);
          toast.success("Escrow funded successfully.");
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
          <strong className="text-ink-900 font-tabular">{formatEth(agreement.budget)}</strong> will be simulated and
          locked in AVEN-ETH escrow until you approve the freelancer's work.
        </p>
      </ConfirmDialog>

      {/* Approve & release confirm */}
      <ConfirmDialog
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        title="Release Payment?"
        subtitle={agreement.title}
        tone="success"
        confirmLabel="Confirm Release"
        loadingLabel="Payment processing..."
        onConfirm={async () => {
          await api.approve(agreement.id);
          toast.success("Payment released.");
          setApproveOpen(false);
          load();
        }}
      >
        <p className="text-sm text-ink-600">
          <strong className="text-ink-900 font-tabular">{formatEth(agreement.budget)}</strong> will be released from
          simulated escrow to <strong className="text-ink-900">{agreement.freelancer?.name}</strong>.
        </p>
      </ConfirmDialog>

      {/* Request revision */}
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

      {/* Reject */}
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
              Reject Submission
            </button>
          </>
        }
      >
        <label className="field-label">Reason for rejection</label>
        <textarea
          rows={4}
          className={`input resize-none ${actionError ? "input-error" : ""}`}
          placeholder="This ends the agreement, so explain clearly why the work is being rejected..."
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setActionError(null);
          }}
        />
        {actionError && <p className="field-error">{actionError}</p>}
      </Modal>
    </AppLayout>
  );
}
