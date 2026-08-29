import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatEth } from "../utils/format.js";

export default function StreamingMeter({
  agreement,
  isFreelancer,
  onClaim,
  claiming,
}) {
  const [liveEarned, setLiveEarned] = useState(agreement?.earnedAmount || 0);

  const budget = agreement?.budget || 0;
  const ratePerSec = Number(agreement?.ratePerSecond || 0);
  const totalWithdrawn = Number(agreement?.totalWithdrawn || 0);
  const sessionStatus = agreement?.session?.status || "IDLE";
  const isSessionRunning = sessionStatus === "RUNNING";
  const isStreaming = isSessionRunning && agreement?.status === "IN_PROGRESS";
  const isPaused = agreement?.status === "PAUSED" || sessionStatus === "PAUSED";
  const isCompleted = agreement?.status === "COMPLETED";

  useEffect(() => {
    setLiveEarned(agreement?.earnedAmount || 0);

    // ONLY tick if the worker is actively in a RUNNING work session!
    if (!isStreaming || ratePerSec <= 0) return;

    const interval = setInterval(() => {
      setLiveEarned((prev) => {
        const next = prev + ratePerSec;
        return Math.min(budget, Math.round(next * 1000000) / 1000000);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [agreement?.earnedAmount, isStreaming, ratePerSec, budget]);

  const liveAvailable = Math.max(0, Math.round((liveEarned - totalWithdrawn) * 10000) / 10000);
  const claimedPercent = budget > 0 ? Math.min(100, Math.round((totalWithdrawn / budget) * 100)) : 0;
  const availablePercent = budget > 0 ? Math.min(100 - claimedPercent, Math.round((liveAvailable / budget) * 100)) : 0;
  const remainingPercent = Math.max(0, 100 - claimedPercent - availablePercent);

  const ratePerHr = ratePerSec * 3600;

  return (
    <div className="card p-6 bg-navy-900 !border-navy-800 text-white relative overflow-hidden">
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-accent/25 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

      <div className="relative flex items-center justify-between gap-4 flex-wrap mb-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            {isStreaming && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                isStreaming
                  ? "bg-emerald-500"
                  : isPaused
                  ? "bg-amber-400"
                  : isCompleted
                  ? "bg-sky-400"
                  : "bg-slate-400"
              }`}
            />
          </span>
          <span className="text-xs font-semibold tracking-wider uppercase text-white/70">
            {isStreaming
              ? "⚡ Live Work Tracking & Stream Active"
              : isPaused
              ? "Stream / Session Paused"
              : isCompleted
              ? "Stream Fully Settled"
              : "Stream Standby (Timer is Idle in Work Session)"}
          </span>
        </div>

        <div className="text-xs text-white/60 bg-white/10 px-2.5 py-1 rounded-full font-tabular">
          Flow Rate: <span className="text-white font-medium">{ratePerSec > 0 ? `${formatEth(ratePerHr)}/hr` : "0.00 ETH/hr"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6 pt-2">
        <div>
          <p className="text-xs text-white/50 mb-1">Total Accrued (Earned)</p>
          <p className="font-tabular text-3xl sm:text-4xl font-bold tracking-tight text-white">
            {formatEth(liveEarned)}
          </p>
          <p className="text-xs text-white/40 mt-1">
            of <span className="text-white/70 font-tabular">{formatEth(budget)}</span> total deposit
          </p>
        </div>

        <div>
          <p className="text-xs text-white/50 mb-1">Claimable Available</p>
          <p className="font-tabular text-3xl sm:text-4xl font-bold tracking-tight text-emerald-400">
            {formatEth(liveAvailable)}
          </p>
          <p className="text-xs text-white/40 mt-1">ready for instant withdrawal</p>
        </div>

        <div>
          <p className="text-xs text-white/50 mb-1">Already Withdrawn</p>
          <p className="font-tabular text-3xl sm:text-4xl font-bold tracking-tight text-white/80">
            {formatEth(totalWithdrawn)}
          </p>
          <p className="text-xs text-white/40 mt-1">settled to wallet</p>
        </div>
      </div>

      {/* Visual Multi-segment Progress Bar */}
      <div className="space-y-2 mt-4">
        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${claimedPercent}%` }}
            className="bg-sky-500 transition-all duration-500"
            title={`Claimed: ${claimedPercent}%`}
          />
          <div
            style={{ width: `${availablePercent}%` }}
            className="bg-emerald-400 transition-all duration-300 animate-pulse"
            title={`Available: ${availablePercent}%`}
          />
          <div
            style={{ width: `${remainingPercent}%` }}
            className="bg-white/15 transition-all duration-500"
            title={`Remaining in Vault: ${remainingPercent}%`}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-white/50">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-500" /> Settled ({claimedPercent}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Claimable ({availablePercent}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white/30" /> In Vault ({remainingPercent}%)
          </span>
        </div>
      </div>

      {/* Claim Action for Freelancer */}
      {isFreelancer && liveAvailable > 0.0001 && (
        <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-white/70">
            You have <strong className="text-emerald-400 font-tabular">{formatEth(liveAvailable)}</strong> accrued that can be claimed on-chain now.
          </p>
          <button
            onClick={() => onClaim(liveAvailable)}
            disabled={claiming}
            className="btn-primary !bg-emerald-500 hover:!bg-emerald-600 !text-navy-950 font-semibold shadow-lg shadow-emerald-500/20"
          >
            {claiming ? "Mining Claim Tx..." : `Claim ${formatEth(liveAvailable)}`}
          </button>
        </div>
      )}
    </div>
  );
}
