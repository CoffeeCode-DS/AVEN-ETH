import jwt from "jsonwebtoken";
import { db } from "../data/store.js";

// Prototype-only secret. Override with a real JWT_SECRET env var if you
// deploy this anywhere beyond a local demo.
export const JWT_SECRET = process.env.JWT_SECRET || "aven-eth-prototype-secret-do-not-use-in-prod";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication required. Please log in again." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.users.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: "Session is no longer valid. Please log in again." });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Session expired or invalid. Please log in again." });
  }
}

// Enforced on the backend, not just hidden in the UI — a Freelancer
// token can never reach a Client-only route (funding, approval, etc.)
// and vice versa, regardless of what the frontend renders.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `This action is restricted to ${roles.join(" or ")} accounts.`,
      });
    }
    next();
  };
}
