import { Router } from "express";
import { db } from "../data/store.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
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

const router = Router();
router.use(requireAuth);

function handle(res, fn) {
  try {
    const result = fn();
    res.json(result);
  } catch (err) {
    if (err instanceof DomainError) {
      return res.status(err.status).json({ error: err.message });
    }
    if (err.name === "InvalidTransitionError") {
      return res.status(err.status || 409).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "Unexpected server error. Please try again." });
  }
}

function enrich(agreement) {
  const client = db.users.findById(agreement.clientId);
  const freelancer = db.users.findById(agreement.freelancerId);
  const submission = db.submissions.findOne((s) => s.agreementId === agreement.id);
  const session = db.workSessions.findOne((s) => s.agreementId === agreement.id);
  return {
    ...agreement,
    client: client ? { id: client.id, name: client.name, avatar: client.avatar, walletAddress: client.walletAddress } : null,
    freelancer: freelancer
      ? {
          id: freelancer.id,
          name: freelancer.name,
          avatar: freelancer.avatar,
          walletAddress: freelancer.walletAddress,
          rating: freelancer.rating,
          hourlyRate: freelancer.hourlyRate,
        }
      : null,
    submission: submission || null,
    session: session || null,
  };
}

// List — scoped to the logged-in user's role automatically.
router.get("/", (req, res) => {
  const { user } = req;
  const rows =
    user.role === "CLIENT"
      ? db.agreements.find((a) => a.clientId === user.id)
      : db.agreements.find((a) => a.freelancerId === user.id);
  const sorted = rows.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json({ agreements: sorted.map(enrich) });
});

router.get("/:id", (req, res) => {
  const agreement = db.agreements.findById(req.params.id);
  if (!agreement) return res.status(404).json({ error: "Agreement not found." });
  const { user } = req;
  if (agreement.clientId !== user.id && agreement.freelancerId !== user.id) {
    return res.status(403).json({ error: "You do not have access to this agreement." });
  }
  res.json({ agreement: enrich(agreement) });
});

router.post("/", requireRole("CLIENT"), (req, res) => {
  handle(res, () => {
    const { title, description, category, freelancerId, budget, deadline } = req.body || {};
    const agreement = createAgreement({
      clientId: req.user.id,
      freelancerId,
      title,
      description,
      category,
      budget: Number(budget),
      deadline,
    });
    return { agreement: enrich(agreement) };
  });
});

router.post("/:id/fund", requireRole("CLIENT"), (req, res) => {
  handle(res, () => {
    const { agreement, transaction } = fundEscrow(req.params.id, req.user.id);
    return { agreement: enrich(agreement), transaction };
  });
});

router.post("/:id/start", requireRole("FREELANCER"), (req, res) => {
  handle(res, () => {
    const { agreement } = startProject(req.params.id, req.user.id);
    return { agreement: enrich(agreement) };
  });
});

router.post("/:id/work/:action", requireRole("FREELANCER"), (req, res) => {
  handle(res, () => {
    const session = workAction(req.params.id, req.user.id, req.params.action);
    const agreement = db.agreements.findById(req.params.id);
    return { agreement: enrich(agreement), session };
  });
});

router.post("/:id/submit", requireRole("FREELANCER"), (req, res) => {
  handle(res, () => {
    const { description, deliverables } = req.body || {};
    const { agreement } = submitWork(req.params.id, req.user.id, { description, deliverables });
    return { agreement: enrich(agreement) };
  });
});

router.post("/:id/approve", requireRole("CLIENT"), (req, res) => {
  handle(res, () => {
    const { agreement, transaction } = approveAndRelease(req.params.id, req.user.id);
    return { agreement: enrich(agreement), transaction };
  });
});

router.post("/:id/revision", requireRole("CLIENT"), (req, res) => {
  handle(res, () => {
    const { feedback } = req.body || {};
    const { agreement } = requestRevision(req.params.id, req.user.id, feedback);
    return { agreement: enrich(agreement) };
  });
});

router.post("/:id/reject", requireRole("CLIENT"), (req, res) => {
  handle(res, () => {
    const { reason } = req.body || {};
    const { agreement } = rejectSubmission(req.params.id, req.user.id, reason);
    return { agreement: enrich(agreement) };
  });
});

export default router;
