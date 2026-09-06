import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import EscrowFlow from "../components/EscrowFlow.jsx";
import Avatar from "../components/Avatar.jsx";
import { formatEth, truncateAddress } from "../utils/format.js";

const STEPS = [
  { id: "scope", number: "01", title: "Scope & Deliverables", subtitle: "Define terms & requirements" },
  { id: "terms", number: "02", title: "Contributor & Escrow", subtitle: "Select worker & deposit" },
  { id: "review", number: "03", title: "Smart Contract Review", subtitle: "Verify & deploy stream" },
];

const CATEGORIES = [
  { id: "Freelance", label: "Freelance Contract", desc: "Milestone-driven software engineering" },
  { id: "Grant", label: "Protocol Grant", desc: "Open-source research & development" },
  { id: "Bounty", label: "Security Bounty", desc: "Issue fixes, audits, and bounties" },
  { id: "Salary", label: "Contributor Stream", desc: "Continuous retainer & developer salary" },
  { id: "AgentTask", label: "Autonomous Agent Task", desc: "Programmatic AI worker execution" },
  { id: "Subscription", label: "Service Agreement", desc: "Recurring infrastructure & maintenance" },
];

function minDateString() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function CreateAgreement() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [freelancers, setFreelancers] = useState([]);
  const [loadingFreelancers, setLoadingFreelancers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Freelance",
    freelancerId: "",
    budget: "",
    deadline: "",
    durationHours: "160",
    termsAccepted: true,
  });

  const [walletBalance, setWalletBalance] = useState(null);

  useEffect(() => {
    api
      .freelancers()
      .then((res) => {
        setFreelancers(res.freelancers || []);
        if (res.freelancers && res.freelancers.length > 0) {
          setForm((f) => ({ ...f, freelancerId: f.freelancerId || res.freelancers[0].id }));
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoadingFreelancers(false));

    api
      .wallet()
      .then((res) => setWalletBalance(res.balance))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validateStep(cur) {
    const next = {};
    if (cur === 0) {
      if (!form.title.trim()) next.title = "Agreement title is required.";
      if (!form.description.trim()) next.description = "Scope and deliverables specification is required.";
    } else if (cur === 1) {
      if (!form.freelancerId) next.freelancerId = "Please select a recipient contributor.";
      const n = Number(form.budget);
      if (!form.budget || Number.isNaN(n) || n <= 0) next.budget = "Enter a valid escrow amount in ETH.";
      if (!form.deadline) next.deadline = "Choose an agreement delivery deadline.";
      else if (new Date(form.deadline).getTime() <= Date.now()) next.deadline = "Deadline must be in the future.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleCreate() {
    if (!form.termsAccepted) {
      setSubmitError("You must accept the smart contract terms and escrow conditions to proceed.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await api.createAgreement({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        freelancerId: form.freelancerId,
        budget: Number(form.budget),
        deadline: new Date(form.deadline).toISOString(),
      });
      toast.success(`Agreement "${res.agreement.title}" created. Fund vault to start streaming.`);
      navigate(`/agreements/${res.agreement.id}`);
    } catch (err) {
      setSubmitError(err.message || "Unable to create this agreement. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedFreelancer = freelancers.find((f) => f.id === form.freelancerId);
  const budgetNum = Number(form.budget) || 0;
  const deadlineDays = form.deadline
    ? Math.max(1, Math.ceil((new Date(form.deadline).getTime() - Date.now()) / (1000 * 3600 * 24)))
    : 30;
  const computedRatePerSec = budgetNum > 0 ? budgetNum / (deadlineDays * 24 * 3600) : 0;
  const computedRatePerHr = computedRatePerSec * 3600;

  return (
    <AppLayout
      title="Create Agreement"
      subtitle="Draft a smart escrow agreement and continuous micro-payment stream."
    >
      {/* 3-Stage Professional Stepper */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {STEPS.map((s, i) => {
          const isActive = i === step;
          const isPassed = i < step;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                if (isPassed) setStep(i);
              }}
              disabled={!isPassed && !isActive}
              className={`text-left p-4 rounded-xl border transition-all ${
                isActive
                  ? "bg-white dark:bg-[#0A0A0A] border-[#6366F1] shadow-lg shadow-indigo-500/10"
                  : isPassed
                  ? "bg-white/70 dark:bg-[#0A0A0A]/60 border-emerald-500/30 hover:border-emerald-500/50 cursor-pointer"
                  : "bg-slate-50/50 dark:bg-[#0A0A0A]/30 border-slate-200 dark:border-white/[0.05] opacity-60 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 font-mono">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    isActive
                      ? "bg-[#6366F1] text-white"
                      : isPassed
                      ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-slate-200 dark:bg-white/[0.05] text-slate-500"
                  }`}
                >
                  {isPassed ? "✓" : s.number}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Step {i + 1} of 3
                </span>
              </div>
              <p className={`text-sm font-semibold ${isActive ? "text-slate-900 dark:text-white" : isPassed ? "text-slate-700 dark:text-slate-200" : "text-slate-400 dark:text-slate-500"}`}>
                {s.title}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{s.subtitle}</p>
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Main Form Body (Left Column) */}
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-2xl space-y-6">
          {/* STEP 1: SCOPE & DELIVERABLES */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Agreement Scope &amp; Specifications</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
                  Define the legal covenants, deliverables, and engineering contract parameters.
                </p>
              </div>

              {/* Category Selector Grid */}
              <div>
                <label className="field-label">Agreement Type</label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => set("category", cat.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        form.category === cat.id
                          ? "border-[#6366F1] bg-indigo-50 dark:bg-[#6366F1]/10 text-[#6366F1] dark:text-white ring-1 ring-[#6366F1]"
                          : "border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#141414] hover:border-slate-300 dark:hover:border-white/[0.14] text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <p className="text-xs font-mono font-semibold text-slate-900 dark:text-white">{cat.label}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{cat.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="field-label">Agreement Title</label>
                <input
                  type="text"
                  className={`input font-sans text-sm ${errors.title ? "input-error" : ""}`}
                  placeholder="e.g. Core Protocol Architecture & Smart Escrow Implementation"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                />
                {errors.title && <p className="field-error">{errors.title}</p>}
              </div>

              {/* Description & Deliverables */}
              <div>
                <label className="field-label">Scope of Work &amp; Deliverables Checklist</label>
                <textarea
                  rows={6}
                  className={`input resize-none font-sans text-xs leading-relaxed ${errors.description ? "input-error" : ""}`}
                  placeholder="Describe scope, architectural requirements, milestones, and deliverables (e.g., contracts deployed, test coverage >90%, Git Merkle audit diffs)..."
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
                {errors.description && <p className="field-error">{errors.description}</p>}
              </div>
            </div>
          )}

          {/* STEP 2: CONTRIBUTOR & ESCROW ECONOMICS */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Contributor &amp; Escrow Economics</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
                  Assign the recipient developer, lock the escrow vault deposit, and set the stream rate.
                </p>
              </div>

              {/* Contributor Selection */}
              <div>
                <label className="field-label">Select Contributor / Recipient Worker</label>
                {loadingFreelancers ? (
                  <div className="space-y-3">
                    <div className="skeleton h-20 w-full rounded-xl" />
                    <div className="skeleton h-20 w-full rounded-xl" />
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                    {freelancers.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => set("freelancerId", f.id)}
                        className={`w-full text-left rounded-xl border p-3.5 transition-colors flex items-center justify-between gap-3 ${
                          form.freelancerId === f.id
                            ? "border-[#6366F1] bg-indigo-50 dark:bg-[#6366F1]/10 shadow-sm"
                            : "border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#141414] hover:border-slate-300 dark:hover:border-white/[0.14]"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar user={f} size="sm" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-900 dark:text-white text-xs">{f.name}</p>
                              <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-medium">
                                Rating {f.rating}/5
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">{f.title}</p>
                          </div>
                        </div>

                        <div className="text-right font-mono shrink-0">
                          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{formatEth(f.hourlyRate)}/hr</p>
                          <p className="text-[10px] text-slate-500">{f.completedProjects} contracts</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {errors.freelancerId && <p className="field-error">{errors.freelancerId}</p>}
              </div>

              {/* Escrow Deposit & Deadline in 2 Columns */}
              <div className="grid sm:grid-cols-2 gap-5 pt-2">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="field-label !mb-0">Escrow Deposit (ETH)</label>
                    {walletBalance !== null && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        Wallet: <strong className="text-emerald-600 dark:text-emerald-400">{formatEth(walletBalance)}</strong>
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      className={`input font-mono ${errors.budget ? "input-error" : ""}`}
                      placeholder="0.5000"
                      value={form.budget}
                      onChange={(e) => set("budget", e.target.value)}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500 dark:text-slate-400 font-bold">
                      ETH
                    </span>
                  </div>
                  {errors.budget && <p className="field-error">{errors.budget}</p>}
                </div>

                <div>
                  <label className="field-label">Completion Deadline</label>
                  <input
                    type="date"
                    min={minDateString()}
                    className={`input font-mono ${errors.deadline ? "input-error" : ""}`}
                    value={form.deadline}
                    onChange={(e) => set("deadline", e.target.value)}
                  />
                  {errors.deadline && <p className="field-error">{errors.deadline}</p>}
                </div>
              </div>

              {/* Real-time Streaming Metrics Bar */}
              {budgetNum > 0 && form.deadline && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>Target Duration:</span>
                    <span className="text-slate-900 dark:text-white font-medium">{deadlineDays} days ({deadlineDays * 24} hrs)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>Continuous Flow Rate:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{computedRatePerSec.toFixed(8)} ETH/sec ({formatEth(computedRatePerHr)}/hr)</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: SMART CONTRACT REVIEW & DEPLOY */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Smart Contract Covenant Review</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
                  Review the non-custodial smart escrow parameters before broadcasting to the Ethereum ledger.
                </p>
              </div>

              {/* Escrow Visualization Flow */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.06]">
                <EscrowFlow
                  fromLabel={user?.avatar || "CL"}
                  fromName={user?.name || "Client"}
                  toLabel={selectedFreelancer?.avatar || "DV"}
                  toName={selectedFreelancer?.name || "Contributor"}
                  amount={formatEth(budgetNum)}
                  active
                />
              </div>

              {/* Covenant Details Table */}
              <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] divide-y divide-slate-200 dark:divide-white/[0.06] bg-slate-50 dark:bg-[#141414] font-mono text-xs">
                <div className="flex justify-between p-3">
                  <span className="text-slate-500 dark:text-slate-400">Agreement Title:</span>
                  <span className="text-slate-900 dark:text-white font-medium">{form.title}</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-slate-500 dark:text-slate-400">Category:</span>
                  <span className="text-[#6366F1] dark:text-[#818CF8] font-medium">{form.category}</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-slate-500 dark:text-slate-400">Contributor:</span>
                  <span className="text-slate-900 dark:text-white font-medium">{selectedFreelancer?.name} ({truncateAddress(selectedFreelancer?.walletAddress)})</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-slate-500 dark:text-slate-400">Locked Escrow Vault:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{formatEth(budgetNum)}</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-slate-500 dark:text-slate-400">Settlement Rate:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{formatEth(computedRatePerHr)}/hr</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-slate-500 dark:text-slate-400">Target Deadline:</span>
                  <span className="text-slate-900 dark:text-white font-medium">{form.deadline ? new Date(form.deadline).toLocaleDateString() : "—"}</span>
                </div>
              </div>

              {/* Verification Covenants */}
              <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] space-y-2 font-mono text-xs">
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">Protocol Covenants:</p>
                <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                  <span><strong>Cryptographic Proof of Work:</strong> Funds accrue only during active work sessions verified via Git SHA-256 Merkle diffs.</span>
                </div>
                <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                  <span><strong>Zero-Trust Dispute Freeze:</strong> Either party can halt streaming and lock unearned funds at any second.</span>
                </div>
                <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                  <span><strong>EAS Reputation Minting:</strong> Settlement automatically issues permanent on-chain attestation badges.</span>
                </div>
              </div>

              {submitError && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/25 px-4 py-3 text-xs font-mono text-rose-500 dark:text-rose-300">
                  {submitError}
                </div>
              )}
            </div>
          )}

          {/* Stepper Bottom Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-white/[0.06] font-mono text-xs">
            <button
              type="button"
              className="h-10 px-5 rounded-xl bg-slate-100 dark:bg-[#171717] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-[#1F1F1F] font-medium uppercase transition-all disabled:opacity-30 shadow-sm"
              onClick={goBack}
              disabled={step === 0 || submitting}
            >
              &larr; Previous Stage
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                className="h-10 px-6 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white font-medium uppercase tracking-wider transition-all shadow-md shadow-indigo-500/25"
                onClick={goNext}
              >
                Proceed to {STEPS[step + 1].title} &rarr;
              </button>
            ) : (
              <button
                type="button"
                className="h-10 px-6 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2"
                onClick={handleCreate}
                disabled={submitting}
              >
                {submitting && <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin mr-2" />}
                {submitting ? "Deploying Covenant..." : "Deploy Smart Agreement"}
              </button>
            )}
          </div>
        </div>

        {/* Live Agreement Sidebar Card (Right Column) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
                Agreement Preview
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-[#6366F1]/15 text-[#6366F1] dark:text-[#818CF8] border border-indigo-200 dark:border-indigo-500/30">
                Draft
              </span>
            </div>

            <div>
              <p className="text-xs font-mono text-[#6366F1] dark:text-[#818CF8]">{form.category || "Freelance"}</p>
              <h4 className="text-base font-semibold text-slate-900 dark:text-white mt-1 leading-snug">
                {form.title.trim() || "Untitled Agreement"}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-sans line-clamp-3">
                {form.description.trim() || "No scope specified yet. Complete step 1 to describe requirements."}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-white/[0.06] space-y-2.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 text-[11px]">Client:</span>
                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[130px]">{user?.name || "Me"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-[11px]">Contributor:</span>
                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[130px]">{selectedFreelancer?.name || "Unassigned"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-[11px]">Escrow Deposit:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatEth(budgetNum)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-[11px]">Deadline:</span>
                <span className="text-slate-700 dark:text-slate-300">{form.deadline || "Not set"}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-white/[0.06]">
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>EVM Localnet Chain ID: 31337</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
