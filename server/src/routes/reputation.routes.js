import { Router } from "express";
import { computeReputation } from "../services/reputationService.js";
import { db } from "../data/store.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/:userId", (req, res) => {
  const user = db.users.findById(req.params.userId);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  const reputation = computeReputation(user.id);
  res.json({
    user: {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      walletAddress: user.walletAddress,
      skills: user.skills || [],
    },
    reputation,
  });
});

router.get("/", (req, res) => {
  const reputation = computeReputation(req.user.id);
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      avatar: req.user.avatar,
      role: req.user.role,
      walletAddress: req.user.walletAddress,
      skills: req.user.skills || [],
    },
    reputation,
  });
});

export default router;
