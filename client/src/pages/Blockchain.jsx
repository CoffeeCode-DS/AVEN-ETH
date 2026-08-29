import { useEffect, useState } from "react";
import AppLayout from "../layouts/AppLayout.jsx";
import { api } from "../api/client.js";
import BlockCard from "../components/BlockCard.jsx";
import LoadingGrid from "../components/LoadingSkeleton.jsx";

export default function Blockchain() {
  const [chain, setChain] = useState(null);
  const [blockCount, setBlockCount] = useState(0);
  const [tampered, setTampered] = useState(false);
  const [error, setError] = useState(null);

  function load() {
    api
      .blockchain()
      .then((res) => {
        setChain([...res.chain].reverse());
        setBlockCount(res.blockCount);
        setTampered(res.tampered);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  return (
    <AppLayout title="Blockchain Ledger" subtitle="The simulated AVEN-ETH ledger — every event and payment, permanently chained.">
      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-xs font-mono text-rose-400 mb-6">
          {error}
        </div>
      )}

      {!chain && !error && <LoadingGrid count={4} />}

      {chain && (
        <>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono text-slate-400">
                <strong className="text-white font-bold">{blockCount}</strong> blocks mined
              </span>
              {tampered ? (
                <span className="text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  CHAIN INTEGRITY: FAILED
                </span>
              ) : (
                <span className="text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  CHAIN INTEGRITY: OK
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono text-slate-500">
              SHA-256 Proof-of-Work Blocks &middot; Difficulty 3 &middot; Chain ID: 31337
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-0">
            {chain.map((block, i) => (
              <div key={block.blockNumber}>
                <BlockCard block={block} />
                {i < chain.length - 1 && (
                  <div className="flex justify-center py-2">
                    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-slate-600">
                      <path d="M10 4v10m0 0-4-4m4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </AppLayout>
  );
}
