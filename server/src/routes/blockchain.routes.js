import { Router } from "express";
import { blockchain } from "../services/blockchainService.js";
import { db } from "../data/store.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

function displayName(id) {
  if (id === "ESCROW_CONTRACT") return "Escrow Contract";
  if (id === "SYSTEM") return "AVEN-ETH System";
  if (!id) return null;
  const user = db.users.findById(id);
  return user ? user.name : "Unknown";
}

function enrichBlock(block) {
  const agreement = block.agreementId ? db.agreements.findById(block.agreementId) : null;
  return {
    ...block,
    hash: `0x${block.hash}`,
    previousHash: `0x${block.previousHash}`,
    fromName: displayName(block.fromUser),
    toName: displayName(block.toUser),
    projectTitle: agreement ? agreement.title : block.type === "GENESIS" ? "AVEN-ETH Network" : null,
  };
}

// The full simulated chain, newest block first. Anyone logged in can
// view it — a ledger is meant to be transparent to its participants.
router.get("/", (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const chain = blockchain.getChain({ limit }).map(enrichBlock);
  res.json({ chain, blockCount: blockchain.chain.length, tampered: blockchain.isTampered() });
});

// Walks the whole chain, recomputing every hash and every previous-hash
// link from scratch. Returns a step-by-step result per block so the UI
// can play back a real (not scripted) verification sequence.
router.get("/verify", (req, res) => {
  const result = blockchain.verifyChain();
  res.json(result);
});

// Educational-only: mutate a confirmed block's amount without
// re-mining its hash, so the verification above will genuinely catch
// the mismatch. Never touches real agreement/escrow state.
router.post("/tamper", (req, res) => {
  const { blockNumber, newAmount } = req.body || {};
  if (typeof blockNumber !== "number") {
    return res.status(400).json({ error: "blockNumber is required." });
  }
  if (blockNumber === 0) {
    return res.status(400).json({ error: "The genesis block cannot be tampered with." });
  }
  const block = blockchain.getBlock(blockNumber);
  if (!block) {
    return res.status(404).json({ error: "Block not found." });
  }
  const amount = typeof newAmount === "number" ? newAmount : (block.amount || 0) + 999;
  blockchain.tamperBlock(blockNumber, amount);
  res.json({ block: enrichBlock(blockchain.getBlock(blockNumber)), verify: blockchain.verifyChain() });
});

router.post("/restore", (req, res) => {
  const result = blockchain.restoreChain();
  res.json({ verify: result, tampered: blockchain.isTampered() });
});

export default router;
