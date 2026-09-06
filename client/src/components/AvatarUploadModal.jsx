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

// Compresses and resizes any uploaded image file down to max 160x160 JPEG
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

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve({
          dataUrl,
          originalSizeKb: Math.round(file.size / 1024),
          compressedSizeKb: Math.round((dataUrl.length * 3) / 4 / 1024),
        });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function AvatarUploadModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState("upload"); // "upload" | "url" | "web3"
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || "");
  const [previewMeta, setPreviewMeta] = useState(null);
  const [urlInput, setUrlInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [randomSeed, setRandomSeed] = useState(Date.now().toString());

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const baseSeed = user?.walletAddress || user?.email || "sidekick";

  const web3Presets = [
    {
      id: "identicon-wallet",
      label: "Wallet Identicon",
      url: getDicebearIdenticon(baseSeed),
    },
    {
      id: "bottts-wallet",
      label: "Cyber Bot",
      url: getDicebearBottts(baseSeed),
    },
    {
      id: "shapes-wallet",
      label: "Geometric Shapes",
      url: getDicebearShapes(baseSeed),
    },
    {
      id: "random-identicon",
      label: "Random Hash",
      url: getDicebearIdenticon(`${baseSeed}-${randomSeed}`),
    },
    {
      id: "random-bot",
      label: "Random Bot",
      url: getDicebearBottts(`${baseSeed}-${randomSeed}`),
    },
    {
      id: "random-shapes",
      label: "Random Shapes",
      url: getDicebearShapes(`${baseSeed}-${randomSeed}`),
    },
  ];

  async function handleFileProcess(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (PNG, JPG, WEBP).");
      return;
    }
    try {
      const result = await compressImage(file);
      setSelectedAvatar(result.dataUrl);
      setPreviewMeta(result);
      toast.success(`Image compressed: ${result.originalSizeKb} KB -> ${result.compressedSizeKb} KB`);
    } catch (err) {
      toast.error("Failed to process image: " + err.message);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  }

  function handleApplyUrl() {
    if (!urlInput.trim()) return;
    const url = urlInput.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      toast.error("Please enter a valid HTTP or HTTPS image URL.");
      return;
    }
    setSelectedAvatar(url);
    setPreviewMeta(null);
  }

  async function handleSave() {
    try {
      setSaving(true);
      const res = await api.updateProfile({ avatar: selectedAvatar });
      updateUser(res.user);
      toast.success("Profile photo updated successfully!");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to update profile photo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetToDefault() {
    try {
      setSaving(true);
      const res = await api.updateProfile({ avatar: null });
      updateUser(res.user);
      setSelectedAvatar("");
      setPreviewMeta(null);
      toast.success("Avatar reset to default on-chain identicon.");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to reset avatar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Profile Photo" size="md">
      <div className="space-y-6">
        {/* Current Live Preview Banner */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08]">
          <Avatar
            user={user}
            avatarUrl={selectedAvatar}
            size="xl"
            rounded="rounded-2xl"
            showBorder
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Live Preview
            </p>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {user?.name}
            </h4>
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
              {previewMeta
                ? `Compressed: ${previewMeta.compressedSizeKb} KB`
                : selectedAvatar
                ? "Custom Avatar Selected"
                : "Default Identicon (Wallet-seeded)"}
            </p>
          </div>
          {selectedAvatar && (
            <button
              type="button"
              onClick={handleResetToDefault}
              disabled={saving}
              className="text-xs text-rose-500 hover:text-rose-600 font-mono underline shrink-0"
            >
              Reset
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-white/[0.04] p-1 text-xs font-mono border border-slate-200 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={() => setTab("upload")}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
              tab === "upload"
                ? "bg-white dark:bg-[#1A1A1A] text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Direct Upload
          </button>
          <button
            type="button"
            onClick={() => setTab("url")}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
              tab === "url"
                ? "bg-white dark:bg-[#1A1A1A] text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Image URL
          </button>
          <button
            type="button"
            onClick={() => setTab("web3")}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
              tab === "web3"
                ? "bg-white dark:bg-[#1A1A1A] text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Web3 Presets
          </button>
        </div>

        {/* Tab 1: Upload File with in-browser compression */}
        {tab === "upload" && (
          <div className="space-y-3">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-[#6366F1] bg-indigo-50/50 dark:bg-[#6366F1]/10"
                  : "border-slate-300 dark:border-white/[0.12] hover:border-[#6366F1] hover:bg-slate-50 dark:hover:bg-white/[0.02]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
              />
              <div className="mx-auto h-10 w-10 rounded-xl bg-indigo-50 dark:bg-[#6366F1]/15 text-[#6366F1] flex items-center justify-center mb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Click to browse or drop an image here
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                PNG, JPG, or WEBP. Auto-cropped &amp; compressed to ~10 KB.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Image URL (Cloudinary, Imgur, GitHub, etc.) */}
        {tab === "url" && (
          <div className="space-y-3 font-mono text-xs">
            <p className="text-slate-500 dark:text-slate-400">
              Paste a public image link from Cloudinary, Imgur, GitHub, or any CDN:
            </p>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1]"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/[0.08] dark:hover:bg-white/[0.12] text-slate-800 dark:text-slate-200 font-medium transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Web3 Presets (Option 3) */}
        {tab === "web3" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Algorithmic identities generated from cryptographic hash:
              </p>
              <button
                type="button"
                onClick={() => setRandomSeed(Date.now().toString())}
                className="text-[11px] font-mono text-[#6366F1] dark:text-[#818CF8] hover:underline"
              >
                Shuffle Seeds
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {web3Presets.map((preset) => {
                const isSelected = selectedAvatar === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedAvatar(preset.url);
                      setPreviewMeta(null);
                    }}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                      isSelected
                        ? "border-[#6366F1] bg-indigo-50/40 dark:bg-[#6366F1]/15 ring-2 ring-[#6366F1]/30"
                        : "border-slate-200 dark:border-white/[0.08] hover:border-slate-400 dark:hover:border-white/[0.2] bg-white dark:bg-[#141414]"
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="h-12 w-12 rounded-xl object-cover bg-[#6366F1]"
                    />
                    <span className="text-[10px] font-mono font-medium text-slate-700 dark:text-slate-300 truncate w-full">
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/[0.06] font-mono text-xs">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#141414] dark:hover:bg-[#1F1F1F] text-slate-700 dark:text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white font-medium shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Avatar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
