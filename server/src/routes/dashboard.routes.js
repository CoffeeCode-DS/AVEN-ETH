import { Router } from "express";
import { db } from "../data/store.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

function enrichAgreement(agreement) {
  const client = db.users.findById(agreement.clientId);
  const freelancer = db.users.findById(agreement.freelancerId);
  const submission = db.submissions.findOne((s) => s.agreementId === agreement.id);
  const session = db.workSessions.findOne((s) => s.agreementId === agreement.id);
  return {
    ...agreement,
    client: client ? { id: client.id, name: client.name, avatar: client.avatar } : null,
    freelancer: freelancer ? { id: freelancer.id, name: freelancer.name, avatar: freelancer.avatar } : null,
    submission: submission || null,
    session: session || null,
  };
}

router.get("/", (req, res) => {
  const { user } = req;

  if (user.role === "CLIENT") {
    const rows = db.agreements.find((a) => a.clientId === user.id);
    const active = rows.filter((a) => !["COMPLETED", "CANCELLED"].includes(a.status));
    const totalFunded = rows.reduce((sum, a) => sum + (a.status !== "PENDING_FUNDING" ? a.budget : 0), 0);
    const locked = rows.reduce((sum, a) => sum + a.escrowBalance, 0);
    const released = rows
      .filter((a) => a.status === "COMPLETED")
      .reduce((sum, a) => sum + a.budget, 0);
    const pendingReviews = rows.filter((a) => a.status === "SUBMITTED").length;

    return res.json({
      role: "CLIENT",
      stats: {
        activeProjects: active.length,
        totalFunded,
        lockedInEscrow: locked,
        released,
        pendingReviews,
      },
      activeAgreements: active
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .map(enrichAgreement),
    });
  }

  // FREELANCER
  const rows = db.agreements.find((a) => a.freelancerId === user.id);
  const active = rows.filter((a) => !["COMPLETED", "CANCELLED"].includes(a.status));
  const inProgress = rows.filter((a) => a.status === "IN_PROGRESS").length;
  const pendingReviews = rows.filter((a) => a.status === "SUBMITTED").length;
  const totalEarned = db.transactions
    .find((t) => t.type === "PAYMENT_RELEASED" && t.toUser === user.id)
    .reduce((sum, t) => sum + t.amount, 0);

  return res.json({
    role: "FREELANCER",
    stats: {
      activeProjects: active.length,
      inProgress,
      pendingReviews,
      totalEarned,
    },
    activeAgreements: active
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .map(enrichAgreement),
  });
});

export default router;
