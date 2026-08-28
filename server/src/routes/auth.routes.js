import { Router } from "express";
import jwt from "jsonwebtoken";
import { db, publicUser } from "../data/store.js";
import { JWT_SECRET, requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = db.users.findOne(
    (u) => u.email.toLowerCase() === String(email).toLowerCase()
  );

  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: "12h" });
  res.json({ token, user: publicUser(user) });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
