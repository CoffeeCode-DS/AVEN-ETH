import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { api } from "../api/client.js";
import { formatEth } from "../utils/format.js";
import ThemeToggle from "./ThemeToggle.jsx";

export default function Topbar({ title, subtitle, onMenuClick }) {
  const [unread, setUnread] = useState(0);
  const [walletBalance, setWalletBalance] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    function load() {
      api
        .notifications()
        .then((res) => {
          if (!cancelled) setUnread(res.unreadCount);
        })
        .catch(() => {});

      api
        .wallet()
        .then((res) => {
          if (!cancelled) setWalletBalance(res.wallet?.availableBalance);
        })
        .catch(() => {});
    }
    load();
    const interval = setInterval(load, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#000000]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-100 transition-colors duration-150">
      <div className="flex items-center justify-between px-4 sm:px-8 h-16 max-w-7xl mx-auto">
        {/* Left: Mobile Menu & Breadcrumb Title */}
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden -ml-1 p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors"
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
              <Link to="/dashboard" className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1 font-medium">
                <span>Overview</span>
              </Link>
              {location.pathname !== "/dashboard" && (
                <>
                  <span className="text-slate-400 dark:text-slate-600">/</span>
                  <span className="text-slate-800 dark:text-slate-200 capitalize truncate font-medium">
                    {title || location.pathname.replace("/", "")}
                  </span>
                </>
              )}
            </div>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:block mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* Right: Network Status, Live Wallet Balance, Notifications & Theme Switcher Icon */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* EVM Consensus Tag */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] text-[11px] font-mono text-slate-700 dark:text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>ETH LOCALNET</span>
          </div>

          {/* Live Wallet Balance Pill */}
          <Link
            to="/wallet"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#0A0A0A] dark:hover:bg-[#141414] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-mono shadow-sm"
            title="Open Wallet Hub & Add Funds"
          >
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {walletBalance !== null ? formatEth(walletBalance) : "0.00 ETH"}
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold text-[#6366F1] dark:text-[#818CF8] bg-indigo-50 dark:bg-[#6366F1]/15 border border-indigo-200 dark:border-[#6366F1]/30 px-1.5 py-0.5 rounded">
              Wallet
            </span>
          </Link>

          {/* Notifications Icon Button */}
          <button
            onClick={() => navigate("/notifications")}
            aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {unread > 0 && (
              <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold flex items-center justify-center leading-none shadow-md">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {/* Single Theme Switch Icon right next to Notifications */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
