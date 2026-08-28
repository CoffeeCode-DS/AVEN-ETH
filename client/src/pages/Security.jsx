import { useEffect, useRef, useState } from "react";
import AppLayout from "../layouts/AppLayout.jsx";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { formatEth, truncateAddress } from "../utils/format.js";

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
    body: "To \u201cmine\u201d a block, the server searches for a nonce that makes the block's hash start with a required number of zeros \u2014 real computation, just tuned to a lightweight difficulty for this demo.",
  },
  {
    title: "Block Validation",
    body: "A block is valid only if its stored hash matches a fresh recomputation of its contents, and its previousHash genuinely matches the prior block's hash.",
  },
  {
    title: "Consensus",
    body: "Once a block satisfies proof-of-work and links correctly, it's accepted as the network's shared record of what happened \u2014 the mechanism that lets both parties trust the same history.",
  },
  {
    title: "Smart Contract State",
    body: "The escrow contract's balance (locked, released, remaining) is derived directly from confirmed on-chain events, never edited by hand.",
  },
  {
    title: "Escrow Protection",
    body: "Funds are only released when the contract's conditions are met \u2014 work submitted and client approval recorded \u2014 protecting both the client's money and the freelancer's payment.",
  },
  {
    title: "Tamper Detection",
    body: "If any block's data is altered after the fact, its stored hash no longer matches its contents. Verification catches this instantly \u2014 try it in the demo below.",
  },
];

function ChecklistItem({ label, state }) {
  return (
    <div className="flex items-center gap-3 py-2">
      {state === "pending" && <span className="h-4 w-4 rounded-full border-2 border-ink-900/10 shrink-0" />}
      {state === "running" && (
        <span className="h-4 w-4 rounded-full border-2 border-accent/30 border-t-accent animate-spin shrink-0" />
      )}
      {state === "ok" && (
        <span className="h-4 w-4 rounded-full bg-success text-white flex items-center justify-center text-[10px] shrink-0">
          &#10003;
        </span>
      )}
      {state === "fail" && (
        <span className="h-4 w-4 rounded-full bg-danger-600 text-white flex items-center justify-center text-[10px] shrink-0">
          &times;
        </span>
      )}
      <span
        className={`text-sm ${
          state === "pending" ? "text-ink-300" : state === "fail" ? "text-danger-700 font-medium" : "text-ink-700"
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
    <AppLayout title="Security & Consensus" subtitle="How the simulated blockchain protects every escrow transaction.">
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Run Security Verification */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display font-semibold text-ink-900">Run Security Verification</h2>
            {tampered && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-100">
                CHAIN TAMPERED
              </span>
            )}
          </div>
          <p className="text-sm text-ink-400 mb-4">
            Walks the entire chain, recomputing every hash and every link — a real check, not a canned animation.
          </p>

          <button className="btn-primary w-full mb-4" onClick={runVerification} disabled={running}>
            {running && <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
            {running ? "Verifying\u2026" : "Run Security Verification"}
          </button>

          {Object.keys(stepStates).length > 0 && (
            <div className="divide-y divide-border-soft border-t border-border-soft pt-1">
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
              className={`mt-4 rounded-xl px-4 py-3.5 text-sm font-medium ${
                finalResult.valid
                  ? "bg-success-50 text-success-700 border border-success-100"
                  : "bg-danger-50 text-danger-700 border border-danger-100"
              }`}
            >
              {finalResult.valid ? (
                <>&#10003; SECURE &nbsp; &#10003; VERIFIED &nbsp; &#10003; CONSENSUS REACHED</>
              ) : (
                <>CHAIN INTEGRITY: FAILED &mdash; broken at Block #{finalResult.brokenAtBlock}</>
              )}
            </div>
          )}
        </div>

        {/* Tamper Detection Demo */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-ink-900 mb-1">Tamper Detection Demo</h2>
          <p className="text-sm text-ink-400 mb-4">
            Pick a block and alter its amount after the fact — exactly what an attacker editing ledger data would
            do — then watch verification catch it.
          </p>

          <label className="field-label">Block to tamper with</label>
          <select className="input mb-4" value={selectedBlock} onChange={(e) => setSelectedBlock(e.target.value)}>
            {chain
              ?.filter((b) => b.blockNumber !== 0)
              .sort((a, b) => a.blockNumber - b.blockNumber)
              .map((b) => (
                <option key={b.blockNumber} value={b.blockNumber}>
                  Block #{b.blockNumber} — {b.type.replace(/_/g, " ")}
                </option>
              ))}
          </select>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button className="btn-danger flex-1 !text-white !bg-danger-600 !border-danger-600 hover:!bg-danger-700" onClick={handleTamper} disabled={tamperBusy || !selectedBlock}>
              {tamperBusy && <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
              Tamper Block
            </button>
            <button className="btn-secondary flex-1" onClick={handleRestore} disabled={restoreBusy || !tampered}>
              {restoreBusy && <span className="h-3.5 w-3.5 rounded-full border-2 border-ink-900/20 border-t-ink-900 animate-spin" />}
              Restore Valid Chain
            </button>
          </div>

          {tampered && (
            <div className="mt-4 rounded-xl bg-danger-50 border border-danger-100 px-4 py-3 text-sm text-danger-700">
              A block's stored hash no longer matches its data. Run the verification check to see exactly where the
              chain breaks.
            </div>
          )}
        </div>
      </div>

      {/* Educational concepts */}
      <div className="card p-6">
        <h2 className="font-display font-semibold text-ink-900 mb-4">How This Protects Your Escrow</h2>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
          {CONCEPTS.map((c, i) => (
            <div key={c.title} className="flex gap-3">
              <span className="h-6 w-6 rounded-full bg-ink-900/[0.04] text-ink-500 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-800">{c.title}</p>
                <p className="text-sm text-ink-500 mt-0.5 leading-relaxed">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
