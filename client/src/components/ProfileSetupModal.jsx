import { useState, useRef } from "react";
import Modal from "./Modal.jsx";
import Avatar, {
  getDicebearIdenticon,
  getDicebearBottts,
  getDicebearShapes,
} from "./Avatar.jsx";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { truncateAddress } from "../utils/format.js";

const POPULAR_SKILLS = [
  "Solidity",
  "React",
  "TypeScript",
  "Node.js",
  "EVM",
  "Hardhat",
  "UI/UX",
  "Rust",
  "Python",
  "Smart Contracts",
  "Design Systems",
  "DeFi",
];

const SUGGESTED_TITLES = {
  CLIENT: [
    "Project Lead & Protocol Architect",
    "Engineering Lead & Web3 Client",
    "DeFi Founder & Product Owner",
    "Smart Contract Protocol Lead",
  ],
  FREELANCER: [
    "Senior Smart Contract & EVM Engineer",
    "Full-Stack Web3 & Protocol Contributor",
    "UI/UX & Frontend Design Specialist",
    "Solidity & Security Auditor",
  ],
};

function compressImage(file, maxSize = 160, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image format"));
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function ProfileSetupModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const isClient = user?.role === "CLIENT";
  const fileInputRef = useRef(null);

  const [name, setName] = useState(user?.name || "");
  const [title, setTitle] = useState(user?.title || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [skills, setSkills] = useState(
    Array.isArray(user?.skills) && user.skills.length > 0
      ? user.skills
      : ["Solidity", "React", "TypeScript"]
  );
  const [newSkillInput, setNewSkillInput] = useState("");
  const [hourlyRate, setHourlyRate] = useState(user?.hourlyRate ? String(user.hourlyRate) : "45");
  const [bio, setBio] = useState(user?.bio || "");
  const [saving, setSaving] = useState(false);

  if (!isOpen || !user) return null;

  const baseSeed = user.walletAddress || user.email || user.name || "sidekick";
  const web3Presets = [
    { id: "identicon", label: "Identicon", url: getDicebearIdenticon(baseSeed) },
    { id: "bottts", label: "Cyber Bot", url: getDicebearBottts(baseSeed) },
    { id: "shapes", label: "Geometric", url: getDicebearShapes(baseSeed) },
  ];

  function toggleSkill(skill) {
    if (skills.includes(skill)) {
      setSkills(skills.filter((s) => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  }

  function handleAddCustomSkill(e) {
    e.preventDefault();
    const clean = newSkillInput.trim();
    if (!clean) return;
    if (!skills.includes(clean)) {
      setSkills([...skills, clean]);
    }
    setNewSkillInput("");
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      setAvatar(dataUrl);
      toast.success("Profile photo selected & compressed.");
    } catch (err) {
      toast.error("Failed to process image: " + err.message);
    }
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        title: title.trim() || (isClient ? "Engineering Client" : "Full-Stack Contributor"),
        avatar: avatar || null,
        profileCompleted: true,
      };

      if (!isClient) {
        payload.skills = skills;
        payload.hourlyRate = Number(hourlyRate) || 0;
      }
      if (bio.trim()) {
        payload.bio = bio.trim();
      }

      const res = await api.updateProfile(payload);
      updateUser(res.user);
      toast.success("Profile setup completed! Welcome to Sidekick.");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    try {
      const res = await api.updateProfile({ profileCompleted: true });
      updateUser(res.user);
    } catch {}
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleSkip} size="2xl" noPadding={true}>
      <div className="grid lg:grid-cols-12 min-h-[560px] max-h-[88vh] text-slate-900 dark:text-slate-100 overflow-hidden">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* ========================================================================= */}
        {/* LEFT COLUMN: LIVE IDENTITY PREVIEW & AVATAR PICKER (~40% Width)          */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-slate-50/90 dark:bg-[#07080C] border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/[0.08] p-6 sm:p-7 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            {/* Header Badge */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-[#6366F1]/15 text-[#6366F1] dark:text-[#818CF8] text-[10px] font-mono uppercase tracking-wider border border-indigo-200 dark:border-indigo-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6366F1] animate-pulse" />
                Protocol Identity
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Live Preview
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Real-time card as seen by counterparties on-chain.
              </p>
            </div>

            {/* Live Identity Card */}
            <div className="relative rounded-2xl bg-white dark:bg-[#0E1117] border border-slate-200 dark:border-white/[0.08] p-5 shadow-lg shadow-black/5 dark:shadow-2xl space-y-4 overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

              {/* Avatar + Main Details */}
              <div className="flex items-center gap-3.5">
                <div
                  className="relative group cursor-pointer shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to upload custom photo"
                >
                  <Avatar
                    user={user}
                    avatarUrl={avatar}
                    name={name}
                    size="lg"
                    rounded="rounded-2xl"
                    showBorder
                    className="shadow-md shadow-indigo-500/15 ring-2 ring-indigo-500/20"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-150 flex flex-col items-center justify-center text-white text-[9px] font-mono">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 mb-0.5">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span>Edit</span>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {name.trim() || "Anonymous Contributor"}
                    </p>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/20 text-[#6366F1] dark:text-[#818CF8] border border-indigo-200 dark:border-indigo-500/30">
                      {user.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
                    {title.trim() || (isClient ? "Engineering Client" : "Smart Contract Engineer")}
                  </p>
                </div>
              </div>

              {/* Card Meta Stats */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-white/[0.06] text-xs font-mono">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.03]">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                    {isClient ? "Protocol Role" : "Hourly Rate"}
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {isClient ? "Disbursing" : `${hourlyRate || "0"} USDC/hr`}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.03]">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Wallet</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5 truncate">
                    {truncateAddress(user.walletAddress)}
                  </p>
                </div>
              </div>

              {/* Skills Tags Preview */}
              {!isClient && skills.length > 0 && (
                <div className="pt-1">
                  <div className="flex flex-wrap gap-1">
                    {skills.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-[10px] font-mono text-slate-600 dark:text-slate-300"
                      >
                        {s}
                      </span>
                    ))}
                    {skills.length > 4 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-[10px] font-mono text-slate-400">
                        +{skills.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar Selection & Presets */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 dark:text-slate-400">Avatar Selection:</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] text-[#6366F1] dark:text-[#818CF8] hover:underline font-medium"
                >
                  Upload Device Photo
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {web3Presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setAvatar(preset.url)}
                    className={`p-1.5 rounded-xl border text-center transition-all flex items-center justify-center gap-1.5 ${
                      avatar === preset.url
                        ? "border-[#6366F1] bg-indigo-50 dark:bg-[#6366F1]/20 ring-1 ring-[#6366F1]"
                        : "border-slate-200 dark:border-white/[0.08] hover:border-slate-300 bg-white dark:bg-[#0E1117]"
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="h-5 w-5 rounded-md bg-[#6366F1]" />
                    <span className="text-[10px] font-mono text-slate-700 dark:text-slate-300">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-mono mt-4 border-t border-slate-200/80 dark:border-white/[0.06] pt-3 leading-relaxed">
            Non-custodial identity anchored to Ethereum address {truncateAddress(user.walletAddress)}.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: SPACIOUS MINIMALIST SETUP FORM (~60% Width)                 */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0A0A0A] p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Top Form Header */}
            <div className="flex items-start justify-between pb-4 mb-5 border-b border-slate-200 dark:border-white/[0.06]">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Profile Setup
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure your cryptographic presence for escrow agreements &amp; streams.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs font-mono text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors pt-1"
              >
                Skip &rarr;
              </button>
            </div>

            <form onSubmit={handleSubmit} id="profile-setup-form" className="space-y-4">
              {/* Row 1: Name & Professional Title */}
              <div className="grid sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 mb-1.5 font-medium">
                    Full Name / Alias <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Vance"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs font-sans focus:outline-none focus:border-[#6366F1] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 mb-1.5 font-medium">
                    Professional Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={isClient ? "Engineering Lead & Client" : "Senior Smart Contract Engineer"}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs font-sans focus:outline-none focus:border-[#6366F1] transition-colors"
                  />
                </div>
              </div>

              {/* Title Suggestions Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-400">Suggestions:</span>
                {(SUGGESTED_TITLES[user.role] || []).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTitle(t)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md transition-colors ${
                      title === t
                        ? "bg-[#6366F1]/15 text-[#6366F1] dark:text-[#818CF8] border border-[#6366F1]/30 font-medium"
                        : "bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    + {t}
                  </button>
                ))}
              </div>

              {/* Row 2: Hourly Rate & Bio */}
              <div className="grid sm:grid-cols-2 gap-3.5">
                {!isClient && (
                  <div>
                    <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 mb-1.5 font-medium">
                      Target Rate (USDC / hr)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        placeholder="50"
                        className="w-full pl-3.5 pr-24 py-2.5 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-[#6366F1] transition-colors"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-400 font-medium pointer-events-none">
                        USDC / hr
                      </span>
                    </div>
                  </div>
                )}

                <div className={isClient ? "sm:col-span-2" : ""}>
                  <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 mb-1.5 font-medium">
                    Short Bio / Statement
                  </label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={isClient ? "e.g. Protocol founder looking for EVM talent" : "e.g. EVM smart contracts, DeFi vaults & security"}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs font-sans focus:outline-none focus:border-[#6366F1] transition-colors"
                  />
                </div>
              </div>

              {/* Row 3: Skills Selection (Freelancers) */}
              {!isClient && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                      Core Technical Skills
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      {skills.length} selected
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_SKILLS.map((sk) => {
                      const selected = skills.includes(sk);
                      return (
                        <button
                          key={sk}
                          type="button"
                          onClick={() => toggleSkill(sk)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                            selected
                              ? "bg-[#6366F1] text-white shadow-sm font-medium"
                              : "bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06]"
                          }`}
                        >
                          {selected ? "✓ " : "+ "}
                          {sk}
                        </button>
                      );
                    })}
                  </div>

                  {/* Inline Custom Skill Input */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomSkill(e);
                        }
                      }}
                      placeholder="Add custom skill (e.g. Cairo, Subgraph)..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#6366F1]"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomSkill}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-xs font-mono font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Bottom Action Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between mt-5">
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs font-mono text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              I'll do this later
            </button>

            <button
              type="submit"
              form="profile-setup-form"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white font-medium text-xs font-mono shadow-md shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <span>Save &amp; Complete Setup &rarr;</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
