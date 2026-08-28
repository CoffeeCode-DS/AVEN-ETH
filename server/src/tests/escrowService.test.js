import test from "node:test";
import assert from "node:assert/strict";

import { resetDb, db } from "../data/store.js";
import {
  createAgreement,
  fundEscrow,
  startProject,
  workAction,
  submitWork,
  approveAndRelease,
  requestRevision,
  rejectSubmission,
  DomainError,
} from "../services/escrowService.js";
import { InvalidTransitionError } from "../services/stateMachine.js";

const CLIENT_ID = "user_client_1";
const FREELANCER_ID = "user_freelancer_1";

function futureDate(days = 10) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// Every test gets a clean slate so seed-data mutations from one test
// never leak into another.
test.beforeEach(() => {
  resetDb();
});

test("createAgreement rejects an invalid budget", () => {
  assert.throws(
    () =>
      createAgreement({
        clientId: CLIENT_ID,
        freelancerId: FREELANCER_ID,
        title: "Test project",
        description: "desc",
        budget: 0,
        deadline: futureDate(),
      }),
    DomainError
  );
});

test("createAgreement rejects a past deadline", () => {
  assert.throws(
    () =>
      createAgreement({
        clientId: CLIENT_ID,
        freelancerId: FREELANCER_ID,
        title: "Test project",
        description: "desc",
        budget: 0.1,
        deadline: futureDate(-2),
      }),
    DomainError
  );
});

test("createAgreement rejects a missing/invalid freelancer", () => {
  assert.throws(
    () =>
      createAgreement({
        clientId: CLIENT_ID,
        freelancerId: "not-a-real-user",
        title: "Test project",
        description: "desc",
        budget: 0.1,
        deadline: futureDate(),
      }),
    DomainError
  );
});

test("full happy-path lifecycle: create -> fund -> start -> work -> submit -> approve", () => {
  const agreement = createAgreement({
    clientId: CLIENT_ID,
    freelancerId: FREELANCER_ID,
    title: "Landing Page Rebuild",
    description: "Rebuild the marketing landing page.",
    budget: 0.4,
    deadline: futureDate(),
  });
  assert.equal(agreement.status, "PENDING_FUNDING");
  assert.equal(agreement.escrowBalance, 0);

  const { agreement: funded, transaction: fundTxn } = fundEscrow(agreement.id, CLIENT_ID);
  assert.equal(funded.status, "FUNDED");
  assert.equal(funded.escrowBalance, 0.4);
  assert.equal(fundTxn.type, "ESCROW_FUNDED");
  assert.ok(/^0x[0-9a-f]{64}$/.test(fundTxn.simulatedTxHash), "simulatedTxHash should be a real 0x-prefixed sha256 hex digest");
  assert.ok(fundTxn.simulatedTxHash.startsWith("0x000"), "mined hash should satisfy the configured proof-of-work difficulty");
  assert.equal(typeof fundTxn.nonce, "number");
  assert.ok(fundTxn.previousHash.startsWith("0x"));

  const { agreement: started } = startProject(agreement.id, FREELANCER_ID);
  assert.equal(started.status, "IN_PROGRESS");

  workAction(agreement.id, FREELANCER_ID, "start");
  const stoppedSession = workAction(agreement.id, FREELANCER_ID, "stop");
  assert.equal(stoppedSession.status, "STOPPED");

  const { agreement: submitted } = submitWork(agreement.id, FREELANCER_ID, {
    description: "Landing page rebuilt and deployed to staging.",
    deliverables: ["landing-v1.zip"],
  });
  assert.equal(submitted.status, "SUBMITTED");

  const { agreement: completed, transaction: payTxn } = approveAndRelease(agreement.id, CLIENT_ID);
  assert.equal(completed.status, "COMPLETED");
  assert.equal(completed.escrowBalance, 0);
  assert.equal(payTxn.type, "PAYMENT_RELEASED");
  assert.equal(payTxn.amount, 0.4);

  // A PROJECT_COMPLETED marker transaction should also exist.
  const projectCompletedTxn = db.transactions.findOne(
    (t) => t.agreementId === agreement.id && t.type === "PROJECT_COMPLETED"
  );
  assert.ok(projectCompletedTxn);
});

test("revision loop: submit -> revision requested -> resubmit -> approve", () => {
  const agreement = createAgreement({
    clientId: CLIENT_ID,
    freelancerId: FREELANCER_ID,
    title: "Revision Loop Project",
    description: "desc",
    budget: 0.2,
    deadline: futureDate(),
  });
  fundEscrow(agreement.id, CLIENT_ID);
  startProject(agreement.id, FREELANCER_ID);
  workAction(agreement.id, FREELANCER_ID, "start");
  workAction(agreement.id, FREELANCER_ID, "stop");
  submitWork(agreement.id, FREELANCER_ID, { description: "First attempt at the work.", deliverables: [] });

  const { agreement: afterRevision, submission } = requestRevision(agreement.id, CLIENT_ID, "Please fix the header.");
  assert.equal(afterRevision.status, "IN_PROGRESS");
  assert.equal(submission.status, "REVISION_REQUESTED");
  assert.equal(submission.clientFeedback, "Please fix the header.");

  // Freelancer must stop a session again before resubmitting.
  workAction(agreement.id, FREELANCER_ID, "start");
  workAction(agreement.id, FREELANCER_ID, "stop");
  const { agreement: resubmitted, submission: sub2 } = submitWork(agreement.id, FREELANCER_ID, {
    description: "Fixed the header as requested.",
    deliverables: [],
  });
  assert.equal(resubmitted.status, "SUBMITTED");
  assert.equal(sub2.revisionCount, 1);

  const { agreement: completed } = approveAndRelease(agreement.id, CLIENT_ID);
  assert.equal(completed.status, "COMPLETED");
});

test("reject ends the agreement and requires a reason", () => {
  const agreement = createAgreement({
    clientId: CLIENT_ID,
    freelancerId: FREELANCER_ID,
    title: "Reject Path Project",
    description: "desc",
    budget: 0.2,
    deadline: futureDate(),
  });
  fundEscrow(agreement.id, CLIENT_ID);
  startProject(agreement.id, FREELANCER_ID);
  workAction(agreement.id, FREELANCER_ID, "start");
  workAction(agreement.id, FREELANCER_ID, "stop");
  submitWork(agreement.id, FREELANCER_ID, { description: "Submitted work for review.", deliverables: [] });

  assert.throws(() => rejectSubmission(agreement.id, CLIENT_ID, ""), DomainError);

  const { agreement: cancelled } = rejectSubmission(agreement.id, CLIENT_ID, "Does not meet requirements.");
  assert.equal(cancelled.status, "CANCELLED");
});

test("invalid state transitions are rejected", () => {
  const agreement = createAgreement({
    clientId: CLIENT_ID,
    freelancerId: FREELANCER_ID,
    title: "Invalid Transition Project",
    description: "desc",
    budget: 0.2,
    deadline: futureDate(),
  });

  // Cannot approve before it's even funded/submitted.
  assert.throws(() => approveAndRelease(agreement.id, CLIENT_ID), InvalidTransitionError);

  fundEscrow(agreement.id, CLIENT_ID);
  // Cannot fund twice.
  assert.throws(() => fundEscrow(agreement.id, CLIENT_ID), InvalidTransitionError);
});

test("authorization: only the owning client can fund, only the assigned freelancer can start", () => {
  const agreement = createAgreement({
    clientId: CLIENT_ID,
    freelancerId: FREELANCER_ID,
    title: "Auth Project",
    description: "desc",
    budget: 0.2,
    deadline: futureDate(),
  });

  assert.throws(() => fundEscrow(agreement.id, "some-other-client"), DomainError);
  assert.throws(() => startProject(agreement.id, "some-other-freelancer"), DomainError);
});

test("cannot submit work without logging and stopping a work session", () => {
  const agreement = createAgreement({
    clientId: CLIENT_ID,
    freelancerId: FREELANCER_ID,
    title: "No Session Project",
    description: "desc",
    budget: 0.2,
    deadline: futureDate(),
  });
  fundEscrow(agreement.id, CLIENT_ID);
  startProject(agreement.id, FREELANCER_ID);

  assert.throws(
    () => submitWork(agreement.id, FREELANCER_ID, { description: "Trying to submit without working.", deliverables: [] }),
    DomainError
  );

  workAction(agreement.id, FREELANCER_ID, "start");
  // Still running, not stopped yet.
  assert.throws(
    () => submitWork(agreement.id, FREELANCER_ID, { description: "Trying to submit while still running.", deliverables: [] }),
    DomainError
  );
});
