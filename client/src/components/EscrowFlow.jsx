function Node({ label, sub, active }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center w-24">
      <div
        className={`h-11 w-11 rounded-full flex items-center justify-center text-xs font-mono font-bold border-2 transition-all ${
          active ? "border-[#6366F1] text-white bg-[#6366F1]/20 shadow-lg shadow-indigo-500/30" : "border-white/[0.1] text-slate-400 bg-[#141414]"
        }`}
      >
        {label}
      </div>
      <span className="text-[11px] font-mono text-slate-400 leading-tight truncate max-w-[90px]">{sub}</span>
    </div>
  );
}

export default function EscrowFlow({ fromLabel, fromName, toLabel, toName, amount, active = false }) {
  return (
    <div className="flex items-center justify-center gap-3 py-2">
      <Node label={fromLabel} sub={fromName} active={active} />
      <div className="flex-1 max-w-[120px] flex flex-col items-center gap-1.5 font-mono text-xs">
        <span className="text-slate-300 font-semibold whitespace-nowrap">{amount}</span>
        <div className={`escrow-line w-full ${active ? "escrow-line--active" : ""}`}>
          {active && <span className="escrow-pulse" />}
        </div>
      </div>
      <Node label="VAULT" sub="Stream Vault" active={active} />
      <div className="flex-1 max-w-[120px] flex flex-col items-center gap-1.5 font-mono text-xs">
        <span className="text-slate-300 font-semibold whitespace-nowrap">{amount}</span>
        <div className={`escrow-line w-full ${active ? "escrow-line--active" : ""}`}>
          {active && <span className="escrow-pulse" />}
        </div>
      </div>
      <Node label={toLabel} sub={toName} active={active} />
    </div>
  );
}
