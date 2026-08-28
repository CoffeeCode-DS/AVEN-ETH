function Node({ label, sub, active }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center w-24">
      <div
        className={`h-11 w-11 rounded-full flex items-center justify-center text-sm font-semibold font-display border-2 ${
          active ? "border-accent text-accent bg-accent-50" : "border-border text-ink-400 bg-white"
        }`}
      >
        {label}
      </div>
      <span className="text-xs text-ink-500 leading-tight">{sub}</span>
    </div>
  );
}

/**
 * The app's signature motif: Client -> escrow contract -> Freelancer,
 * with an animated pulse traveling the line whenever `active` is true
 * (funding just happened, or payment is releasing).
 */
export default function EscrowFlow({ fromLabel, fromName, toLabel, toName, amount, active = false }) {
  return (
    <div className="flex items-center justify-center gap-3 py-2">
      <Node label={fromLabel} sub={fromName} active={active} />
      <div className="flex-1 max-w-[120px] flex flex-col items-center gap-1.5">
        <span className="font-tabular text-xs font-medium text-ink-600 whitespace-nowrap">{amount}</span>
        <div className={`escrow-line w-full ${active ? "escrow-line--active" : ""}`}>
          {active && <span className="escrow-pulse" />}
        </div>
      </div>
      <Node label="ESC" sub="Escrow Contract" active={active} />
      <div className="flex-1 max-w-[120px] flex flex-col items-center gap-1.5">
        <span className="font-tabular text-xs font-medium text-ink-600 whitespace-nowrap">{amount}</span>
        <div className={`escrow-line w-full ${active ? "escrow-line--active" : ""}`}>
          {active && <span className="escrow-pulse" />}
        </div>
      </div>
      <Node label={toLabel} sub={toName} active={active} />
    </div>
  );
}
