import { useEffect, useRef, useState } from "react";
import AppLayout from "../layouts/AppLayout.jsx";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";

const CONCEPTS = [
  {
    title: "Transaction Hashing",
    body: "Every escrow event (funding, submission, payment release) is serialized and run through SHA-256 to produce a unique fingerprint. Change one byte of the data and the hash changes completely.",
  },
  {
    title: "Previous Block Hash",
    body: "Each block stores the hash of the block before it, chaining every event to everything that came before. This is what makes the ledger a chain rather than a list.",
  },
  {
    title: "Proof of Work",
    body: "To mine a block, the network searches for a nonce that satisfies difficulty constraints \u2014 real computation tuned for rapid consensus.",
  },
  {
    title: "Block Validation",
    body: "A block is valid only if its stored hash matches a fresh recomputation of its contents, and its previousHash genuinely matches the prior block's hash.",
  },
  {
    title: "Consensus",
    body: "Once a block satisfies proof-of-work and links correctly, it's accepted as the network's shared record of what happened.",
  },
  {
    title: "Smart Contract State",
    body: "The escrow contract's balance (locked, released, remaining) is derived directly from confirmed on-chain events, never edited by hand.",
  },
  {
    title: "Dispute & Escrow Protection",
    body: "Funds are only released when the contract's conditions are met \u2014 work submitted, cryptographic Git Merkle diffs verified, and client approval recorded.",
  },
  {
    title: "Tamper Detection",
    body: "If any block's data is altered after the fact, its stored hash no longer matches its contents. Verification catches this instantly.",
  },
];

function ChecklistItem({ label, state }) {
  return (
    <div className="flex items-center gap-3 py-2.5 font-mono text-xs">
      {state === "pending" && <span className="h-4 w-4 rounded-full border border-white/[0.15] shrink-0" />}
      {state === "running" && (
        <span className="h-4 w-4 rounded-full border-2 border-indigo-500/30 border-t-[#6366F1] animate-spin shrink-0" />
      )}
      {state === "ok" && (
        <span className="h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-[10px] shrink-0 font-bold">
          ✓
        </span>
      )}
      {state === "fail" && (
        <span className="h-4 w-4 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center text-[10px] shrink-0 font-bold">
          ×
        </span>
      )}
      <span
        className={`${
          state === "pending" ? "text-slate-500" : state === "fail" ? "text-rose-300 font-medium" : "text-slate-200"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

const STEP_DEFS = [
  { key: "hash", label: "Checking transaction integrity\u2026", okLabel: "Transaction hash verified" },
  { key: "link", label: "Checking previous block\u2026", okLabel: "Previous hash verified" },
  { key: "pow", label: "Running Proof of Work\u2026", okLabel: "Valid nonce discovered" },
  { key: "block", label: "Checking block integrity\u2026", okLabel: "Block valid" },
  { key: "consensus", label: "Consensus\u2026", okLabel: "Transaction accepted" },
  { key: "escrow", label: "Escrow state\u2026", okLabel: "State synchronized" },
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
      }, i * 500);
      const t2 = setTimeout(() => {
        setStepStates((prev) => ({ ...prev, [step.key]: outcomes[step.key] ? "ok" : "fail" }));
        if (i === STEP_DEFS.length - 1) {
          setFinalResult(result);
          setRunning(false);
        }
      }, i * 500 + 350);
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
    <AppLayout title="Security & Consensus" subtitle="How cryptographic proof of work and Merkle hashing protect every stream transaction.">
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Run Security Verification */}
        <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] shadow-xl">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-medium text-base text-white">Run Security Verification</h2>
            {tampered && (
              <span className="text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                CHAIN TAMPERED
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mb-4 font-sans">
            Walks the entire chain, recomputing every hash and every link — a real cryptographic audit check.
          </p>

          <button
            className="w-full h-10 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white font-medium text-xs font-mono tracking-wider uppercase transition-all shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 mb-4 disabled:opacity-50"
            onClick={runVerification}
            disabled={running}
          >
            {running && <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
            {running ? "Verifying Ledger\u2026" : "Run Security Verification"}
          </button>

          {Object.keys(stepStates).length > 0 && (
            <div className="divide-y divide-white/[0.06] border-t border-white/[0.06] pt-1">
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
              className={`mt-4 rounded-xl px-4 py-3 text-xs font-mono font-medium border ${
                finalResult.valid
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/25"
                  : "bg-rose-500/10 text-rose-300 border-rose-500/25"
              }`}
            >
              {finalResult.valid ? (
                <>✓ SECURE &nbsp; ✓ VERIFIED &nbsp; ✓ CONSENSUS REACHED</>
              ) : (
                <>CHAIN INTEGRITY: FAILED &mdash; broken at Block #{finalResult.brokenAtBlock}</>
              )}
            </div>
          )}
        </div>

        {/* Tamper Detection Demo */}
        <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] shadow-xl">
          <h2 className="font-medium text-base text-white mb-1">Tamper Detection Demo</h2>
          <p className="text-xs text-slate-400 mb-4 font-sans">
            Pick a block and alter its amount after the fact — exactly what an attacker editing ledger data would
            do — then watch verification catch it.
          </p>

          <label className="field-label">Block to tamper with</label>
          <select className="input mb-4 font-mono text-xs" value={selectedBlock} onChange={(e) => setSelectedBlock(e.target.value)}>
            {chain
              ?.filter((b) => b.blockNumber !== 0)
              .sort((a, b) => a.blockNumber - b.blockNumber)
              .map((b) => (
                <option key={b.blockNumber} value={b.blockNumber} className="bg-[#0A0A0A] text-white">
                  Block #{b.blockNumber} — {b.type.replace(/_/g, " ")}
                </option>
              ))}
          </select>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              className="h-10 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 font-mono text-xs font-medium uppercase transition-all flex-1 flex items-center justify-center gap-2"
              onClick={handleTamper}
              disabled={tamperBusy || !selectedBlock}
            >
              {tamperBusy && <span className="h-3.5 w-3.5 rounded-full border-2 border-rose-300/40 border-t-rose-300 animate-spin" />}
              Tamper Block
            </button>
            <button
              className="h-10 rounded-xl bg-[#171717] text-slate-300 border border-white/[0.08] hover:bg-[#1F1F1F] hover:text-white font-mono text-xs font-medium uppercase transition-all flex-1 flex items-center justify-center gap-2"
              onClick={handleRestore}
              disabled={restoreBusy || !tampered}
            >
              {restoreBusy && <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
              Restore Valid Chain
            </button>
          </div>

          {tampered && (
            <div className="mt-4 rounded-xl bg-rose-500/10 border border-rose-500/25 px-4 py-3 text-xs font-mono text-rose-300">
              A block's stored hash no longer matches its data. Run the verification check to see exactly where the
              chain breaks.
            </div>
          )}
        </div>
      </div>

      {/* Educational concepts */}
      <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] shadow-xl">
        <h2 className="font-medium text-base text-white mb-4">How Cryptography Protects Your Escrow Vaults</h2>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
          {CONCEPTS.map((c, i) => (
            <div key={c.title} className="flex gap-3">
              <span className="h-6 w-6 rounded-lg bg-white/[0.06] border border-white/[0.08] text-[#818CF8] text-xs font-mono font-medium flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div>
                <p className="text-xs font-mono font-semibold text-white">{c.title}</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
