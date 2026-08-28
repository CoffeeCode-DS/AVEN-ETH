import { Router } from "express";
import { db } from "../data/store.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", (req, res) => {
  const rows = db.notifications
    .find((n) => n.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ notifications: rows, unreadCount: rows.filter((n) => !n.read).length });
});

router.post("/:id/read", requireAuth, (req, res) => {
  const notif = db.notifications.findById(req.params.id);
  if (!notif || notif.userId !== req.user.id) {
    return res.status(404).json({ error: "Notification not found." });
  }
  const updated = db.notifications.update(req.params.id, { read: true });
  res.json({ notification: updated });
});

router.post("/read-all", requireAuth, (req, res) => {
  const rows = db.notifications.find((n) => n.userId === req.user.id && !n.read);
  rows.forEach((n) => db.notifications.update(n.id, { read: true }));
  res.json({ success: true });
});

export default router;
