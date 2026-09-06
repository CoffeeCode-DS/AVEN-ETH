import test from "node:test";
import assert from "node:assert/strict";
import { db, resetDb } from "../data/store.js";

test.beforeEach(() => {
  resetDb();
});

test("updating user avatar persists in store", () => {
  const user = db.users.all()[0];
  assert.ok(user);

  const sampleDataUrl = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD";
  const updated = db.users.update(user.id, { avatar: sampleDataUrl });

  assert.equal(updated.avatar, sampleDataUrl);

  const reloaded = db.users.findById(user.id);
  assert.equal(reloaded.avatar, sampleDataUrl);
});

test("resetting user avatar to null clears custom avatar", () => {
  const user = db.users.all()[0];
  db.users.update(user.id, { avatar: "https://example.com/photo.png" });
  assert.equal(db.users.findById(user.id).avatar, "https://example.com/photo.png");

  const resetUser = db.users.update(user.id, { avatar: null });
  assert.equal(resetUser.avatar, null);
  assert.equal(db.users.findById(user.id).avatar, null);
});

test("updating profile name and skills persists properly", () => {
  const user = db.users.all()[0];
  const updated = db.users.update(user.id, {
    name: "Alex Vance",
    title: "Lead Smart Contract Architect",
    skills: ["Solidity", "Rust", "Zero-Knowledge"],
  });

  assert.equal(updated.name, "Alex Vance");
  assert.equal(updated.title, "Lead Smart Contract Architect");
  assert.deepEqual(updated.skills, ["Solidity", "Rust", "Zero-Knowledge"]);
});

test("completing onboarding setup updates profileCompleted, bio, and hourlyRate", () => {
  const user = db.users.all()[0];
  const updated = db.users.update(user.id, {
    profileCompleted: true,
    bio: "Passionate Web3 & Smart Contract Auditor with 5 years EVM experience.",
    hourlyRate: 75.0,
  });

  assert.equal(updated.profileCompleted, true);
  assert.equal(updated.bio, "Passionate Web3 & Smart Contract Auditor with 5 years EVM experience.");
  assert.equal(updated.hourlyRate, 75.0);
});

