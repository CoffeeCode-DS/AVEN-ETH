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
    <Modal isOpen={isOpen} onClose={handleSkip} title="Let's set up your profile first!" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Banner */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-[#6366F1]/10 border border-indigo-200 dark:border-indigo-500/25 flex items-start gap-3.5">
          <span className="h-2 w-2 rounded-full bg-[#6366F1] animate-pulse mt-1.5 shrink-0" />
          <div className="min-w-0 flex-1 text-xs">
            <p className="font-semibold text-slate-900 dark:text-white">
              Welcome to Sidekick ({user.role})!
            </p>
            <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
              Complete your cryptographic identity so counterparties can discover your skills, verify your work on-chain, and stream payments.
            </p>
          </div>
        </div>

        {/* 1. Avatar / Photo Selector */}
        <div className="space-y-3">
          <label className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            1. Profile Photo &amp; Web3 Avatar
          </label>
          <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08]">
            <Avatar
              user={user}
              avatarUrl={avatar}
              name={name}
              size="xl"
              rounded="rounded-2xl"
              showBorder
              className="shadow-md shadow-indigo-500/20 shrink-0"
            />
            <div className="space-y-2 flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E1E1E] hover:bg-slate-100 dark:hover:bg-[#282828] text-slate-800 dark:text-slate-200 text-xs font-mono font-medium border border-slate-200 dark:border-white/[0.08] transition-colors"
                >
                  Browse Device Photo
                </button>
                <span className="text-[11px] text-slate-400 font-mono">or pick a Web3 preset:</span>
              </div>

              {/* Web3 Identicon Presets */}
              <div className="flex items-center gap-2">
                {web3Presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setAvatar(preset.url)}
                    className={`p-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                      avatar === preset.url
                        ? "border-[#6366F1] bg-indigo-50 dark:bg-[#6366F1]/20 ring-1 ring-[#6366F1]"
                        : "border-slate-200 dark:border-white/[0.08] hover:border-slate-300 bg-white dark:bg-[#1A1A1A]"
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="h-6 w-6 rounded-lg bg-[#6366F1]" />
                    <span className="text-[10px] font-mono text-slate-700 dark:text-slate-300">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Name & Title */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 mb-1.5">
              Full Name / Handle
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Vance"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs font-sans focus:outline-none focus:border-[#6366F1]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 mb-1.5">
              Professional Role / Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isClient ? "Engineering Lead & Client" : "Senior Smart Contract Engineer"}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs font-sans focus:outline-none focus:border-[#6366F1]"
            />
          </div>
        </div>

        {/* Quick Title Suggestions */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono text-slate-400">Suggestions:</span>
          {(SUGGESTED_TITLES[user.role] || []).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTitle(t)}
              className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-300 transition-colors"
            >
              + {t}
            </button>
          ))}
        </div>

        {/* 3. Skills (Freelancers) */}
        {!isClient && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                2. Engineering Skills &amp; Competencies
              </label>
              <span className="text-[11px] font-mono text-slate-400">{skills.length} selected</span>
            </div>

            {/* Popular Chips */}
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
                        ? "bg-[#6366F1] text-white shadow-sm"
                        : "bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.06]"
                    }`}
                  >
                    {selected ? "✓ " : "+ "}
                    {sk}
                  </button>
                );
              })}
            </div>

            {/* Custom Skill Input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                placeholder="Add other skill (e.g. Zero-Knowledge, GraphQL)..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#6366F1]"
              />
              <button
                type="button"
                onClick={handleAddCustomSkill}
                className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/[0.08] dark:hover:bg-white/[0.12] text-xs font-mono text-slate-700 dark:text-slate-300"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* 4. Hourly Rate (Freelancer) / Bio */}
        <div className="grid sm:grid-cols-2 gap-4">
          {!isClient && (
            <div>
              <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 mb-1.5">
                Target Hourly Rate (USDC / hr)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="50"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-[#6366F1]"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 font-bold">
                  USDC/hr
                </span>
              </div>
            </div>
          )}

          <div className={isClient ? "sm:col-span-2" : ""}>
            <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 mb-1.5">
              Short Bio / About (Optional)
            </label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief summary or link to GitHub / Twitter..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs font-sans focus:outline-none focus:border-[#6366F1]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/[0.06] font-mono text-xs">
          <button
            type="button"
            onClick={handleSkip}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline transition-colors"
          >
            I'll do this later
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white font-medium shadow-md shadow-indigo-500/25 transition-all disabled:opacity-50"
          >
            {saving ? "Saving Profile..." : "Save & Complete Setup"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
