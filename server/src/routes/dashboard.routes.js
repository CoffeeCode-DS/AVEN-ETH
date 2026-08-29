import { Router } from "express";
import { db } from "../data/store.js";
import { requireAuth } from "../middleware/auth.js";
import { computeEarned, computeAvailable } from "../services/escrowService.js";
import { computeReputation } from "../services/reputationService.js";

const router = Router();
router.use(requireAuth);

function enrichAgreement(agreement) {
  const client = db.users.findById(agreement.clientId);
  const freelancer = db.users.findById(agreement.freelancerId);
  const submission = db.submissions.findOne((s) => s.agreementId === agreement.id);
  const session = db.workSessions.findOne((s) => s.agreementId === agreement.id);

  return {
    ...agreement,
    earnedAmount: computeEarned(agreement),
    availableAmount: computeAvailable(agreement),
    client: client
      ? { id: client.id, name: client.name, avatar: client.avatar, walletAddress: client.walletAddress }
      : null,
    freelancer: freelancer
      ? { id: freelancer.id, name: freelancer.name, avatar: freelancer.avatar, walletAddress: freelancer.walletAddress }
      : null,
    submission: submission || null,
    session: session || null,
  };
}

router.get("/", (req, res) => {
  const { user } = req;
  const dbUser = db.users.findById(user.id);

  if (user.role === "CLIENT") {
    const rows = db.agreements.find((a) => a.clientId === user.id);
    const active = rows.filter((a) => !["COMPLETED", "CANCELLED"].includes(a.status));
    const totalFunded = rows.reduce((sum, a) => sum + (a.status !== "PENDING_FUNDING" ? a.budget : 0), 0);
    const locked = rows.reduce((sum, a) => sum + (a.escrowBalance || 0), 0);
    const released = rows.reduce((sum, a) => sum + (a.totalWithdrawn || 0), 0);
    const pendingReviews = rows.filter((a) => a.status === "SUBMITTED").length;

    return res.json({
      role: "CLIENT",
      stats: {
        activeProjects: active.length,
        totalFunded: Math.round(totalFunded * 10000) / 10000,
        lockedInEscrow: Math.round(locked * 10000) / 10000,
        released: Math.round(released * 10000) / 10000,
        pendingReviews,
        walletBalance: dbUser?.walletBalance ?? 10.0,
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

  const totalEarned = rows.reduce((sum, a) => sum + (a.totalWithdrawn || 0), 0);
  const claimable = rows.reduce((sum, a) => sum + computeAvailable(a), 0);

  const reputation = computeReputation(user.id);

  return res.json({
    role: "FREELANCER",
    stats: {
      activeProjects: active.length,
      inProgress,
      pendingReviews,
      totalEarned: Math.round(totalEarned * 10000) / 10000,
      claimableStreamBalance: Math.round(claimable * 10000) / 10000,
      reputationScore: reputation.totalScore,
      totalAttestations: reputation.totalAttestations,
      walletBalance: dbUser?.walletBalance ?? 0,
    },
    reputation,
    activeAgreements: active
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .map(enrichAgreement),
  });
});

export default router;
