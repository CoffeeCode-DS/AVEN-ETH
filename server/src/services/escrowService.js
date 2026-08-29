import crypto from "crypto";
import { db } from "../data/store.js";
import { assertTransition } from "./stateMachine.js";
import { notify } from "./notificationService.js";
import { nextId, nowIso } from "../utils/simulate.js";
import { blockchain } from "./blockchainService.js";
import { computeReputation } from "./reputationService.js";

class DomainError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function sha256(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

export function recordTransaction(fields) {
  const id = nextId("txn");
  const block = blockchain.mineBlock({
    type: fields.type,
    agreementId: fields.agreementId,
    amount: fields.amount || 0,
    fromUser: fields.fromUser,
    toUser: fields.toUser,
    data: fields.data || null,
    txId: id,
  });
  return db.transactions.insert({
    id,
    status: "CONFIRMED",
    simulatedTxHash: `0x${block.hash}`,
    block: block.blockNumber,
    previousHash: `0x${block.previousHash}`,
    nonce: block.nonce,
    difficulty: block.difficulty,
    network: "AVEN-ETH Simulation Network",
    gas: "0.0000",
    timestamp: block.timestamp,
    ...fields,
  });
}

function touch(agreementId, patch) {
  return db.agreements.update(agreementId, { ...patch, updatedAt: nowIso() });
}

export function loadAgreementOr404(id) {
  const agreement = db.agreements.findById(id);
  if (!agreement) throw new DomainError("Agreement / Stream not found.", 404);
  return agreement;
}

// --- Streaming Calculations ---

export function computeEarned(agreement) {
  if (!agreement || ["PENDING_FUNDING"].includes(agreement.status)) return 0;
  if (agreement.status === "COMPLETED") return agreement.budget;

  const rate = Number(agreement.ratePerSecond || 0);
  if (rate <= 0) {
    return agreement.status === "COMPLETED" ? agreement.budget : (agreement.totalWithdrawn || 0);
  }

  // Earnings accrue strictly while worker logs active work session time
  const session = db.workSessions ? db.workSessions.findOne((s) => s.agreementId === agreement.id) : null;
  let sessionSec = 0;
  if (session) {
    sessionSec = session.accumulatedSeconds || 0;
    if (session.status === "RUNNING" && session.startedAt) {
      sessionSec += Math.max(0, (Date.now() - new Date(session.startedAt).getTime()) / 1000);
    }
  }

  const rawEarned = sessionSec * rate;
  const earned = Math.min(agreement.budget, Math.max(agreement.totalWithdrawn || 0, rawEarned));
  return Math.round(earned * 10000) / 10000;
}

export function computeAvailable(agreement) {
  if (!agreement) return 0;
  if (["PENDING_FUNDING", "CANCELLED"].includes(agreement.status)) return 0;
  const earned = computeEarned(agreement);
  const totalWithdrawn = Number(agreement.totalWithdrawn || 0);
  const available = Math.max(0, earned - totalWithdrawn);
  return Math.round(available * 10000) / 10000;
}

// --- Stream Lifecycle ---

export function createAgreement({
  clientId,
  freelancerId,
  title,
  description,
  category,
  budget,
  deadline,
  durationHours,
  ratePerSecond,
  checkpointCount,
  withdrawableCapPercent,
}) {
  if (!title || !title.trim()) throw new DomainError("Project title is required.");
  if (!freelancerId) throw new DomainError("Select a freelancer to continue.");
  if (!Number.isFinite(budget) || budget <= 0) throw new DomainError("Enter a valid budget greater than 0.");
  if (!deadline || new Date(deadline).getTime() <= Date.now()) {
    throw new DomainError("Deadline must be a valid date in the future.");
  }
  const freelancer = db.users.findById(freelancerId);
  if (!freelancer || freelancer.role !== "FREELANCER") {
    throw new DomainError("Selected freelancer is not valid.");
  }

  const hours = Number(durationHours) || Math.max(1, Math.round((new Date(deadline).getTime() - Date.now()) / (1000 * 3600)));
  const calculatedRate = Number(ratePerSecond) || budget / (hours * 3600);

  const agreement = db.agreements.insert({
    id: nextId("agr"),
    title: title.trim(),
    description: (description || "").trim(),
    category: category || "Freelance",
    clientId,
    freelancerId,
    budget,
    totalDeposited: 0,
    totalWithdrawn: 0,
    escrowBalance: 0,
    ratePerSecond: calculatedRate,
    durationSeconds: hours * 3600,
    checkpointCount: Number(checkpointCount) || 1,
    withdrawableCapPercent: Number(withdrawableCapPercent) || 100,
    deadline,
    status: "PENDING_FUNDING",
    startedAt: null,
    pausedAt: null,
    pausedDurationSeconds: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  notify(freelancerId, {
    type: "AGREEMENT_CREATED",
    title: "New stream drafted",
    message: `A new payment stream "${agreement.title}" is awaiting funding.`,
    agreementId: agreement.id,
  });

  return agreement;
}

export function fundEscrow(agreementId, clientId) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.clientId !== clientId) throw new DomainError("You cannot fund this agreement.", 403);
  assertTransition(agreement.status, "FUNDED");

  const client = db.users.findById(clientId);
  if (client && client.walletBalance !== undefined) {
    if (client.walletBalance < agreement.budget) {
      throw new DomainError("Insufficient wallet balance to fund this stream.");
    }
    db.users.update(clientId, { walletBalance: Math.round((client.walletBalance - agreement.budget) * 10000) / 10000 });
  }

  const updated = touch(agreementId, {
    status: "FUNDED",
    totalDeposited: agreement.budget,
    escrowBalance: agreement.budget,
    totalWithdrawn: 0,
  });

  const txn = recordTransaction({
    agreementId,
    fromUser: agreement.clientId,
    toUser: "ESCROW_CONTRACT",
    type: "STREAM_CREATED",
    amount: agreement.budget,
  });

  notify(agreement.freelancerId, {
    type: "STREAM_CREATED",
    title: "Payment stream funded",
    message: `Escrow stream for "${agreement.title}" has been funded (${agreement.budget} ETH). Work can begin.`,
    agreementId,
  });

  return { agreement: updated, transaction: txn };
}

export function startProject(agreementId, freelancerId) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.freelancerId !== freelancerId) throw new DomainError("This project is not assigned to you.", 403);
  assertTransition(agreement.status, "IN_PROGRESS");

  const startTime = nowIso();
  const updated = touch(agreementId, {
    status: "IN_PROGRESS",
    startedAt: agreement.startedAt || startTime,
    pausedDurationSeconds: agreement.pausedDurationSeconds || 0,
  });

  let session = db.workSessions.findOne((s) => s.agreementId === agreementId);
  if (!session) {
    session = db.workSessions.insert({
      id: nextId("ws"),
      agreementId,
      freelancerId,
      status: "IDLE",
      startedAt: null,
      accumulatedSeconds: 0,
      branch: "feature/main",
      commitsCount: 0,
      changedFilesCount: 0,
      linesAdded: 0,
      linesDeleted: 0,
      reportHash: null,
      notes: "Stream started.",
    });
  }

  notify(agreement.clientId, {
    type: "PROJECT_STARTED",
    title: "Worker started stream",
    message: `${agreement.title}: work and real-time streaming have begun.`,
    agreementId,
  });

  return { agreement: updated, session };
}

export function pauseStream(agreementId, clientId) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.clientId !== clientId) throw new DomainError("Only the client can pause this stream.", 403);
  if (agreement.status !== "IN_PROGRESS") throw new DomainError("Only an in-progress stream can be paused.");

  const pauseTime = nowIso();
  const updated = touch(agreementId, {
    status: "PAUSED",
    pausedAt: pauseTime,
  });

  // Also pause active session if running
  const session = db.workSessions.findOne((s) => s.agreementId === agreementId);
  if (session && session.status === "RUNNING") {
    const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
    db.workSessions.update(session.id, {
      status: "PAUSED",
      accumulatedSeconds: (session.accumulatedSeconds || 0) + Math.max(0, elapsed),
      startedAt: null,
    });
  }

  recordTransaction({
    agreementId,
    fromUser: clientId,
    toUser: "ESCROW_CONTRACT",
    type: "STREAM_PAUSED",
    amount: 0,
  });

  notify(agreement.freelancerId, {
    type: "STREAM_PAUSED",
    title: "Payment stream paused",
    message: `Client paused the stream for "${agreement.title}". Earning clock is temporarily halted.`,
    agreementId,
  });

  return { agreement: updated };
}

export function resumeStream(agreementId, clientId) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.clientId !== clientId) throw new DomainError("Only the client can resume this stream.", 403);
  if (agreement.status !== "PAUSED") throw new DomainError("Only a paused stream can be resumed.");

  let additionalPausedSec = 0;
  if (agreement.pausedAt) {
    additionalPausedSec = Math.floor((Date.now() - new Date(agreement.pausedAt).getTime()) / 1000);
  }

  const updated = touch(agreementId, {
    status: "IN_PROGRESS",
    pausedAt: null,
    pausedDurationSeconds: (agreement.pausedDurationSeconds || 0) + Math.max(0, additionalPausedSec),
  });

  recordTransaction({
    agreementId,
    fromUser: clientId,
    toUser: "ESCROW_CONTRACT",
    type: "STREAM_RESUMED",
    amount: 0,
  });

  notify(agreement.freelancerId, {
    type: "STREAM_RESUMED",
    title: "Payment stream resumed",
    message: `Client resumed the stream for "${agreement.title}". Earning clock is active.`,
    agreementId,
  });

  return { agreement: updated };
}

export function cancelStream(agreementId, clientId) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.clientId !== clientId) throw new DomainError("Only the client can cancel this stream.", 403);
  if (["COMPLETED", "CANCELLED"].includes(agreement.status)) {
    throw new DomainError("Stream is already finalized.");
  }

  const earned = computeEarned(agreement);
  const totalWithdrawn = Number(agreement.totalWithdrawn || 0);
  const unwithdrawnEarned = Math.max(0, earned - totalWithdrawn);
  const unearnedRefund = Math.max(0, agreement.budget - earned);

  // Credit earned remainder to freelancer
  const freelancer = db.users.findById(agreement.freelancerId);
  if (freelancer && unwithdrawnEarned > 0) {
    db.users.update(freelancer.id, {
      walletBalance: Math.round(((freelancer.walletBalance || 0) + unwithdrawnEarned) * 10000) / 10000,
    });
  }

  // Refund unearned amount to client
  const client = db.users.findById(clientId);
  if (client && unearnedRefund > 0) {
    db.users.update(clientId, {
      walletBalance: Math.round(((client.walletBalance || 0) + unearnedRefund) * 10000) / 10000,
    });
  }

  let attestation = null;
  if (unwithdrawnEarned > 0) {
    attestation = db.attestations.insert({
      id: nextId("att"),
      streamId: agreementId,
      recipient: agreement.freelancerId,
      sender: agreement.clientId,
      amountPaid: Math.round(unwithdrawnEarned * 10000) / 10000,
      kind: "WorkSession",
      category: agreement.category || "Freelance",
      clientConfirmed: false,
      autoReleased: true,
      activeDurationSeconds: Math.floor(unwithdrawnEarned / (agreement.ratePerSecond || 0.00001)),
      reportHash: sha256(`cancel-settle-${agreementId}-${Date.now()}`),
      title: `${agreement.title} (Cancellation Settlement)`,
      createdAt: nowIso(),
    });
  }

  const updated = touch(agreementId, {
    status: "CANCELLED",
    escrowBalance: 0,
    totalWithdrawn: Math.round((totalWithdrawn + unwithdrawnEarned) * 10000) / 10000,
  });

  recordTransaction({
    agreementId,
    fromUser: "ESCROW_CONTRACT",
    toUser: clientId,
    type: "STREAM_CANCELLED",
    amount: Math.round(unearnedRefund * 10000) / 10000,
    data: { refundedAmount: unearnedRefund, earnedPayout: unwithdrawnEarned },
  });

  notify(agreement.freelancerId, {
    type: "STREAM_CANCELLED",
    title: "Stream cancelled & settled",
    message: `${agreement.title}: stream was cancelled. ${unwithdrawnEarned.toFixed(4)} ETH earned was transferred to your wallet.`,
    agreementId,
  });

  return { agreement: updated, unearnedRefund, unwithdrawnEarned, attestation };
}

export function withdrawStreamed(agreementId, freelancerId, requestedAmount) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.freelancerId !== freelancerId) throw new DomainError("This stream is not assigned to you.", 403);
  if (["PENDING_FUNDING", "CANCELLED"].includes(agreement.status)) {
    throw new DomainError("Cannot withdraw from an un-funded or cancelled stream.");
  }

  const available = computeAvailable(agreement);
  if (available <= 0.000001) {
    throw new DomainError("No accrued stream earnings are currently available to claim.");
  }

  const amountToWithdraw = requestedAmount ? Math.min(available, Number(requestedAmount)) : available;
  if (amountToWithdraw <= 0) {
    throw new DomainError("Enter a valid withdrawal amount.");
  }

  const roundedAmount = Math.round(amountToWithdraw * 10000) / 10000;
  const newTotalWithdrawn = Math.round(((agreement.totalWithdrawn || 0) + roundedAmount) * 10000) / 10000;
  const newEscrowBalance = Math.max(0, Math.round((agreement.budget - newTotalWithdrawn) * 10000) / 10000);

  // Update freelancer wallet
  const freelancer = db.users.findById(freelancerId);
  if (freelancer) {
    db.users.update(freelancerId, {
      walletBalance: Math.round(((freelancer.walletBalance || 0) + roundedAmount) * 10000) / 10000,
    });
  }

  // Determine if stream is now fully completed
  const isFullyFinished = newTotalWithdrawn >= agreement.budget && agreement.status === "SUBMITTED";
  const updatedStatus = isFullyFinished ? "COMPLETED" : agreement.status;

  const updated = touch(agreementId, {
    totalWithdrawn: newTotalWithdrawn,
    escrowBalance: newEscrowBalance,
    status: updatedStatus,
  });

  // Mint on-chain AttestationRecord atomically
  const reportHash = sha256(`stream-claim-${agreementId}-${freelancerId}-${roundedAmount}-${Date.now()}`);
  const attestation = db.attestations.insert({
    id: nextId("att"),
    streamId: agreementId,
    recipient: freelancerId,
    sender: agreement.clientId,
    amountPaid: roundedAmount,
    kind: "WorkSession",
    category: agreement.category || "Freelance",
    clientConfirmed: false,
    autoReleased: false,
    activeDurationSeconds: Math.floor(roundedAmount / (agreement.ratePerSecond || 0.00001)),
    reportHash: `0x${reportHash}`,
    title: `${agreement.title} (Stream Claim)`,
    createdAt: nowIso(),
  });

  // Record atomic transaction block on blockchain
  const txn = recordTransaction({
    agreementId,
    fromUser: "ESCROW_CONTRACT",
    toUser: freelancerId,
    type: "STREAM_CLAIMED",
    amount: roundedAmount,
    data: {
      attestationId: attestation.id,
      category: agreement.category || "Freelance",
      reportHash: attestation.reportHash,
    },
  });

  notify(freelancerId, {
    type: "STREAM_CLAIMED",
    title: "Stream payout claimed",
    message: `You successfully claimed ${roundedAmount.toFixed(4)} ETH from "${agreement.title}". Attestation #${attestation.id} minted.`,
    agreementId,
  });

  notify(agreement.clientId, {
    type: "STREAM_CLAIMED",
    title: "Worker claimed streamed payout",
    message: `${freelancer?.name || "Worker"} claimed ${roundedAmount.toFixed(4)} ETH from "${agreement.title}".`,
    agreementId,
  });

  return { agreement: updated, transaction: txn, attestation, amountWithdrawn: roundedAmount };
}

// --- Work Session Actions with Git Metrics ---

export function workAction(agreementId, freelancerId, action) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.freelancerId !== freelancerId) throw new DomainError("This project is not assigned to you.", 403);
  if (!["IN_PROGRESS"].includes(agreement.status)) {
    throw new DomainError("You can only track time while the project is in progress.");
  }

  let session = db.workSessions.findOne((s) => s.agreementId === agreementId);
  if (!session) {
    session = db.workSessions.insert({
      id: nextId("ws"),
      agreementId,
      freelancerId,
      status: "IDLE",
      startedAt: null,
      accumulatedSeconds: 0,
      branch: "main",
      commitsCount: 0,
      changedFilesCount: 0,
      linesAdded: 0,
      linesDeleted: 0,
      reportHash: null,
      notes: "",
    });
  }

  const now = nowIso();

  if (action === "start" || action === "resume") {
    if (session.status === "RUNNING") throw new DomainError("Session is already running.");
    return db.workSessions.update(session.id, {
      status: "RUNNING",
      startedAt: now,
      branch: session.branch || "feature/work-stream",
    });
  }

  if (action === "pause") {
    if (session.status !== "RUNNING") throw new DomainError("Cannot pause a session that has not started.");
    const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
    const newAccumulated = (session.accumulatedSeconds || 0) + Math.max(elapsed, 0);
    return db.workSessions.update(session.id, {
      status: "PAUSED",
      accumulatedSeconds: newAccumulated,
      startedAt: null,
    });
  }

  if (action === "stop") {
    if (session.status === "IDLE") throw new DomainError("Cannot stop before starting work.");
    let accumulatedSeconds = session.accumulatedSeconds || 0;
    if (session.status === "RUNNING" && session.startedAt) {
      const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
      accumulatedSeconds += Math.max(elapsed, 0);
    }

    const commitsCount = Math.max(1, Math.floor(accumulatedSeconds / 1800) + (session.commitsCount || 0));
    const changedFilesCount = Math.max(1, Math.floor(accumulatedSeconds / 3600) + 2);
    const linesAdded = Math.max(20, Math.floor(accumulatedSeconds / 60) * 3);
    const linesDeleted = Math.max(5, Math.floor(linesAdded * 0.15));

    const reportHash = `0x${sha256(
      JSON.stringify({
        agreementId,
        freelancerId,
        accumulatedSeconds,
        commitsCount,
        changedFilesCount,
        linesAdded,
        linesDeleted,
        stoppedAt: now,
      })
    )}`;

    return db.workSessions.update(session.id, {
      status: "STOPPED",
      startedAt: null,
      accumulatedSeconds,
      commitsCount,
      changedFilesCount,
      linesAdded,
      linesDeleted,
      reportHash,
    });
  }

  throw new DomainError("Unknown work session action.");
}

// --- Submission ---

export function submitWork(agreementId, freelancerId, { description, deliverables, branch }) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.freelancerId !== freelancerId) throw new DomainError("This project is not assigned to you.", 403);
  assertTransition(agreement.status, "SUBMITTED");

  if (!description || description.trim().length < 10) {
    throw new DomainError("Add a work summary of at least 10 characters before submitting.");
  }

  const session = db.workSessions.findOne((s) => s.agreementId === agreementId);
  if (!session || session.status === "IDLE") {
    throw new DomainError("You must start and log work before submitting.");
  }
  if (session.status === "RUNNING") {
    throw new DomainError("Stop your active work session before submitting.");
  }

  const reportHash =
    session.reportHash ||
    `0x${sha256(
      JSON.stringify({
        agreementId,
        freelancerId,
        description: description.trim(),
        submittedAt: nowIso(),
      })
    )}`;

  const existing = db.submissions.findOne((s) => s.agreementId === agreementId);
  let submission;
  if (existing) {
    submission = db.submissions.update(existing.id, {
      description: description.trim(),
      deliverables: deliverables && deliverables.length ? deliverables : existing.deliverables,
      branch: branch || session.branch || "main",
      commitsCount: session.commitsCount || 1,
      changedFilesCount: session.changedFilesCount || 1,
      linesAdded: session.linesAdded || 50,
      linesDeleted: session.linesDeleted || 10,
      reportHash,
      submittedAt: nowIso(),
      status: "PENDING_REVIEW",
      revisionCount: existing.revisionCount + (existing.status === "REVISION_REQUESTED" ? 1 : 0),
    });
  } else {
    submission = db.submissions.insert({
      id: nextId("sub"),
      agreementId,
      freelancerId,
      description: description.trim(),
      deliverables: deliverables && deliverables.length ? deliverables : ["deliverables.zip"],
      branch: branch || session.branch || "main",
      commitsCount: session.commitsCount || 1,
      changedFilesCount: session.changedFilesCount || 1,
      linesAdded: session.linesAdded || 50,
      linesDeleted: session.linesDeleted || 10,
      reportHash,
      submittedAt: nowIso(),
      status: "PENDING_REVIEW",
      revisionCount: 0,
      clientFeedback: null,
    });
  }

  const updated = touch(agreementId, { status: "SUBMITTED" });

  recordTransaction({
    agreementId,
    fromUser: freelancerId,
    toUser: agreement.clientId,
    type: "WORK_SUBMITTED",
    amount: 0,
    data: { reportHash },
  });

  notify(agreement.clientId, {
    type: "WORK_SUBMITTED",
    title: "New verified submission ready for review",
    message: `Work was submitted for "${agreement.title}" with cryptographic Git report.`,
    agreementId,
  });

  return { agreement: updated, submission };
}

// --- Client Review & Attestation Minting ---

export function approveAndRelease(agreementId, clientId, { rating = 5, review = "" } = {}) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.clientId !== clientId) throw new DomainError("You cannot review this agreement.", 403);
  assertTransition(agreement.status, "COMPLETED");

  const existingSubmission = db.submissions.findOne((s) => s.agreementId === agreementId);
  if (existingSubmission) {
    db.submissions.update(existingSubmission.id, { status: "APPROVED" });
  }

  const totalWithdrawn = Number(agreement.totalWithdrawn || 0);
  const remainingPayout = Math.max(0, Math.round((agreement.budget - totalWithdrawn) * 10000) / 10000);

  // Credit remaining balance to freelancer
  const freelancer = db.users.findById(agreement.freelancerId);
  if (freelancer && remainingPayout > 0) {
    db.users.update(agreement.freelancerId, {
      walletBalance: Math.round(((freelancer.walletBalance || 0) + remainingPayout) * 10000) / 10000,
    });
  }

  const updated = touch(agreementId, {
    status: "COMPLETED",
    escrowBalance: 0,
    totalWithdrawn: agreement.budget,
    clientRating: Number(rating) || 5,
    clientReview: (review || "").trim(),
  });

  // Mint client-confirmed AttestationRecord on-chain
  const reportHash =
    existingSubmission?.reportHash ||
    `0x${sha256(`approved-${agreementId}-${agreement.freelancerId}-${Date.now()}`)}`;

  const attestation = db.attestations.insert({
    id: nextId("att"),
    streamId: agreementId,
    recipient: agreement.freelancerId,
    sender: clientId,
    amountPaid: agreement.budget,
    kind: "WorkSession",
    category: agreement.category || "Freelance",
    clientConfirmed: true,
    autoReleased: false,
    activeDurationSeconds: agreement.durationSeconds || 36000,
    reportHash,
    title: agreement.title,
    rating: Number(rating) || 5,
    review: (review || "").trim(),
    createdAt: nowIso(),
  });

  const paymentTxn = recordTransaction({
    agreementId,
    fromUser: "ESCROW_CONTRACT",
    toUser: agreement.freelancerId,
    type: "ATTESTATION_MINTED",
    amount: remainingPayout,
    data: {
      attestationId: attestation.id,
      category: agreement.category || "Freelance",
      rating: Number(rating) || 5,
      clientConfirmed: true,
    },
  });

  recordTransaction({
    agreementId,
    fromUser: "SYSTEM",
    toUser: agreement.freelancerId,
    type: "PROJECT_COMPLETED",
    amount: 0,
  });

  notify(agreement.freelancerId, {
    type: "ATTESTATION_MINTED",
    title: "Work approved & attestation minted!",
    message: `${agreement.title}: client approved work with a ${rating}-star rating. Attestation #${attestation.id} minted.`,
    agreementId,
  });

  return { agreement: updated, transaction: paymentTxn, attestation };
}

export function requestRevision(agreementId, clientId, feedback) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.clientId !== clientId) throw new DomainError("You cannot review this agreement.", 403);
  if (!feedback || feedback.trim().length < 5) {
    throw new DomainError("Add revision feedback so the worker knows what to change.");
  }
  assertTransition(agreement.status, "REVISION_REQUESTED");
  assertTransition("REVISION_REQUESTED", "IN_PROGRESS");

  let submission = db.submissions.findOne((s) => s.agreementId === agreementId);
  if (submission) {
    submission = db.submissions.update(submission.id, {
      status: "REVISION_REQUESTED",
      clientFeedback: feedback.trim(),
    });
  }

  const updated = touch(agreementId, { status: "IN_PROGRESS" });

  recordTransaction({
    agreementId,
    fromUser: clientId,
    toUser: agreement.freelancerId,
    type: "REVISION_REQUESTED",
    amount: 0,
  });

  notify(agreement.freelancerId, {
    type: "REVISION_REQUESTED",
    title: "Revision requested",
    message: `${agreement.title}: the client asked for changes.`,
    agreementId,
  });

  return { agreement: updated, submission };
}

export function rejectSubmission(agreementId, clientId, reason) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.clientId !== clientId) throw new DomainError("You cannot review this agreement.", 403);
  if (!reason || reason.trim().length < 5) {
    throw new DomainError("A reason is required to reject a submission.");
  }
  assertTransition(agreement.status, "CANCELLED");

  let submission = db.submissions.findOne((s) => s.agreementId === agreementId);
  if (submission) {
    submission = db.submissions.update(submission.id, {
      status: "REJECTED",
      clientFeedback: reason.trim(),
    });
  }

  // Settle earned vs unearned
  const earned = computeEarned(agreement);
  const totalWithdrawn = Number(agreement.totalWithdrawn || 0);
  const unwithdrawnEarned = Math.max(0, earned - totalWithdrawn);
  const unearnedRefund = Math.max(0, agreement.budget - earned);

  const freelancer = db.users.findById(agreement.freelancerId);
  if (freelancer && unwithdrawnEarned > 0) {
    db.users.update(freelancer.id, {
      walletBalance: Math.round(((freelancer.walletBalance || 0) + unwithdrawnEarned) * 10000) / 10000,
    });
  }

  const client = db.users.findById(clientId);
  if (client && unearnedRefund > 0) {
    db.users.update(clientId, {
      walletBalance: Math.round(((client.walletBalance || 0) + unearnedRefund) * 10000) / 10000,
    });
  }

  const updated = touch(agreementId, {
    status: "CANCELLED",
    escrowBalance: 0,
    totalWithdrawn: Math.round((totalWithdrawn + unwithdrawnEarned) * 10000) / 10000,
  });

  notify(agreement.freelancerId, {
    type: "SUBMISSION_REJECTED",
    title: "Submission rejected",
    message: `${agreement.title}: submission was rejected. Reason: ${reason.trim()}`,
    agreementId,
  });

  return { agreement: updated, submission };
}

export { DomainError };
