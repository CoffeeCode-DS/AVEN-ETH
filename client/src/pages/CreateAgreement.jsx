import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { formatEth } from "../utils/format.js";

const STEPS = ["Project Details", "Freelancer", "Budget", "Deadline", "Review"];
const CATEGORIES = ["Web Development", "UI/UX Design", "Mobile Development", "Security", "Smart Contracts", "Writing & Content"];

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

  useEffect(() => {
    api
      .freelancers()
      .then((res) => setFreelancers(res.freelancers))
      .catch(() => toast.error("Couldn't load freelancers. Try refreshing the page."))
      .finally(() => setLoadingFreelancers(false));
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
    <AppLayout title="New Agreement" subtitle="Set up a project and hire a freelancer.">
      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 shrink-0">
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold font-tabular border-2 transition-colors ${
                i < step
                  ? "bg-success border-success text-white"
                  : i === step
                  ? "border-accent text-accent bg-accent-50"
                  : "border-border text-ink-300"
              }`}
            >
              {i < step ? "\u2713" : i + 1}
            </div>
            <span className={`text-sm font-medium ${i === step ? "text-ink-900" : "text-ink-400"}`}>{label}</span>
            {i < STEPS.length - 1 && <span className="w-6 h-px bg-border mx-1" />}
          </div>
        ))}
      </div>

      <div className="card p-6 sm:p-8 max-w-2xl">
        {step === 0 && (
          <div className="space-y-5 animate-fadeUp">
            <div>
              <label className="field-label">Project title</label>
              <input
                className={`input ${errors.title ? "input-error" : ""}`}
                placeholder="e.g. E-commerce Platform Redesign"
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
              <select className="input" value={form.category} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fadeUp">
            <label className="field-label">Select a freelancer</label>
            {loadingFreelancers ? (
              <div className="space-y-3">
                <div className="skeleton h-20 w-full" />
                <div className="skeleton h-20 w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                {freelancers.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => set("freelancerId", f.id)}
                    className={`w-full text-left rounded-xl border-2 p-4 transition-colors ${
                      form.freelancerId === f.id ? "border-accent bg-accent-50/60" : "border-border hover:border-ink-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-ink-900 text-white text-sm font-semibold flex items-center justify-center shrink-0">
                        {f.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-ink-900">{f.name}</p>
                          <span className="flex items-center gap-1 text-sm text-warning-600 font-medium shrink-0">
                            {"\u2605"} {f.rating}
                          </span>
                        </div>
                        <p className="text-sm text-ink-400 mt-0.5">{f.title}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {f.skills?.slice(0, 4).map((s) => (
                            <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-ink-900/5 text-ink-600">
                              {s}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-ink-400 mt-2">{f.completedProjects} completed projects</p>
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
          <div className="space-y-5 animate-fadeUp">
            <div>
              <label className="field-label">Total budget (ETH)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  className={`input font-tabular ${errors.budget ? "input-error" : ""}`}
                  placeholder="0.5000"
                  value={form.budget}
                  onChange={(e) => set("budget", e.target.value)}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-400 font-medium">
                  ETH
                </span>
              </div>
              {errors.budget && <p className="field-error">{errors.budget}</p>}
              <p className="text-xs text-ink-400 mt-2">
                Simulated value &mdash; no real cryptocurrency is used. This full amount will be locked in escrow once funded.
              </p>
            </div>
            {Number(form.budget) > 0 && !errors.budget && (
              <div className="rounded-xl bg-accent-50 border border-accent-100 px-4 py-3.5 flex items-center justify-between">
                <span className="text-sm text-ink-600">Amount to lock in escrow</span>
                <span className="font-tabular font-semibold text-accent-700">{formatEth(Number(form.budget))}</span>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 animate-fadeUp">
            <div>
              <label className="field-label">Project deadline</label>
              <input
                type="date"
                min={minDateString()}
                className={`input ${errors.deadline ? "input-error" : ""}`}
                value={form.deadline}
                onChange={(e) => set("deadline", e.target.value)}
              />
              {errors.deadline && <p className="field-error">{errors.deadline}</p>}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5 animate-fadeUp">
            <div>
              <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-3">Summary</p>
              <div className="rounded-xl border border-border divide-y divide-border-soft">
                <SummaryRow label="Project" value={form.title} />
                <SummaryRow label="Category" value={form.category} />
                <SummaryRow
                  label="Freelancer"
                  value={selectedFreelancer ? `${selectedFreelancer.name}` : "\u2014"}
                />
                <SummaryRow label="Budget" value={formatEth(Number(form.budget))} mono />
                <SummaryRow
                  label="Deadline"
                  value={form.deadline ? new Date(form.deadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "\u2014"}
                />
              </div>
              <div className="mt-3 rounded-xl bg-ink-900/[0.03] px-4 py-3 text-xs text-ink-500 leading-relaxed">
                After creation this agreement will be in <strong>Pending Funding</strong>. Fund escrow next to notify{" "}
                {selectedFreelancer?.name || "the freelancer"} and let them start work.
              </div>
            </div>
            {submitError && (
              <div className="rounded-xl bg-danger-50 border border-danger-100 px-3.5 py-3 text-sm text-danger-700">
                {submitError}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border-soft">
          <button className="btn-secondary" onClick={goBack} disabled={step === 0 || submitting}>
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button className="btn-primary" onClick={goNext}>
              Continue
            </button>
          ) : (
            <button className="btn-primary" onClick={handleCreate} disabled={submitting}>
              {submitting && <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
              {submitting ? "Creating..." : "Create Agreement"}
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
      <span className="text-sm text-ink-400">{label}</span>
      <span className={`text-sm font-medium text-ink-900 text-right ${mono ? "font-tabular" : ""}`}>{value}</span>
    </div>
  );
}
