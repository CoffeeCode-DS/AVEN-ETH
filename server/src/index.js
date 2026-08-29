import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import agreementsRoutes from "./routes/agreements.routes.js";
import transactionsRoutes from "./routes/transactions.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import blockchainRoutes from "./routes/blockchain.routes.js";
import reputationRoutes from "./routes/reputation.routes.js";
import attestationsRoutes from "./routes/attestations.routes.js";
import walletRoutes from "./routes/wallet.routes.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: "SIMULATION", service: "AVEN-ETH API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/agreements", agreementsRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/reputation", reputationRoutes);
app.use("/api/attestations", attestationsRoutes);
app.use("/api/wallet", walletRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found." });
});

// Centralized fallback error handler — every route already catches its
// own domain errors, this is the last line of defense.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error. Please try again." });
});

app.listen(PORT, () => {
  console.log(`\n  AVEN-ETH API (Simulation Mode) running on http://localhost:${PORT}\n`);
});
