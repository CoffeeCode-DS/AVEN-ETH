import { useEffect, useMemo, useState } from "react";
import AppLayout from "../layouts/AppLayout.jsx";
import { api } from "../api/client.js";
import BlockCard from "../components/BlockCard.jsx";
import LoadingGrid from "../components/LoadingSkeleton.jsx";

export default function Blockchain() {
  const [chain, setChain] = useState(null);
  const [blockCount, setBlockCount] = useState(0);
  const [tampered, setTampered] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

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

  const filteredBlocks = useMemo(() => {
    if (!chain) return [];
    if (!search.trim()) return chain;
    const q = search.toLowerCase().trim();
    return chain.filter(
      (b) =>
        b.blockNumber.toString() === q ||
        b.hash?.toLowerCase().includes(q) ||
        b.previousHash?.toLowerCase().includes(q) ||
        b.type?.toLowerCase().includes(q) ||
        b.projectTitle?.toLowerCase().includes(q)
    );
  }, [chain, search]);

  return (
    <AppLayout
      title="Blockchain Ledger"
      subtitle="The immutable AVEN-ETH Proof-of-Work blockchain — every stream deposit, commit proof, and claim permanently linked."
    >
      {/* 4-Bento Blockchain Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 font-mono">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl">
          <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Block Height</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">{blockCount}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Total verified blocks</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl">
          <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Consensus Engine</p>
          <p className="text-2xl font-bold text-[#6366F1] dark:text-[#818CF8] mt-1.5">SHA-256 PoW</p>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">Zero-Trust Merkle Tree</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl">
          <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Chain Integrity</p>
          <p
            className={`text-2xl font-bold mt-1.5 ${
              tampered ? "text-rose-500 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {tampered ? "FAILED" : "VERIFIED"}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Cryptographic Link OK</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl">
          <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Mining Difficulty</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">3 (000...)</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">EVM Localnet ID: 31337</p>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#141414] dark:hover:bg-[#1F1F1F] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] text-xs font-mono font-medium uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            Sync Chain
          </button>
        </div>

        <div className="relative min-w-[260px]">
          <input
            type="text"
            className="input font-mono text-xs pl-9 pr-4 py-2"
            placeholder="Search block # or hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-xs font-mono text-rose-500 dark:text-rose-400 mb-6">
          {error}
        </div>
      )}

      {!chain && !error && <LoadingGrid count={4} />}

      {chain && (
        <div className="max-w-3xl mx-auto space-y-0">
          {filteredBlocks.map((block, i) => (
            <div key={block.blockNumber}>
              <BlockCard block={block} />
              {i < filteredBlocks.length - 1 && (
                <div className="flex justify-center py-2.5">
                  <div className="flex flex-col items-center">
                    <div className="w-px h-3 bg-[#6366F1]/40" />
                    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-[#6366F1] dark:text-[#818CF8]">
                      <path
                        d="M10 4v10m0 0-4-4m4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
