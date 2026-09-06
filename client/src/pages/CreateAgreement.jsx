import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useWeb3 } from "../context/Web3Context.jsx";
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
  const { account, usdcBalance, isBaseSepolia } = useWeb3();

  const [step, setStep] = useState(0);
  const [freelancers, setFreelancers] = useState([]);
  const [loadingFreelancers, setLoadingFreelancers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [errors, setErrors] = useState({});

  // Contributor selection modes: "directory" | "direct"
  const [contributorMode, setContributorMode] = useState("directory");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkillFilter, setSelectedSkillFilter] = useState("All");
  const [directWallet, setDirectWallet] = useState("");
  const [directName, setDirectName] = useState("");

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
      .then((res) => {
        const bal = res.wallet?.availableBalance ?? res.balance ?? 15.0;
        setWalletBalance(bal);
      })
      .catch(() => setWalletBalance(15.0));
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

  // Skills for filter chips
  const allSkills = useMemo(() => {
    const s = new Set();
    freelancers.forEach((f) => {
      if (Array.isArray(f.skills)) f.skills.forEach((sk) => s.add(sk));
    });
    return ["All", ...Array.from(s)];
  }, [freelancers]);

  // Filtered contributors based on search and skill filter
  const filteredFreelancers = useMemo(() => {
    return freelancers.filter((f) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        f.name.toLowerCase().includes(q) ||
        (f.title && f.title.toLowerCase().includes(q)) ||
        (Array.isArray(f.skills) && f.skills.some((sk) => sk.toLowerCase().includes(q))) ||
        (f.walletAddress && f.walletAddress.toLowerCase().includes(q));
      const matchesSkill =
        selectedSkillFilter === "All" ||
        (Array.isArray(f.skills) && f.skills.includes(selectedSkillFilter));
      return matchesQuery && matchesSkill;
    });
  }, [freelancers, searchQuery, selectedSkillFilter]);

  // Selected Contributor details
  const selectedFreelancer = useMemo(() => {
    if (contributorMode === "direct") {
      const cleanAddr = directWallet.trim();
      return {
        id: cleanAddr || "direct_contributor",
        name: directName.trim() || (cleanAddr ? `Contributor (${cleanAddr.slice(0, 6)}...${cleanAddr.slice(-4)})` : "Direct Contributor"),
        walletAddress: cleanAddr || "0x0000000000000000000000000000000000000000",
        rating: 5.0,
        title: "External Protocol Contributor",
        hourlyRate: 50,
      };
    }
    return freelancers.find((f) => f.id === form.freelancerId);
  }, [contributorMode, directWallet, directName, freelancers, form.freelancerId]);

  function validateStep(cur) {
    const next = {};
    if (cur === 0) {
      if (!form.title.trim()) next.title = "Agreement title is required.";
      if (!form.description.trim()) next.description = "Scope and deliverables specification is required.";
    } else if (cur === 1) {
      if (contributorMode === "direct") {
        const addr = directWallet.trim();
        if (!addr || !addr.startsWith("0x") || addr.length !== 42) {
          next.freelancerId = "Please enter a valid 42-character Ethereum address (0x...).";
        }
      } else {
        if (!form.freelancerId) next.freelancerId = "Please select a recipient contributor.";
      }
      const n = Number(form.budget);
      if (!form.budget || Number.isNaN(n) || n <= 0) next.budget = "Enter a valid escrow amount (USDC).";
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
      const targetFreelancerId = contributorMode === "direct"
        ? directWallet.trim()
        : form.freelancerId;

      const res = await api.createAgreement({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        freelancerId: targetFreelancerId,
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

  const budgetNum = Number(form.budget) || 0;
  const deadlineDays = form.deadline
    ? Math.max(1, Math.ceil((new Date(form.deadline).getTime() - Date.now()) / (1000 * 3600 * 24)))
    : 30;
  const computedRatePerSec = budgetNum > 0 ? budgetNum / (deadlineDays * 24 * 3600) : 0;
  const computedRatePerHr = computedRatePerSec * 3600;

  // Active wallet mode and balance indicators
  const isWeb3Active = Boolean(account && isBaseSepolia);
  const currencySymbol = "USDC";
  const displayWalletBalance = isWeb3Active
    ? `$${usdcBalance} mUSDC`
    : `$${(walletBalance ?? 15.0).toFixed(2)} USDC`;

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
                      <p className="text-xs font-semibold font-mono">{cat.label}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{cat.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="field-label">Agreement Title</label>
                <input
                  type="text"
                  className={`input font-sans ${errors.title ? "input-error" : ""}`}
                  placeholder="e.g. Audit & Refactor Uniswap V4 Hook Contracts"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                />
                {errors.title && <p className="field-error">{errors.title}</p>}
              </div>

              <div>
                <label className="field-label">Scope, Deliverables &amp; Acceptance Criteria</label>
                <textarea
                  rows={5}
                  className={`input font-sans resize-none ${errors.description ? "input-error" : ""}`}
                  placeholder="Detail the technical milestones, GitHub repo links, testing standards, and proof of work required for 100% escrow release..."
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
                  Assign the recipient developer, lock the escrow vault deposit, and set the continuous micro-payment rate.
                </p>
              </div>

              {/* Contributor Selection with Tabs & Filters */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="field-label !mb-0">Recipient Contributor</label>

                  {/* Mode switcher tabs */}
                  <div className="flex rounded-lg bg-slate-100 dark:bg-white/[0.05] p-0.5 text-[11px] font-mono border border-slate-200 dark:border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setContributorMode("directory")}
                      className={`px-3 py-1 rounded-md transition-all ${
                        contributorMode === "directory"
                          ? "bg-white dark:bg-[#1C1C1C] text-slate-900 dark:text-white shadow-sm font-semibold"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Directory ({freelancers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setContributorMode("direct")}
                      className={`px-3 py-1 rounded-md transition-all ${
                        contributorMode === "direct"
                          ? "bg-white dark:bg-[#1C1C1C] text-slate-900 dark:text-white shadow-sm font-semibold"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Direct Wallet (0x...)
                    </button>
                  </div>
                </div>

                {contributorMode === "directory" ? (
                  <div className="space-y-3">
                    {/* Search Bar & Skill Filter */}
                    <div className="space-y-2">
                      <div className="relative">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                        >
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search by name, title, skill (Solidity, React), or address..."
                          className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] text-xs font-sans text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1]"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Filter Chips */}
                      {allSkills.length > 1 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono scrollbar-none">
                          {allSkills.slice(0, 8).map((sk) => (
                            <button
                              key={sk}
                              type="button"
                              onClick={() => setSelectedSkillFilter(sk)}
                              className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                                selectedSkillFilter === sk
                                  ? "bg-[#6366F1] text-white font-semibold shadow-sm"
                                  : "bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06]"
                              }`}
                            >
                              {sk}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Contributor List */}
                    {loadingFreelancers ? (
                      <div className="space-y-3">
                        <div className="skeleton h-20 w-full rounded-xl" />
                        <div className="skeleton h-20 w-full rounded-xl" />
                      </div>
                    ) : filteredFreelancers.length === 0 ? (
                      <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] space-y-2">
                        <p className="text-xs text-slate-500 font-mono">
                          No contributors found matching "{searchQuery || selectedSkillFilter}".
                        </p>
                        <button
                          type="button"
                          onClick={() => setContributorMode("direct")}
                          className="text-xs font-mono text-[#6366F1] dark:text-[#818CF8] hover:underline font-semibold"
                        >
                          → Enter custom wallet address directly
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                        {filteredFreelancers.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => set("freelancerId", f.id)}
                            className={`w-full text-left rounded-xl border p-3.5 transition-all flex items-center justify-between gap-3 ${
                              form.freelancerId === f.id
                                ? "border-[#6366F1] bg-indigo-50 dark:bg-[#6366F1]/10 shadow-sm ring-1 ring-[#6366F1]"
                                : "border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#141414] hover:border-slate-300 dark:hover:border-white/[0.14]"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar user={f} size="sm" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-slate-900 dark:text-white text-xs">{f.name}</p>
                                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-medium">
                                    Rating {f.rating || 5}/5
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">{f.title}</p>
                                {f.skills && f.skills.length > 0 && (
                                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                                    {f.skills.slice(0, 3).map((sk) => (
                                      <span key={sk} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300">
                                        {sk}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="text-right font-mono shrink-0">
                              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                ${Number(f.hourlyRate || 50).toFixed(0)} USDC/hr
                              </p>
                              <p className="text-[10px] text-slate-500">{f.completedProjects || 0} contracts</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Direct Wallet Input Mode */
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] space-y-3 font-mono text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Contributor Ethereum Wallet Address (0x...)
                      </label>
                      <input
                        type="text"
                        value={directWallet}
                        onChange={(e) => setDirectWallet(e.target.value)}
                        placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#6366F1]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Contributor Name / Label (Optional)
                      </label>
                      <input
                        type="text"
                        value={directName}
                        onChange={(e) => setDirectName(e.target.value)}
                        placeholder="e.g. Satoshi Nakamoto or External Protocol Auditor"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white font-sans focus:outline-none focus:border-[#6366F1]"
                      />
                    </div>
                    {directWallet && (
                      <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 pt-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>Stream will be routed directly to {truncateAddress(directWallet)}</span>
                      </div>
                    )}
                  </div>
                )}
                {errors.freelancerId && <p className="field-error">{errors.freelancerId}</p>}
              </div>

              {/* Escrow Deposit & Deadline in 2 Columns */}
              <div className="grid sm:grid-cols-2 gap-5 pt-2">
                <div>
                  <div className="flex justify-between items-center mb-1 flex-wrap gap-1">
                    <label className="field-label !mb-0">Escrow Deposit ({currencySymbol})</label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5">
                      <span>Wallet:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {displayWalletBalance}
                      </strong>
                      {isWeb3Active ? (
                        <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                          BASE SEPOLIA
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-slate-500 bg-slate-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded">
                          LOCAL SIM
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      className={`input font-mono ${errors.budget ? "input-error" : ""}`}
                      placeholder="500"
                      value={form.budget}
                      onChange={(e) => set("budget", e.target.value)}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500 dark:text-slate-400 font-bold">
                      {currencySymbol}
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
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      ${computedRatePerSec.toFixed(6)} {currencySymbol}/sec (${computedRatePerHr.toFixed(2)}/hr)
                    </span>
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
                  amount={`$${budgetNum.toLocaleString("en-US", { minimumFractionDigits: 2 })} ${currencySymbol}`}
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
                  <span className="text-slate-900 dark:text-white font-medium">
                    {selectedFreelancer?.name} ({truncateAddress(selectedFreelancer?.walletAddress)})
                  </span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-slate-500 dark:text-slate-400">Locked Escrow Vault:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    ${budgetNum.toLocaleString("en-US", { minimumFractionDigits: 2 })} {currencySymbol}
                  </span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-slate-500 dark:text-slate-400">Settlement Rate:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    ${computedRatePerHr.toFixed(2)} {currencySymbol}/hr
                  </span>
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
                className="h-10 px-6 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white font-medium uppercase tracking-wider transition-all shadow-md shadow-indigo-500/20 active:scale-[0.98]"
                onClick={goNext}
              >
                Proceed to {STEPS[step + 1].title} &rarr;
              </button>
            ) : (
              <button
                type="button"
                className="h-10 px-7 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50"
                onClick={handleCreate}
                disabled={submitting}
              >
                {submitting ? "Broadcasting Contract..." : "Deploy Escrow Stream &rarr;"}
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
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  ${budgetNum.toLocaleString("en-US", { minimumFractionDigits: 2 })} {currencySymbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-[11px]">Deadline:</span>
                <span className="text-slate-700 dark:text-slate-300">{form.deadline || "Not set"}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-white/[0.06]">
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {isWeb3Active ? "Base Sepolia Chain ID: 84532" : "EVM Localnet Chain ID: 31337"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
