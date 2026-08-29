import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { api } from "../api/client.js";
import { formatEth } from "../utils/format.js";

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
    <header className="sticky top-0 z-30 bg-[#000000]/90 backdrop-blur-md border-b border-white/[0.08] text-slate-100">
      <div className="flex items-center justify-between px-4 sm:px-8 h-16 max-w-7xl mx-auto">
        {/* Left: Mobile Menu & Breadcrumb Title */}
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden -ml-1 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Link to="/dashboard" className="hover:text-white transition-colors flex items-center gap-1">
                <span>Overview</span>
              </Link>
              {location.pathname !== "/dashboard" && (
                <>
                  <span className="text-slate-600">/</span>
                  <span className="text-slate-200 capitalize truncate">
                    {title || location.pathname.replace("/", "")}
                  </span>
                </>
              )}
            </div>
            {subtitle && <p className="text-xs text-slate-400 truncate hidden sm:block mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* Right: Network Status, Live Wallet Balance & Notifications */}
        <div className="flex items-center gap-3">
          {/* EVM Consensus Tag */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A0A0A] border border-white/[0.08] text-[11px] font-mono text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>ETH LOCALNET</span>
          </div>

          {/* Live Wallet Balance Pill */}
          <Link
            to="/wallet"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#0A0A0A] hover:bg-[#141414] border border-white/[0.08] text-slate-200 hover:text-white transition-colors text-xs font-mono"
            title="Open Wallet Hub & Add Funds"
          >
            <span className="text-emerald-400 font-medium">
              {walletBalance !== null ? formatEth(walletBalance) : "0.00 ETH"}
            </span>
            <span className="hidden md:inline-block text-[10px] uppercase font-bold text-[#818CF8] bg-[#6366F1]/15 border border-[#6366F1]/30 px-1.5 py-0.5 rounded">
              Wallet
            </span>
          </Link>

          {/* Notifications Icon */}
          <button
            onClick={() => navigate("/notifications")}
            aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
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
        </div>
      </div>
    </header>
  );
}
