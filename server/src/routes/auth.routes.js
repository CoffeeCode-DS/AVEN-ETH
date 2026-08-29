import crypto from "crypto";
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

router.post("/register", (req, res) => {
  const { name, email, password, role, title, skills } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }

  const existing = db.users.findOne(
    (u) => u.email.toLowerCase() === String(email).toLowerCase()
  );
  if (existing) {
    return res.status(400).json({ error: "An account with this email already exists." });
  }

  const cleanRole = role === "CLIENT" ? "CLIENT" : "FREELANCER";
  const initials = name
    .trim()
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "AV";

  const randomHex = crypto.randomBytes(20).toString("hex");
  const walletAddress = `0x${randomHex}`;
  const initialBalance = cleanRole === "CLIENT" ? 15.0 : 0.0;

  const newUser = db.users.insert({
    id: `user_${cleanRole.toLowerCase()}_${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    role: cleanRole,
    avatar: initials,
    walletAddress,
    walletBalance: initialBalance,
    title: title?.trim() || (cleanRole === "CLIENT" ? "Engineering Lead & Client" : "Full-Stack Protocol Contributor"),
    skills: Array.isArray(skills) && skills.length ? skills : ["Solidity", "TypeScript", "React", "Node.js"],
    hourlyRate: cleanRole === "FREELANCER" ? 0.012 : undefined,
    createdAt: new Date().toISOString(),
  });

  const token = jwt.sign({ sub: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: "12h" });
  res.json({ token, user: publicUser(newUser) });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
