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
        // API returns newest-first; display oldest-to-newest, top to
        // bottom, so the chain visually grows downward exactly like
        // the block-by-block narrative it represents.
        setChain([...res.chain].reverse());
        setBlockCount(res.blockCount);
        setTampered(res.tampered);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  return (
    <AppLayout title="Blockchain" subtitle="The simulated AVEN-ETH ledger — every event, permanently chained.">
      {error && (
        <div className="rounded-xl bg-danger-50 border border-danger-100 px-4 py-3 text-sm text-danger-700 mb-6">
          {error}
        </div>
      )}

      {!chain && !error && <LoadingGrid count={4} />}

      {chain && (
        <>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-sm text-ink-500">
                <strong className="font-tabular text-ink-900">{blockCount}</strong> blocks mined
              </span>
              {tampered ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-100">
                  CHAIN INTEGRITY: FAILED
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-success-50 text-success-700 ring-1 ring-inset ring-success-100">
                  CHAIN INTEGRITY: OK
                </span>
              )}
            </div>
            <p className="text-xs text-ink-300">
              Real SHA-256 proof-of-work &middot; difficulty 3 &middot; AVEN-ETH Simulation Network
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-0">
            {chain.map((block, i) => (
              <div key={block.blockNumber}>
                <BlockCard block={block} />
                {i < chain.length - 1 && (
                  <div className="flex justify-center py-1.5">
                    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-ink-300">
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
