import { Router } from "express";
import { db, publicUser } from "../data/store.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/freelancers", requireAuth, requireRole("CLIENT"), (req, res) => {
  const freelancers = db.users.find((u) => u.role === "FREELANCER").map(publicUser);
  res.json({ freelancers });
});

router.patch("/profile", requireAuth, (req, res) => {
  const { avatar, name, title, skills } = req.body || {};
  const patch = {};

  if (avatar !== undefined) {
    if (avatar === null || avatar === "") {
      patch.avatar = null;
    } else if (typeof avatar === "string") {
      if (avatar.length > 2 * 1024 * 1024) {
        return res.status(400).json({ error: "Avatar image payload exceeds 2MB limit." });
      }
      patch.avatar = avatar;
    }
  }

  if (typeof name === "string" && name.trim()) {
    patch.name = name.trim();
  }
  if (typeof title === "string") {
    patch.title = title.trim();
  }
  if (Array.isArray(skills)) {
    patch.skills = skills
      .filter((s) => typeof s === "string" && s.trim())
      .map((s) => s.trim());
  }

  const updated = db.users.update(req.user.id, patch);
  if (!updated) {
    return res.status(404).json({ error: "User not found." });
  }

  res.json({ user: publicUser(updated) });
});

export default router;

