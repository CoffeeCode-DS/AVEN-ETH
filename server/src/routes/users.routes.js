import { Router } from "express";
import { db, publicUser } from "../data/store.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/freelancers", requireAuth, requireRole("CLIENT"), (req, res) => {
  const freelancers = db.users.find((u) => u.role === "FREELANCER").map(publicUser);
  res.json({ freelancers });
});

export default router;
