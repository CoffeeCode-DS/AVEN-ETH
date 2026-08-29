import * as seed from "./seed.js";
import { blockchain, resetBlockchain } from "../services/blockchainService.js";

/**
 * In-memory repository layer.
 *
 * The project is architected so MongoDB is the intended production
 * datastore (see README), but this prototype ships with a dependency-free
 * in-memory fallback so it runs immediately with `npm install && npm run dev`
 * — no database server required. Every method here is what a Mongo-backed
 * repository would expose, so swapping the implementation later doesn't
 * require touching routes or services.
 */
function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

class Collection {
  constructor(initial) {
    this.rows = deepClone(initial);
  }
  all() {
    return deepClone(this.rows);
  }
  find(predicate) {
    return deepClone(this.rows.filter(predicate));
  }
  findOne(predicate) {
    const row = this.rows.find(predicate);
    return row ? deepClone(row) : null;
  }
  findById(id) {
    return this.findOne((r) => r.id === id);
  }
  insert(row) {
    this.rows.push(row);
    return deepClone(row);
  }
  update(id, patch) {
    const idx = this.rows.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.rows[idx] = { ...this.rows[idx], ...patch };
    return deepClone(this.rows[idx]);
  }
}

// Seed transactions carry only semantic fields (who/what/when/how much).
// Their blockchain fields (hash, block number, nonce, ...) are produced
// by actually mining a block for each one, in chronological order, so
// the Transactions page and the Blockchain page are always looking at
// the same real chain — never two disconnected sets of fake numbers.
function buildSeededTransactions() {
  resetBlockchain();
  const chronological = [...seed.transactions].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );
  const byId = {};
  for (const txn of chronological) {
    const block = blockchain.mineBlock({
      type: txn.type,
      agreementId: txn.agreementId,
      amount: txn.amount,
      fromUser: txn.fromUser,
      toUser: txn.toUser,
      txId: txn.id,
      timestamp: txn.timestamp,
    });
    byId[txn.id] = {
      ...txn,
      simulatedTxHash: `0x${block.hash}`,
      block: block.blockNumber,
      previousHash: `0x${block.previousHash}`,
      nonce: block.nonce,
      difficulty: block.difficulty,
      network: "AVEN-ETH Simulation Network",
      gas: "0.0000",
    };
  }
  // Preserve the original seed.js ordering for anything that assumes it.
  return seed.transactions.map((t) => byId[t.id]);
}

export const db = {
  users: new Collection(seed.users),
  agreements: new Collection(seed.agreements),
  workSessions: new Collection(seed.workSessions),
  submissions: new Collection(seed.submissions),
  attestations: new Collection(seed.attestations || []),
  transactions: new Collection(buildSeededTransactions()),
  notifications: new Collection(seed.notifications),
};

export function resetDb() {
  db.users = new Collection(seed.users);
  db.agreements = new Collection(seed.agreements);
  db.workSessions = new Collection(seed.workSessions);
  db.submissions = new Collection(seed.submissions);
  db.attestations = new Collection(seed.attestations || []);
  db.transactions = new Collection(buildSeededTransactions());
  db.notifications = new Collection(seed.notifications);
}

export function publicUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}
