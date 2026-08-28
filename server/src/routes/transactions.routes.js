import { Router } from "express";
import { db, publicUser } from "../data/store.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

function displayName(id) {
  if (id === "ESCROW_CONTRACT") return "Escrow Contract";
  if (id === "SYSTEM") return "AVEN-ETH System";
  const user = db.users.findById(id);
  return user ? user.name : "Unknown";
}

router.get("/", (req, res) => {
  const { user } = req;
  const myAgreementIds = new Set(
    db.agreements
      .find((a) => a.clientId === user.id || a.freelancerId === user.id)
      .map((a) => a.id)
  );

  const rows = db.transactions
    .find((t) => myAgreementIds.has(t.agreementId))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .map((t) => {
      const agreement = db.agreements.findById(t.agreementId);
      return {
        ...t,
        fromName: displayName(t.fromUser),
        toName: displayName(t.toUser),
        projectTitle: agreement ? agreement.title : "Unknown project",
      };
    });

  res.json({ transactions: rows });
});

export default router;
