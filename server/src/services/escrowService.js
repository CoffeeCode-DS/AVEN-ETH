import { db } from "../data/store.js";
import { assertTransition } from "./stateMachine.js";
import { notify } from "./notificationService.js";
import { nextId, nowIso } from "../utils/simulate.js";
import { blockchain } from "./blockchainService.js";

// ---------------------------------------------------------------------
// SimulationService
//
// A clean abstraction around every "on-chain" action in the app.
// Nothing here ever moves real funds — createEscrow/fundEscrow/etc all
// generate simulated receipts (tx hash, block, timestamp) and mutate
// application state exactly the way a real escrow contract's events
// would drive a production backend. Swapping this file for a real
// Ethereum/Sepolia integration later should not require touching the
// route handlers that call it.
// ---------------------------------------------------------------------

class DomainError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// Every transaction the app records mines a genuine block onto the
// simulated chain (real SHA-256 proof-of-work, see blockchainService.js)
// so the "blockchain" behind this app isn't decorative — the hash,
// nonce, and previous-hash link shown in the UI are the real ones the
// mining loop produced, not fabricated strings.
function recordTransaction(fields) {
  const id = nextId("txn");
  const block = blockchain.mineBlock({
    type: fields.type,
    agreementId: fields.agreementId,
    amount: fields.amount || 0,
    fromUser: fields.fromUser,
    toUser: fields.toUser,
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

function loadAgreementOr404(id) {
  const agreement = db.agreements.findById(id);
  if (!agreement) throw new DomainError("Agreement not found.", 404);
  return agreement;
}

export function createAgreement({ clientId, freelancerId, title, description, category, budget, deadline }) {
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

  const agreement = db.agreements.insert({
    id: nextId("agr"),
    title: title.trim(),
    description: (description || "").trim(),
    category: category || "General",
    clientId,
    freelancerId,
    budget,
    escrowBalance: 0,
    deadline,
    status: "PENDING_FUNDING",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  notify(freelancerId, {
    type: "AGREEMENT_CREATED",
    title: "New agreement drafted",
    message: `A new agreement "${agreement.title}" is awaiting escrow funding.`,
    agreementId: agreement.id,
  });

  return agreement;
}

export function fundEscrow(agreementId, clientId) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.clientId !== clientId) throw new DomainError("You cannot fund this agreement.", 403);
  assertTransition(agreement.status, "FUNDED");

  const updated = touch(agreementId, { status: "FUNDED", escrowBalance: agreement.budget });

  const txn = recordTransaction({
    agreementId,
    fromUser: agreement.clientId,
    toUser: "ESCROW_CONTRACT",
    type: "ESCROW_FUNDED",
    amount: agreement.budget,
  });

  notify(agreement.freelancerId, {
    type: "ESCROW_FUNDED",
    title: "Project funded",
    message: `Escrow for "${agreement.title}" has been funded. You can start work now.`,
    agreementId,
  });

  return { agreement: updated, transaction: txn };
}

export function startProject(agreementId, freelancerId) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.freelancerId !== freelancerId) throw new DomainError("This project is not assigned to you.", 403);
  assertTransition(agreement.status, "IN_PROGRESS");

  const updated = touch(agreementId, { status: "IN_PROGRESS" });

  let session = db.workSessions.findOne((s) => s.agreementId === agreementId);
  if (!session) {
    session = db.workSessions.insert({
      id: nextId("ws"),
      agreementId,
      freelancerId,
      status: "IDLE",
      startedAt: null,
      accumulatedSeconds: 0,
      notes: "",
    });
  }

  notify(agreement.clientId, {
    type: "PROJECT_STARTED",
    title: "Freelancer started work",
    message: `${agreement.title}: work has begun.`,
    agreementId,
  });

  return { agreement: updated, session };
}

// --- Work session timer -------------------------------------------------

function getOrCreateSession(agreementId, freelancerId) {
  let session = db.workSessions.findOne((s) => s.agreementId === agreementId);
  if (!session) {
    session = db.workSessions.insert({
      id: nextId("ws"),
      agreementId,
      freelancerId,
      status: "IDLE",
      startedAt: null,
      accumulatedSeconds: 0,
      notes: "",
    });
  }
  return session;
}

export function workAction(agreementId, freelancerId, action) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.freelancerId !== freelancerId) throw new DomainError("This project is not assigned to you.", 403);
  if (!["IN_PROGRESS"].includes(agreement.status)) {
    throw new DomainError("You can only track time while the project is in progress.");
  }

  const session = getOrCreateSession(agreementId, freelancerId);

  if (action === "start" || action === "resume") {
    if (session.status === "RUNNING") throw new DomainError("Session is already running.");
    return db.workSessions.update(session.id, { status: "RUNNING", startedAt: nowIso() });
  }

  if (action === "pause") {
    if (session.status !== "RUNNING") throw new DomainError("Cannot pause a session that has not started.");
    const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
    return db.workSessions.update(session.id, {
      status: "PAUSED",
      accumulatedSeconds: session.accumulatedSeconds + Math.max(elapsed, 0),
      startedAt: null,
    });
  }

  if (action === "stop") {
    if (session.status === "IDLE") throw new DomainError("Cannot stop before starting work.");
    let accumulatedSeconds = session.accumulatedSeconds;
    if (session.status === "RUNNING" && session.startedAt) {
      const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
      accumulatedSeconds += Math.max(elapsed, 0);
    }
    return db.workSessions.update(session.id, {
      status: "STOPPED",
      startedAt: null,
      accumulatedSeconds,
    });
  }

  throw new DomainError("Unknown work session action.");
}

// --- Submission -----------------------------------------------------------

export function submitWork(agreementId, freelancerId, { description, deliverables }) {
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
  if (session.status !== "STOPPED") {
    throw new DomainError("Stop your active work session before submitting.");
  }

  const existing = db.submissions.findOne((s) => s.agreementId === agreementId);
  let submission;
  if (existing) {
    submission = db.submissions.update(existing.id, {
      description: description.trim(),
      deliverables: deliverables && deliverables.length ? deliverables : existing.deliverables,
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
  });

  notify(agreement.clientId, {
    type: "WORK_SUBMITTED",
    title: "New submission ready for review",
    message: `Work was submitted for "${agreement.title}".`,
    agreementId,
  });

  return { agreement: updated, submission };
}

// --- Client review ---------------------------------------------------------

export function approveAndRelease(agreementId, clientId) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.clientId !== clientId) throw new DomainError("You cannot review this agreement.", 403);
  assertTransition(agreement.status, "COMPLETED");

  const existingSubmission = db.submissions.findOne((s) => s.agreementId === agreementId);
  if (existingSubmission) {
    db.submissions.update(existingSubmission.id, { status: "APPROVED" });
  }

  const updated = touch(agreementId, { status: "COMPLETED", escrowBalance: 0 });

  const paymentTxn = recordTransaction({
    agreementId,
    fromUser: "ESCROW_CONTRACT",
    toUser: agreement.freelancerId,
    type: "PAYMENT_RELEASED",
    amount: agreement.budget,
  });

  recordTransaction({
    agreementId,
    fromUser: "SYSTEM",
    toUser: agreement.freelancerId,
    type: "PROJECT_COMPLETED",
    amount: 0,
  });

  notify(agreement.freelancerId, {
    type: "PAYMENT_RELEASED",
    title: "Payment released",
    message: `You received ${agreement.budget.toFixed(4)} ETH for "${agreement.title}".`,
    agreementId,
  });

  return { agreement: updated, transaction: paymentTxn };
}

export function requestRevision(agreementId, clientId, feedback) {
  const agreement = loadAgreementOr404(agreementId);
  if (agreement.clientId !== clientId) throw new DomainError("You cannot review this agreement.", 403);
  if (!feedback || feedback.trim().length < 5) {
    throw new DomainError("Add revision feedback so the freelancer knows what to change.");
  }
  assertTransition(agreement.status, "REVISION_REQUESTED");
  assertTransition("REVISION_REQUESTED", "IN_PROGRESS");

  let submission = db.submissions.findOne((s) => s.agreementId === agreementId);
  if (submission) {
    submission = db.submissions.update(submission.id, { status: "REVISION_REQUESTED", clientFeedback: feedback.trim() });
  }

  // The agreement passes through REVISION_REQUESTED and immediately hands
  // control back to the freelancer as IN_PROGRESS; the submission record
  // (not the agreement) is what keeps showing "revision requested" in the UI.
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
    submission = db.submissions.update(submission.id, { status: "REJECTED", clientFeedback: reason.trim() });
  }

  const updated = touch(agreementId, { status: "CANCELLED" });

  notify(agreement.freelancerId, {
    type: "SUBMISSION_REJECTED",
    title: "Submission rejected",
    message: `${agreement.title}: submission was rejected. Reason: ${reason.trim()}`,
    agreementId,
  });

  return { agreement: updated, submission };
}

export { DomainError };
