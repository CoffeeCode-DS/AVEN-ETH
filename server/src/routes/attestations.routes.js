import { Router } from "express";
import { db } from "../data/store.js";
import { requireAuth } from "../middleware/auth.js";
import { scoreAttestation } from "../services/reputationService.js";

const router = Router();
router.use(requireAuth);

function enrichAttestation(att) {
  const sender = db.users.findById(att.sender);
  const recipient = db.users.findById(att.recipient);
  const stream = db.agreements.findById(att.streamId);
  const breakdown = scoreAttestation(att);

  return {
    ...att,
    senderUser: sender
      ? { id: sender.id, name: sender.name, avatar: sender.avatar, walletAddress: sender.walletAddress }
      : null,
    recipientUser: recipient
      ? { id: recipient.id, name: recipient.name, avatar: recipient.avatar, walletAddress: recipient.walletAddress }
      : null,
    streamTitle: stream?.title || att.title || "Payment Stream",
    scoreBreakdown: breakdown,
  };
}

router.get("/", (req, res) => {
  const { recipient, streamId, category } = req.query;
  let rows = db.attestations.all();

  if (recipient) {
    rows = rows.filter((a) => a.recipient === recipient);
  }
  if (streamId) {
    rows = rows.filter((a) => a.streamId === streamId);
  }
  if (category) {
    rows = rows.filter((a) => a.category.toLowerCase() === category.toLowerCase());
  }

  const sorted = rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ attestations: sorted.map(enrichAttestation) });
});

router.get("/:id", (req, res) => {
  const att = db.attestations.findById(req.params.id);
  if (!att) {
    return res.status(404).json({ error: "Attestation record not found." });
  }
  res.json({ attestation: enrichAttestation(att) });
});

export default router;
