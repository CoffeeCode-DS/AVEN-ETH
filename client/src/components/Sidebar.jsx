import React from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ICONS = {
  overview: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  ),
  agreements: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
    </svg>
  ),
  work: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" x2="20" y1="19" y2="19" />
    </svg>
  ),
  attestations: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  ),
  reputation: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  transactions: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M7 10v12" />
      <path d="M15 14v8" />
      <path d="m3 6 4-4 4 4" />
      <path d="m11 18 4 4 4-4" />
    </svg>
  ),
  blockchain: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  security: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  notifications: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

function navItemsFor(role) {
  const common = [
    { to: "/dashboard", label: "Overview", icon: ICONS.overview, end: true },
    { to: "/wallet", label: "Wallet & Funds", icon: ICONS.wallet },
    { to: "/agreements", label: "Payment Streams", icon: ICONS.agreements },
  ];

  if (role === "FREELANCER") {
    common.push({ to: "/work-sessions", label: "Work Sessions", icon: ICONS.work });
  }

  common.push(
    { to: "/attestations", label: "Attestations", icon: ICONS.attestations },
    { to: "/reputation", label: role === "FREELANCER" ? "My Reputation" : "Reputation", icon: ICONS.reputation },
    { to: "/transactions", label: "Transactions", icon: ICONS.transactions },
    { to: "/blockchain", label: "Blockchain", icon: ICONS.blockchain },
    { to: "/security", label: "Security & Proofs", icon: ICONS.security },
    { to: "/notifications", label: "Notifications", icon: ICONS.notifications },
    { to: "/profile", label: "Profile", icon: ICONS.profile }
  );

  return common;
}

export function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  const items = navItemsFor(user?.role || "CLIENT");

  return (
    <div className="flex flex-col h-full bg-[#000000] text-slate-300 font-sans border-r border-white/[0.08]">
      {/* Brand Header */}
      <div className="px-5 pt-6 pb-5 flex items-center justify-between border-b border-white/[0.08]">
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="h-7 w-7 rounded-full bg-[#6366F1] flex items-center justify-center p-1 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white">
              <path d="M12 2L3 7L12 12L21 7L12 2Z" fill="currentColor" />
              <path d="M3 17L12 22L21 17" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <span className="font-normal text-[20px] tracking-tight text-white lowercase font-sans">aven</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-normal transition-all ${
                isActive
                  ? "bg-white/[0.1] text-white shadow-sm font-medium"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
              }`
            }
          >
            <span className="text-slate-400 group-hover:text-white">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Network Status Card */}
      <div className="p-3 mx-3 mb-3 rounded-xl bg-[#0A0A0A] border border-white/[0.08]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">ETH LOCALNET</span>
        </div>
        <p className="text-[11px] text-slate-300 font-mono mt-1 font-medium">Chain ID: 31337 &middot; PoW</p>
        <Link
          to="/blockchain"
          onClick={onNavigate}
          className="text-[11px] text-[#818CF8] hover:underline mt-2 inline-block font-mono"
        >
          Explore ledger &rarr;
        </Link>
      </div>

      {/* User Profile Pill at Bottom */}
      <div className="p-3 border-t border-white/[0.08]">
        <div className="flex items-center justify-between gap-2.5 p-2 rounded-xl hover:bg-white/[0.04] transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-[#6366F1] flex items-center justify-center text-xs font-semibold text-white shadow-md flex-shrink-0">
              {user?.avatar || "AV"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate">{user?.name || "User"}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email || "user@aven.dev"}</p>
            </div>
          </div>

          <button
            onClick={logout}
            aria-label="Sign out"
            title="Sign out"
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors flex-shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-[240px] shrink-0 bg-[#000000] h-screen sticky top-0 border-r border-white/[0.08] z-40">
      <SidebarContent />
    </aside>
  );
}
