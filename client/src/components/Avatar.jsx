import { useState } from "react";

export function getDicebearIdenticon(seed) {
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(seed || "sidekick")}&backgroundColor=6366f1,4f46e5,4338ca`;
}

export function getDicebearBottts(seed) {
  return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(seed || "sidekick")}&backgroundColor=6366f1,4f46e5,4338ca`;
}

export function getDicebearShapes(seed) {
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(seed || "sidekick")}&backgroundColor=6366f1,4f46e5,4338ca`;
}

export function getInitials(name) {
  if (!name) return "SK";
  return (
    name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "SK"
  );
}

export default function Avatar({
  user,
  avatarUrl,
  name,
  seed,
  size = "md",
  className = "",
  rounded = "rounded-full",
  showBorder = false,
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const rawAvatar = avatarUrl || user?.avatar;
  const userName = name || user?.name || "";
  const userSeed = seed || user?.walletAddress || user?.email || userName || "sidekick";
  const initials = getInitials(
    userName || (typeof rawAvatar === "string" && rawAvatar.length <= 3 ? rawAvatar : "SK")
  );

  const isExplicitImage =
    typeof rawAvatar === "string" &&
    (rawAvatar.startsWith("data:image/") ||
      rawAvatar.startsWith("http://") ||
      rawAvatar.startsWith("https://"));

  // Default display: user's custom image URL if set; otherwise deterministic Web3 Identicon
  const displaySrc =
    isExplicitImage && !imageFailed ? rawAvatar : getDicebearIdenticon(userSeed);

  const sizeClasses = {
    xs: "h-5 w-5 text-[9px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-xl font-bold",
    "2xl": "h-20 w-20 text-2xl font-bold",
  };

  const dimClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden select-none bg-[#6366F1] text-white font-medium ${rounded} ${dimClass} ${
        showBorder ? "ring-2 ring-indigo-500/30 dark:ring-indigo-400/20" : ""
      } ${className}`}
    >
      {!imageFailed ? (
        <img
          src={displaySrc}
          alt={userName || "Avatar"}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="flex items-center justify-center uppercase tracking-wider font-semibold">
          {initials}
        </span>
      )}
    </div>
  );
}
