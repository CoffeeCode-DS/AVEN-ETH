import crypto from "crypto";

/**
 * blockchainService — a genuinely-computed, lightweight blockchain
 * simulation.
 *
 * This is NOT a fake string generator. Every block's hash is a real
 * SHA-256 digest of the block's contents, mined by incrementing a
 * nonce until the digest satisfies the configured difficulty (a
 * required number of leading hex zeros) — exactly the mechanism real
 * proof-of-work chains use, just at a difficulty low enough (3 hex
 * zeros, a few thousand hashes at most) to stay instant and cheap.
 *
 * No real cryptocurrency, wallet, or network is involved. This exists
 * purely so the app can honestly show "here is a hash, here is the
 * nonce that produced it, here is why changing the data breaks it" —
 * an educational demonstration of what escrow-protecting consensus
 * actually means, not a decorative animation.
 */

const DIFFICULTY = 3; // required leading hex zeros — fast, not wasteful
const TARGET_PREFIX = "0".repeat(DIFFICULTY);

function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// Deterministic, order-stable serialization so the same block contents
// always hash the same way (used both when mining and when verifying).
function serializeBlock({ blockNumber, previousHash, type, agreementId, amount, fromUser, toUser, data, timestamp, nonce }) {
  return JSON.stringify({
    blockNumber,
    previousHash,
    type,
    agreementId: agreementId || null,
    amount: amount || 0,
    fromUser: fromUser || null,
    toUser: toUser || null,
    data: data || null,
    timestamp,
    nonce,
  });
}

function mineHash(blockFieldsWithoutNonce) {
  let nonce = 0;
  // Bounded loop as a safety net; difficulty 3 resolves in a few
  // thousand iterations on average, never anywhere near this cap.
  const MAX_ITERATIONS = 2_000_000;
  for (; nonce < MAX_ITERATIONS; nonce++) {
    const hash = sha256(serializeBlock({ ...blockFieldsWithoutNonce, nonce }));
    if (hash.startsWith(TARGET_PREFIX)) {
      return { nonce, hash };
    }
  }
  // Practically unreachable at difficulty 3, but fail loudly rather
  // than silently returning an unmined block if it ever were.
  throw new Error("Proof-of-work mining exceeded iteration bound.");
}

class Blockchain {
  constructor() {
    this.chain = [];
    this.tamperedBlocks = new Map(); // blockNumber -> original block snapshot
    this._genesis();
  }

  _genesis() {
    const timestamp = new Date().toISOString();
    const fields = {
      blockNumber: 0,
      previousHash: "0".repeat(64),
      type: "GENESIS",
      agreementId: null,
      amount: 0,
      fromUser: null,
      toUser: null,
      data: { note: "AVEN-ETH Simulation Network genesis block" },
      timestamp,
    };
    const { nonce, hash } = mineHash(fields);
    this.chain.push({ ...fields, nonce, difficulty: DIFFICULTY, hash, txId: null, status: "CONFIRMED" });
  }

  loadChain(blocks) {
    if (Array.isArray(blocks) && blocks.length > 0) {
      this.chain = JSON.parse(JSON.stringify(blocks));
      this.tamperedBlocks.clear();
    }
  }

  latest() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Mines and appends a new block for a real application event
   * (escrow funded, work submitted, payment released, ...). Returns
   * the full block, including the tx-facing fields the rest of the
   * app already expects (simulatedTxHash, block, network, gas).
   */
  mineBlock({ type, agreementId, amount, fromUser, toUser, data, txId, timestamp }) {
    const previous = this.latest();
    const ts = timestamp || new Date().toISOString();
    const fields = {
      blockNumber: previous.blockNumber + 1,
      previousHash: previous.hash,
      type,
      agreementId,
      amount,
      fromUser,
      toUser,
      data: data || null,
      timestamp: ts,
    };
    const { nonce, hash } = mineHash(fields);
    const block = { ...fields, nonce, difficulty: DIFFICULTY, hash, txId: txId || null, status: "CONFIRMED" };
    this.chain.push(block);
    return block;
  }

  getChain({ limit } = {}) {
    const rows = [...this.chain].reverse(); // newest first
    return limit ? rows.slice(0, limit) : rows;
  }

  getBlock(blockNumber) {
    return this.chain.find((b) => b.blockNumber === blockNumber) || null;
  }

  /**
   * Walks the entire chain recomputing each block's hash from its
   * stored fields and checking the previousHash links. This is real
   * verification, not a canned animation — if a block was tampered
   * with (see tamperBlock), this will genuinely fail at that block.
   */
  verifyChain() {
    const steps = [];
    let valid = true;
    let brokenAtBlock = null;

    for (let i = 0; i < this.chain.length; i++) {
      const block = this.chain[i];
      const recomputed = sha256(
        serializeBlock({
          blockNumber: block.blockNumber,
          previousHash: block.previousHash,
          type: block.type,
          agreementId: block.agreementId,
          amount: block.amount,
          fromUser: block.fromUser,
          toUser: block.toUser,
          data: block.data,
          timestamp: block.timestamp,
          nonce: block.nonce,
        })
      );

      const hashMatches = recomputed === block.hash;
      const meetsDifficulty = block.hash.startsWith(TARGET_PREFIX);
      const linkMatches = i === 0 || block.previousHash === this.chain[i - 1].hash;

      const ok = hashMatches && meetsDifficulty && linkMatches;
      steps.push({
        blockNumber: block.blockNumber,
        hashMatches,
        meetsDifficulty,
        linkMatches,
        ok,
      });

      if (!ok && valid) {
        valid = false;
        brokenAtBlock = block.blockNumber;
      }
    }

    return { valid, brokenAtBlock, steps, blockCount: this.chain.length };
  }

  /**
   * Educational tamper demo: mutates a confirmed block's amount
   * WITHOUT re-mining its hash, exactly like an attacker editing
   * ledger data after the fact. The stored hash and the true PoW
   * conditions no longer match, and verifyChain() above will catch
   * the fact that hashes and hash values disagree
   * and the link to the next block breaks too.
   */
  tamperBlock(blockNumber, newAmount) {
    const block = this.getBlock(blockNumber);
    if (!block) return null;
    if (block.blockNumber === 0) return null; // never tamper genesis

    if (!this.tamperedBlocks.has(blockNumber)) {
      this.tamperedBlocks.set(blockNumber, { amount: block.amount });
    }
    block.amount = newAmount;
    return block;
  }

  restoreChain() {
    for (const [blockNumber, original] of this.tamperedBlocks.entries()) {
      const block = this.getBlock(blockNumber);
      if (block) Object.assign(block, original);
    }
    this.tamperedBlocks.clear();
    return this.verifyChain();
  }

  isTampered() {
    return this.tamperedBlocks.size > 0;
  }
}

export const blockchain = new Blockchain();

export function resetBlockchain() {
  const fresh = new Blockchain();
  blockchain.chain = fresh.chain;
  blockchain.tamperedBlocks = new Map();
}

export { DIFFICULTY };
