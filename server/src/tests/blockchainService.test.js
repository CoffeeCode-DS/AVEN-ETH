import test from "node:test";
import assert from "node:assert/strict";

import { blockchain, resetBlockchain, DIFFICULTY } from "../services/blockchainService.js";

test.beforeEach(() => {
  resetBlockchain();
});

test("genesis block exists and satisfies proof-of-work difficulty", () => {
  const genesis = blockchain.chain[0];
  assert.equal(genesis.blockNumber, 0);
  assert.equal(genesis.previousHash, "0".repeat(64));
  assert.ok(genesis.hash.startsWith("0".repeat(DIFFICULTY)));
});

test("mineBlock produces a real hash that satisfies difficulty and links to the previous block", () => {
  const before = blockchain.latest();
  const block = blockchain.mineBlock({
    type: "ESCROW_FUNDED",
    agreementId: "agr_x",
    amount: 0.5,
    fromUser: "client",
    toUser: "ESCROW_CONTRACT",
    txId: "txn_x",
  });

  assert.equal(block.blockNumber, before.blockNumber + 1);
  assert.equal(block.previousHash, before.hash);
  assert.ok(block.hash.startsWith("0".repeat(DIFFICULTY)));
  assert.equal(typeof block.nonce, "number");
  assert.ok(block.nonce >= 0);
});

test("verifyChain reports valid for an untouched chain", () => {
  blockchain.mineBlock({ type: "ESCROW_FUNDED", agreementId: "a", amount: 1, fromUser: "x", toUser: "y", txId: "t1" });
  blockchain.mineBlock({ type: "PAYMENT_RELEASED", agreementId: "a", amount: 1, fromUser: "y", toUser: "x", txId: "t2" });

  const result = blockchain.verifyChain();
  assert.equal(result.valid, true);
  assert.equal(result.brokenAtBlock, null);
  assert.equal(result.steps.every((s) => s.ok), true);
});

test("tampering with a block's amount is genuinely detected by verifyChain", () => {
  blockchain.mineBlock({ type: "ESCROW_FUNDED", agreementId: "a", amount: 1, fromUser: "x", toUser: "y", txId: "t1" });
  const block2 = blockchain.mineBlock({ type: "PAYMENT_RELEASED", agreementId: "a", amount: 1, fromUser: "y", toUser: "x", txId: "t2" });

  const before = blockchain.verifyChain();
  assert.equal(before.valid, true);

  blockchain.tamperBlock(block2.blockNumber, 999);
  const after = blockchain.verifyChain();
  assert.equal(after.valid, false);
  assert.equal(after.brokenAtBlock, block2.blockNumber);
});

test("restoreChain repairs a tampered block and verification passes again", () => {
  const block = blockchain.mineBlock({ type: "ESCROW_FUNDED", agreementId: "a", amount: 2, fromUser: "x", toUser: "y", txId: "t1" });
  blockchain.tamperBlock(block.blockNumber, 12345);
  assert.equal(blockchain.verifyChain().valid, false);
  assert.equal(blockchain.isTampered(), true);

  const restored = blockchain.restoreChain();
  assert.equal(restored.valid, true);
  assert.equal(blockchain.isTampered(), false);
  assert.equal(blockchain.getBlock(block.blockNumber).amount, 2);
});

test("the genesis block cannot be tampered via tamperBlock", () => {
  const result = blockchain.tamperBlock(0, 999);
  assert.equal(result, null);
  assert.equal(blockchain.verifyChain().valid, true);
});
