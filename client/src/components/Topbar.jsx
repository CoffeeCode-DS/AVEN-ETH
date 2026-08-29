import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/client.js";
import { formatEth } from "../utils/format.js";

export default function Topbar({ title, subtitle, onMenuClick }) {
  const [unread, setUnread] = useState(0);
  const [walletBalance, setWalletBalance] = useState(null);
  const navigate = useNavigate();

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
    <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur-md border-b border-border-soft">
      <div className="flex items-center gap-3 px-4 sm:px-8 h-16">
        <button
          onClick={onMenuClick}
          className="lg:hidden -ml-1 p-2 rounded-lg text-ink-600 hover:bg-ink-900/5"
          aria-label="Open menu"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>

        <div className="min-w-0 flex-1">
          {title && <h1 className="font-display font-semibold text-lg text-ink-900 truncate">{title}</h1>}
          {subtitle && <p className="text-sm text-ink-400 truncate">{subtitle}</p>}
        </div>

        {/* Live Wallet Balance Pill */}
        <Link
          to="/wallet"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-ink-900/[0.04] hover:bg-ink-900/[0.08] border border-border-soft text-ink-800 transition-colors text-xs font-semibold"
          title="Open Wallet Hub & Add Funds"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-tabular">
            {walletBalance !== null ? formatEth(walletBalance) : "Wallet"}
          </span>
          <span className="hidden sm:inline-block text-[10px] uppercase font-bold text-accent bg-accent-50 px-1.5 py-0.5 rounded">
            + Funds
          </span>
        </Link>

        {/* Notifications Icon */}
        <button
          onClick={() => navigate("/notifications")}
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          className="relative p-2.5 rounded-xl text-ink-500 hover:bg-ink-900/5 hover:text-ink-800 transition-colors"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
            <path d="M6 8a4 4 0 0 1 8 0c0 3.2 1 4 1 4H5s1-.8 1-4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M8.5 14.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 h-4 min-w-[16px] px-1 rounded-full bg-danger-600 text-white text-[10px] font-bold flex items-center justify-center leading-none">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
