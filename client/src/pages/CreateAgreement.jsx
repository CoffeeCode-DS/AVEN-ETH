import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { formatEth } from "../utils/format.js";

const STEPS = ["Stream Details", "Recipient Worker", "Budget & Rate", "Duration & Deadline", "Review"];
const CATEGORIES = ["Freelance", "Grant", "Bounty", "Salary", "AgentTask", "Subscription"];

function minDateString() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function CreateAgreement() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [freelancers, setFreelancers] = useState([]);
  const [loadingFreelancers, setLoadingFreelancers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: CATEGORIES[0],
    freelancerId: "",
    budget: "",
    deadline: "",
  });

  const [walletBalance, setWalletBalance] = useState(null);

  useEffect(() => {
    api
      .freelancers()
      .then((res) => setFreelancers(res.freelancers))
      .catch(() => toast.error("Couldn't load freelancers. Try refreshing the page."))
      .finally(() => setLoadingFreelancers(false));

    api
      .wallet()
      .then((res) => setWalletBalance(res.wallet?.availableBalance))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validateStep(current) {
    const next = {};
    if (current === 0) {
      if (!form.title.trim()) next.title = "Project title is required.";
      else if (form.title.trim().length < 4) next.title = "Give the project a more descriptive title.";
      if (!form.description.trim() || form.description.trim().length < 20)
        next.description = "Add a description of at least 20 characters so the freelancer understands scope.";
    }
    if (current === 1) {
      if (!form.freelancerId) next.freelancerId = "Select a freelancer to continue.";
    }
    if (current === 2) {
      const n = Number(form.budget);
      if (!form.budget || Number.isNaN(n) || n <= 0) next.budget = "Enter a valid amount greater than 0.";
      else if (n > 100) next.budget = "That amount looks unusually high for a prototype demo — try under 100 ETH.";
    }
    if (current === 3) {
      if (!form.deadline) next.deadline = "Choose a deadline.";
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
      toast.success(`"${res.agreement.title}" created. Fund escrow to get started.`);
      navigate(`/agreements/${res.agreement.id}`);
    } catch (err) {
      setSubmitError(err.message || "Unable to create this agreement. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedFreelancer = freelancers.find((f) => f.id === form.freelancerId);

  return (
    <AppLayout title="New Stream Agreement" subtitle="Set up a payment stream and assign a developer.">
      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1 font-mono">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 shrink-0">
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border transition-colors ${
                i < step
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                  : i === step
                  ? "border-[#6366F1] text-white bg-[#6366F1]"
                  : "border-white/[0.1] text-slate-500 bg-[#0A0A0A]"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span className={`text-xs font-medium ${i === step ? "text-white" : "text-slate-500"}`}>{label}</span>
            {i < STEPS.length - 1 && <span className="w-6 h-px bg-white/[0.08] mx-1" />}
          </div>
        ))}
      </div>

      <div className="p-6 sm:p-8 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] max-w-2xl shadow-xl">
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <label className="field-label">Project title</label>
              <input
                className={`input ${errors.title ? "input-error" : ""}`}
                placeholder="e.g. Real-time Payment Engine & Smart Contracts"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
              {errors.title && <p className="field-error">{errors.title}</p>}
            </div>
            <div>
              <label className="field-label">Description</label>
              <textarea
                rows={5}
                className={`input resize-none ${errors.description ? "input-error" : ""}`}
                placeholder="Describe the scope of work, deliverables, and any specific requirements..."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
              {errors.description && <p className="field-error">{errors.description}</p>}
            </div>
            <div>
              <label className="field-label">Category</label>
              <select className="input font-mono text-xs" value={form.category} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-[#0A0A0A] text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <label className="field-label">Select a Freelancer / Contributor</label>
            {loadingFreelancers ? (
              <div className="space-y-3">
                <div className="skeleton h-20 w-full rounded-xl" />
                <div className="skeleton h-20 w-full rounded-xl" />
              </div>
            ) : (
              <div className="space-y-3">
                {freelancers.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => set("freelancerId", f.id)}
                    className={`w-full text-left rounded-xl border p-4 transition-colors ${
                      form.freelancerId === f.id
                        ? "border-[#6366F1] bg-[#6366F1]/10"
                        : "border-white/[0.08] bg-[#141414] hover:border-white/[0.18]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#6366F1] text-white text-sm font-bold flex items-center justify-center shrink-0">
                        {f.avatar || "F"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-white text-sm">{f.name}</p>
                          <span className="text-xs font-mono text-amber-400 font-medium">
                            Rating: {f.rating}/5
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{f.title}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {f.skills?.slice(0, 4).map((s) => (
                            <span key={s} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300">
                              {s}
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] font-mono text-slate-500 mt-2">{f.completedProjects} completed projects</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {errors.freelancerId && <p className="field-error">{errors.freelancerId}</p>}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="field-label !mb-0">Total Stream Budget (ETH)</label>
                {walletBalance !== null && (
                  <span className="text-xs text-slate-400 font-mono">
                    Wallet: <strong className="text-emerald-400">{formatEth(walletBalance)}</strong>
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
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 font-medium">
                  ETH
                </span>
              </div>
              {errors.budget && <p className="field-error">{errors.budget}</p>}
              <p className="text-xs text-slate-400 mt-2 font-sans">
                This amount will be locked in the AVEN Stream Vault and stream continuously to the worker.
              </p>
            </div>

            {walletBalance !== null && Number(form.budget) > walletBalance && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/25 p-3.5 flex items-center justify-between gap-3">
                <div className="text-xs font-mono text-rose-300">
                  <strong>Low Balance:</strong> Your wallet has {formatEth(walletBalance)}, which is less than {formatEth(Number(form.budget))}.
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/wallet")}
                  className="h-8 px-3 rounded-lg bg-rose-600 text-white font-mono text-xs font-medium uppercase tracking-wider shrink-0"
                >
                  + Add Funds
                </button>
              </div>
            )}

            {Number(form.budget) > 0 && !errors.budget && (
              <div className="rounded-xl bg-[#6366F1]/10 border border-indigo-500/25 px-4 py-3.5 flex items-center justify-between font-mono text-xs">
                <span className="text-slate-300">Amount to lock in stream vault</span>
                <span className="font-bold text-[#818CF8] text-sm">{formatEth(Number(form.budget))}</span>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label className="field-label">Project deadline</label>
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
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-3">Summary</p>
              <div className="rounded-xl border border-white/[0.08] divide-y divide-white/[0.06] bg-[#141414] font-mono text-xs">
                <SummaryRow label="Project" value={form.title} />
                <SummaryRow label="Category" value={form.category} />
                <SummaryRow
                  label="Freelancer"
                  value={selectedFreelancer ? `${selectedFreelancer.name}` : "—"}
                />
                <SummaryRow label="Budget" value={formatEth(Number(form.budget))} mono />
                <SummaryRow
                  label="Deadline"
                  value={form.deadline ? new Date(form.deadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}
                />
              </div>
              <div className="mt-3 rounded-xl bg-white/[0.04] p-3 text-xs text-slate-400 leading-relaxed font-sans">
                After creation this agreement will be in <strong>Pending Funding</strong> state. Fund the stream vault to let the freelancer start streaming verified work.
              </div>
            </div>
            {submitError && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/25 px-3.5 py-3 text-xs font-mono text-rose-300">
                {submitError}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.06]">
          <button
            className="h-10 px-5 rounded-xl bg-[#171717] text-slate-300 border border-white/[0.08] hover:bg-[#1F1F1F] font-mono text-xs font-medium uppercase transition-all disabled:opacity-50"
            onClick={goBack}
            disabled={step === 0 || submitting}
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              className="h-10 px-5 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white font-mono text-xs font-medium uppercase tracking-wider transition-all shadow-md shadow-indigo-500/25"
              onClick={goNext}
            >
              Continue &rarr;
            </button>
          ) : (
            <button
              className="h-10 px-5 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white font-mono text-xs font-medium uppercase tracking-wider transition-all shadow-md shadow-indigo-500/25 flex items-center gap-2"
              onClick={handleCreate}
              disabled={submitting}
            >
              {submitting && <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
              {submitting ? "Creating Vault..." : "Create Agreement"}
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function SummaryRow({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-slate-400">{label}</span>
      <span className={`text-white font-medium text-right ${mono ? "font-mono font-bold text-[#818CF8]" : ""}`}>{value}</span>
    </div>
  );
}
