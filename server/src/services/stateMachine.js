// Central definition of every legal agreement-status transition.
// Nothing in the codebase should mutate `agreement.status` directly —
// always go through `assertTransition` so an invalid jump (e.g.
// COMPLETED -> IN_PROGRESS) throws instead of silently corrupting state.

export const STATUSES = [
  "PENDING_FUNDING",
  "FUNDED",
  "IN_PROGRESS",
  "PAUSED",
  "SUBMITTED",
  "REVISION_REQUESTED",
  "APPROVED",
  "RELEASED",
  "COMPLETED",
  "CANCELLED",
];

const TRANSITIONS = {
  PENDING_FUNDING: ["FUNDED", "CANCELLED"],
  FUNDED: ["IN_PROGRESS", "PAUSED", "CANCELLED"],
  IN_PROGRESS: ["PAUSED", "SUBMITTED", "COMPLETED", "CANCELLED"],
  PAUSED: ["IN_PROGRESS", "CANCELLED"],
  SUBMITTED: ["REVISION_REQUESTED", "COMPLETED", "CANCELLED"],
  REVISION_REQUESTED: ["IN_PROGRESS", "CANCELLED"],
  APPROVED: ["RELEASED", "COMPLETED"],
  RELEASED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export class InvalidTransitionError extends Error {
  constructor(from, to) {
    super(`Cannot move an agreement from ${from} to ${to}.`);
    this.name = "InvalidTransitionError";
    this.status = 409;
  }
}

export function assertTransition(from, to) {
  const allowed = TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    throw new InvalidTransitionError(from, to);
  }
}
