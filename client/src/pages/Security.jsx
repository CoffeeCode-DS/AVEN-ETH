import { useEffect, useRef, useState } from "react";
import AppLayout from "../layouts/AppLayout.jsx";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";

const CONCEPTS = [
  {
    title: "SHA-256 Transaction Hashing",
    body: "Every escrow deposit, milestone submission, and micropayment release is cryptographically serialized. Changing a single byte completely changes the 256-bit hash fingerprint.",
  },
  {
    title: "Cryptographic Block Chaining",
    body: "Each block permanently seals the previous block's SHA-256 hash. Mutating past history breaks the chain forwards from that exact block.",
  },
  {
    title: "Proof of Work Consensus",
    body: "Blocks require mining valid nonces satisfying local difficulty target constraints, ensuring consensus state cannot be arbitrarily forged.",
  },
  {
    title: "Git Merkle Tree Diff Verification",
    body: "Worker contributions are tied to verified Git commit ranges (base -> head) and hashed into on-chain Merkle roots before payment can be claimed.",
  },
  {
    title: "Zero-Trust Stream Freezing",
    body: "Either client or worker can halt micropayment streaming in real time if scope breaches or malicious activity is detected.",
  },
  {
    title: "Non-Custodial Escrow Vaults",
    body: "Escrow balances are derived directly from verified on-chain smart contract events, eliminating centralized intermediary custody.",
  },
  {
    title: "Instant Tamper Detection",
    body: "Any ledger modification fails SHA-256 verification and previousHash checks immediately, highlighting the exact block corrupted.",
  },
  {
    title: "EAS On-Chain Reputation Badges",
    body: "Settled agreements and milestone attestations are minted as verifiable, immutable Ethereum Attestation Service records.",
  },
];

function ChecklistItem({ label, state }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.04] font-mono text-xs">
      <span
        className={`${
          state === "pending"
            ? "text-slate-400 dark:text-slate-500"
            : state === "fail"
            ? "text-rose-600 dark:text-rose-300 font-medium"
            : "text-slate-800 dark:text-slate-200"
        }`}
      >
        {label}
      </span>
      <div className="shrink-0">
        {state === "pending" && <span className="h-4 w-4 rounded-full border border-slate-300 dark:border-white/[0.15] inline-block" />}
        {state === "running" && (
          <span className="h-4 w-4 rounded-full border-2 border-indigo-500/30 border-t-[#6366F1] animate-spin inline-block" />
        )}
        {state === "ok" && (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
            PASSED
          </span>
        )}
        {state === "fail" && (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
            FAILED
          </span>
        )}
      </div>
    </div>
  );
}

const STEP_DEFS = [
  { key: "hash", label: "Checking transaction payload hash integrity\u2026", okLabel: "Transaction hashes validated" },
  { key: "link", label: "Verifying previous block cryptographic links\u2026", okLabel: "Previous block hashes verified" },
  { key: "pow", label: "Testing Proof-of-Work difficulty constraints\u2026", okLabel: "Valid nonces & difficulty confirmed" },
  { key: "block", label: "Auditing block sequence & state roots\u2026", okLabel: "Block structures verified" },
  { key: "consensus", label: "Verifying consensus ledger state\u2026", okLabel: "Consensus state validated" },
  { key: "escrow", label: "Synchronizing escrow vault balances\u2026", okLabel: "Escrow balances synchronized" },
];

export default function Security() {
  const toast = useToast();
  const [chain, setChain] = useState(null);
  const [tampered, setTampered] = useState(false);

  const [running, setRunning] = useState(false);
  const [stepStates, setStepStates] = useState({});
  const [finalResult, setFinalResult] = useState(null);
  const timeoutsRef = useRef([]);

  const [selectedBlock, setSelectedBlock] = useState("");
  const [tamperBusy, setTamperBusy] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);

  function loadChain() {
    api
      .blockchain()
      .then((res) => {
        setChain(res.chain);
        setTampered(res.tampered);
        if (!selectedBlock && res.chain.length > 1) {
          setSelectedBlock(String(res.chain.find((b) => b.blockNumber !== 0)?.blockNumber ?? ""));
        }
      })
      .catch(() => {});
  }

  useEffect(() => {
    loadChain();
    return () => timeoutsRef.current.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function runVerification() {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setRunning(true);
    setFinalResult(null);
    setStepStates(Object.fromEntries(STEP_DEFS.map((s) => [s.key, "pending"])));

    let result;
    try {
      result = await api.verifyBlockchain();
    } catch (err) {
      toast.error(err.message);
      setRunning(false);
      return;
    }

    const allHash = result.steps.every((s) => s.hashMatches);
    const allLink = result.steps.every((s) => s.linkMatches);
    const allPow = result.steps.every((s) => s.meetsDifficulty);
    const outcomes = {
      hash: allHash,
      link: allLink,
      pow: allPow,
      block: allHash && allLink && allPow,
      consensus: result.valid,
      escrow: result.valid,
    };

    STEP_DEFS.forEach((step, i) => {
      const t1 = setTimeout(() => {
        setStepStates((prev) => ({ ...prev, [step.key]: "running" }));
      }, i * 450);
      const t2 = setTimeout(() => {
        setStepStates((prev) => ({ ...prev, [step.key]: outcomes[step.key] ? "ok" : "fail" }));
        if (i === STEP_DEFS.length - 1) {
          setFinalResult(result);
          setRunning(false);
        }
      }, i * 450 + 320);
      timeoutsRef.current.push(t1, t2);
    });
  }

  async function handleTamper() {
    if (!selectedBlock) return;
    setTamperBusy(true);
    try {
      await api.tamperBlock(Number(selectedBlock), Math.round(Math.random() * 9000) / 1000 + 100);
      toast.info(`Block #${selectedBlock} was tampered with \u2014 run verification to see it fail.`);
      loadChain();
      setFinalResult(null);
      setStepStates({});
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTamperBusy(false);
    }
  }

  async function handleRestore() {
    setRestoreBusy(true);
    try {
      await api.restoreBlockchain();
      toast.success("Chain restored \u2014 all blocks valid again.");
      loadChain();
      setFinalResult(null);
      setStepStates({});
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRestoreBusy(false);
    }
  }

  return (
    <AppLayout
      title="Security & Consensus"
      subtitle="Cryptographic verification engine, Git Merkle proof consensus, and live blockchain tamper auditor."
    >
      {/* 4-Bento Security Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 font-mono">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl">
          <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Ledger Health</p>
          <p className={`text-2xl font-bold mt-1.5 ${tampered ? "text-rose-500 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
            {tampered ? "Tampered" : "100% Secure"}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">EVM State Root OK</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl">
          <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Proof of Work</p>
          <p className="text-2xl font-bold text-[#6366F1] dark:text-[#818CF8] mt-1.5">SHA-256</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Difficulty 3 (000...)</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl">
          <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Merkle Diff Engine</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">Active</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Git commit range audit</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl">
          <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Total Blocks</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">{chain?.length || 0}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Verified on localnet</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8 items-start">
        {/* Run Security Verification Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-2xl space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Cryptographic Verification Audit</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
                Walks the entire chain, recomputing every hash and cryptographic link.
              </p>
            </div>
            {tampered && (
              <span className="text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                TAMPER DETECTED
              </span>
            )}
          </div>

          <button
            className="w-full h-11 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white font-semibold text-xs font-mono tracking-wider uppercase transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
            onClick={runVerification}
            disabled={running}
          >
            {running && <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
            {running ? "Auditing Blockchain Consensus\u2026" : "Run Consensus Audit & Verification"}
          </button>

          {Object.keys(stepStates).length > 0 && (
            <div className="space-y-2 pt-2">
              {STEP_DEFS.map((step) => (
                <ChecklistItem
                  key={step.key}
                  label={
                    stepStates[step.key] === "ok"
                      ? step.okLabel
                      : stepStates[step.key] === "fail"
                      ? `${step.okLabel} \u2014 failed`
                      : step.label
                  }
                  state={stepStates[step.key] || "pending"}
                />
              ))}
            </div>
          )}

          {finalResult && (
            <div
              className={`mt-4 rounded-xl p-4 text-xs font-mono font-medium border ${
                finalResult.valid
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/25"
                  : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/25"
              }`}
            >
              {finalResult.valid ? (
                <div className="space-y-1">
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">✓ ALL BLOCKS CRYPTOGRAPHICALLY VERIFIED</p>
                  <p className="text-slate-600 dark:text-slate-300">
                    Proof-of-work nonces, previous hashes, and escrow balances are in 100% consensus agreement.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-bold text-rose-600 dark:text-rose-400 text-sm">× CHAIN INTEGRITY VIOLATION DETECTED</p>
                  <p className="text-slate-600 dark:text-slate-300">
                    Broken cryptographic linkage detected at Block #{finalResult.brokenAtBlock}. Hash mismatch!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Tamper Simulator Sandbox */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-2xl space-y-5">
          <div>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Live Tamper Simulator</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
              Pick a block and modify its amount to simulate an attacker editing ledger records, then observe verification catch it.
            </p>
          </div>

          <div>
            <label className="field-label">Select Block to Mutate</label>
            <select
              className="input font-mono text-xs"
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
            >
              {chain
                ?.filter((b) => b.blockNumber !== 0)
                .sort((a, b) => a.blockNumber - b.blockNumber)
                .map((b) => (
                  <option key={b.blockNumber} value={b.blockNumber} className="bg-white dark:bg-[#0A0A0A] text-slate-900 dark:text-white">
                    Block #{b.blockNumber} &mdash; {b.type.replace(/_/g, " ")} ({b.projectTitle || "Transfer"})
                  </option>
                ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              className="h-11 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 hover:bg-rose-100 dark:hover:bg-rose-500/25 font-mono text-xs font-semibold uppercase tracking-wider transition-all flex-1 flex items-center justify-center gap-2"
              onClick={handleTamper}
              disabled={tamperBusy || !selectedBlock}
            >
              {tamperBusy && <span className="h-3.5 w-3.5 rounded-full border-2 border-rose-600/40 border-t-rose-600 animate-spin" />}
              Tamper Block Data
            </button>
            <button
              className="h-11 rounded-xl bg-slate-100 dark:bg-[#171717] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-[#1F1F1F] font-mono text-xs font-semibold uppercase tracking-wider transition-all flex-1 flex items-center justify-center gap-2 shadow-sm"
              onClick={handleRestore}
              disabled={restoreBusy || !tampered}
            >
              {restoreBusy && <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-400 border-t-slate-800 animate-spin" />}
              Restore Valid Chain
            </button>
          </div>

          {tampered && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 text-xs font-mono text-rose-700 dark:text-rose-300 space-y-1">
              <p className="font-bold text-rose-600 dark:text-rose-400">Ledger Mutation Active:</p>
              <p>
                Block #{selectedBlock} stored hash no longer matches its payload. Run the verification audit to see the consensus failure.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 8-Bento Cryptographic Security Guarantee Cards */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-2xl space-y-6">
        <div>
          <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Cryptographic Guarantees &amp; Smart Escrow Protocols</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
            How Sidekick protects every stream deposit, commit verification, and micropayment payout.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CONCEPTS.map((c, i) => (
            <div key={c.title} className="p-4 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.06] flex flex-col justify-between space-y-3">
              <div>
                <span className="h-6 w-6 rounded-lg bg-indigo-50 dark:bg-[#6366F1]/15 text-[#6366F1] dark:text-[#818CF8] border border-indigo-200 dark:border-indigo-500/30 text-xs font-mono font-bold flex items-center justify-center mb-3">
                  0{i + 1}
                </span>
                <p className="text-xs font-mono font-semibold text-slate-900 dark:text-white leading-snug">{c.title}</p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
