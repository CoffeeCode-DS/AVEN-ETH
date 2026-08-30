import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#000000] dark:text-[#F1F5F9] font-sans antialiased selection:bg-[#6366F1] selection:text-white overflow-x-hidden transition-colors duration-150">
      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR */}
      {/* ========================================================================= */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#000000]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.06] transition-colors duration-150">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-[76px] flex items-center justify-between">
          {/* Left: Brand Logo (aven.eth) */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#6366F1] to-[#818CF8] flex items-center justify-center p-1.5 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white">
                <path d="M12 2L3 7L12 12L21 7L12 2Z" fill="currentColor" opacity="0.95" />
                <path d="M3 17L12 22L21 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 12L12 17L21 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-normal text-[24px] tracking-tight text-slate-900 dark:text-white lowercase">
              aven<span className="text-[#6366F1] dark:text-[#818CF8]">.eth</span>
            </span>
          </Link>

          {/* Center: Navigation Links */}
          <div className="hidden lg:flex items-center gap-9 text-[13px] font-medium tracking-wider text-slate-600 dark:text-slate-300 uppercase">
            <a href="#platform" className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5">
              Platform <span className="text-[9px] text-slate-400 dark:text-slate-500">▾</span>
            </a>
            <a href="#resources" className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5">
              Resources <span className="text-[9px] text-slate-400 dark:text-slate-500">▾</span>
            </a>
            <a href="#pricing" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#enterprise" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Enterprise
            </a>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {user ? (
              <Link
                to="/dashboard"
                className="h-10 px-5 rounded-lg bg-[#6366F1] hover:bg-[#5558E6] text-white font-medium text-[13px] tracking-wider uppercase transition-all shadow-md shadow-indigo-500/25 flex items-center justify-center"
              >
                Launch Dashboard &rarr;
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex text-[13px] font-medium tracking-wider text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white uppercase transition-colors px-3 py-2"
                >
                  Log In
                </Link>
                <Link
                  to="/login"
                  className="h-10 px-5 rounded-lg bg-[#6366F1] hover:bg-[#5558E6] text-white font-medium text-[12px] tracking-wider uppercase transition-all flex items-center justify-center shadow-lg shadow-indigo-500/25"
                >
                  Create Escrow
                </Link>
                <Link
                  to="/login"
                  className="hidden sm:flex h-10 px-5 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-[#141414] dark:hover:bg-[#1F1F1F] text-slate-800 dark:text-white font-medium text-[12px] tracking-wider uppercase transition-all items-center justify-center shadow-sm"
                >
                  Launch App
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION */}
      {/* ========================================================================= */}
      <section id="platform" className="relative pt-36 pb-16 md:pt-48 md:pb-24 overflow-hidden">
        {/* Subtle Radial Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#6366F1]/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 lg:px-8 text-center relative z-10">
          {/* Main Huge Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-[64px] font-normal tracking-[-0.03em] text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.1]">
            Stream payments at the <br className="hidden sm:inline" />
            speed code gets written
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg md:text-[18px] text-slate-600 dark:text-[#94A3B8] max-w-2xl mx-auto leading-relaxed font-normal">
            AVEN standardizes continuous micro-payment streams from smart escrow vaults, cryptographic Git Merkle diff verification, and immutable on-chain developer reputation.
          </p>

          {/* Hero CTAs */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              to={user ? "/agreements/new" : "/login"}
              className="h-12 px-7 rounded-lg bg-[#6366F1] hover:bg-[#5558E6] text-white font-medium text-[13px] tracking-wider uppercase transition-all shadow-xl shadow-indigo-500/25 flex items-center gap-2"
            >
              Create Agreement <span className="text-white/80">&gt;</span>
            </Link>
            <Link
              to={user ? "/agreements" : "/login"}
              className="h-12 px-7 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 bg-white hover:bg-slate-100 dark:bg-[#141414] dark:hover:bg-[#1F1F1F] text-slate-800 dark:text-white font-medium text-[13px] tracking-wider uppercase transition-all flex items-center gap-2 shadow-sm"
            >
              Launch CLI Watcher <span className="text-slate-400 dark:text-white/80">&gt;</span>
            </Link>
          </div>

          {/* Full Screen Viewport Width Downward Cup Curved Horizon Grid Platform */}
          <div className="relative mt-20 w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden">
            {/* Ambient Horizon Glow behind curve */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[160px] bg-[#6366F1]/20 blur-[100px] pointer-events-none" />

            <div className="relative w-full min-h-[260px] sm:min-h-[300px] flex items-center justify-center">
              {/* Masked Grid Layer (Fades smoothly to invisible at the bottom) */}
              <div
                className="absolute inset-0 bg-gradient-to-b from-slate-200 via-slate-100 to-transparent dark:from-[#050505] dark:via-[#0A0A0A] dark:to-transparent shadow-2xl overflow-hidden [border-top-left-radius:50%_60px] [border-top-right-radius:50%_60px] border-t border-indigo-500/35 pointer-events-none"
                style={{
                  maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%)",
                  WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%)",
                }}
              >
                {/* Glowing Curved Horizon Top Stroke */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#6366F1] dark:via-[#818CF8] to-transparent shadow-[0_0_35px_#6366F1]" />

                {/* 3D Perspective Grid converging to curved horizon */}
                <div
                  className="w-[200%] h-[300%] absolute top-0 -left-[50%] opacity-40 dark:opacity-55 pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(99, 102, 241, 0.45) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(99, 102, 241, 0.45) 1px, transparent 1px)
                    `,
                    backgroundSize: "48px 36px",
                    transform: "perspective(260px) rotateX(66deg)",
                    transformOrigin: "top center",
                  }}
                />
              </div>

              {/* Unmasked High-Opacity Floating Stats Badges */}
              <div className="relative z-20 w-full flex flex-wrap items-center justify-center gap-4 sm:gap-8 px-4 pt-12 pb-6">
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/[0.12] text-[13px] font-mono text-slate-800 dark:text-slate-200 backdrop-blur-xl shadow-md dark:shadow-2xl hover:border-indigo-500/60 transition-all opacity-100">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#6366F1] dark:text-[#818CF8]">
                    <path d="M12 2L3 7L12 12L21 7L12 2Z" />
                  </svg>
                  <span className="font-bold text-slate-900 dark:text-white">142.8 ETH</span>
                  <span className="text-[#6366F1] dark:text-[#818CF8] text-xs font-sans font-medium">STREAMED</span>
                </div>

                <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/[0.12] text-[13px] font-mono text-slate-800 dark:text-slate-200 backdrop-blur-xl shadow-md dark:shadow-2xl hover:border-emerald-500/60 transition-all opacity-100">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-emerald-600 dark:text-emerald-400">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="font-bold text-slate-900 dark:text-white">644.8K</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs font-sans font-medium">ATTESTATIONS</span>
                </div>

                <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/[0.12] text-[13px] font-mono text-slate-800 dark:text-slate-200 backdrop-blur-xl shadow-md dark:shadow-2xl hover:border-amber-500/60 transition-all opacity-100">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-slate-900 dark:text-white">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span className="font-bold text-slate-900 dark:text-white">10,000 PTS</span>
                  <span className="text-amber-600 dark:text-amber-400 text-xs font-sans font-medium">MAX REP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trusted Ecosystem Networks Bar */}
          <div className="mt-14 pt-8 border-t border-slate-200 dark:border-white/[0.06]">
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-70 grayscale hover:grayscale-0 transition-all text-[15px] font-sans font-medium text-slate-600 dark:text-slate-300">
              <span className="tracking-wider">ETHEREUM</span>
              <span className="tracking-wide">ARBITRUM</span>
              <span className="tracking-tight">OPTIMISM</span>
              <span className="tracking-wider">BASE</span>
              <span className="tracking-wide">POLYGON</span>
              <span className="tracking-widest">EAS PROTOCOL</span>
              <span className="tracking-wide">VS CODE</span>
              <span className="tracking-tight">GITHUB ACTIONS</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SECTION 2: STREAMING & REPUTATION INFRASTRUCTURE */}
      {/* ========================================================================= */}
      <section id="streaming" className="py-24 border-t border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#000000] transition-colors duration-150">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Heading + Description */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
              <h2 className="text-3xl sm:text-5xl font-normal text-slate-900 dark:text-white tracking-[-0.03em] leading-[1.14]">
                Escrow &amp; reputation <br />
                infrastructure for the <br />
                remote developer era
              </h2>
              <p className="text-slate-600 dark:text-[#94A3B8] text-base leading-relaxed max-w-md font-normal">
                AVEN provides the decentralized settlement layer that streams tokens second-by-second, binds deliverables to Git Merkle trees, and guarantees zero-drift dispute protection.
              </p>
            </div>

            {/* Right Column: 2x2 Grid of Cards */}
            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-5">
              {/* Card 1: Purple Terminal Icon */}
              <div className="p-8 rounded-2xl bg-slate-50 dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.07] hover:border-indigo-300 dark:hover:border-white/[0.14] shadow-sm dark:shadow-none transition-all space-y-4">
                <div className="h-11 w-11 rounded-xl bg-[#6366F1] flex items-center justify-center text-white shadow-md">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                    <polyline points="4 17 10 11 4 5" />
                    <line x1="12" y1="19" x2="20" y2="19" />
                  </svg>
                </div>
                <h3 className="text-[17px] font-semibold text-slate-900 dark:text-white tracking-tight leading-snug">
                  Turn Git commits into verifiable stream claims
                </h3>
                <p className="text-[13px] text-slate-600 dark:text-[#94A3B8] leading-relaxed font-normal">
                  Deterministic, wall-clock bounded commit logging and diff metrics that eliminate fake time logs and inflated billable hours.
                </p>
              </div>

              {/* Card 2: Mint Certificate Icon */}
              <div className="p-8 rounded-2xl bg-slate-50 dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.07] hover:border-indigo-300 dark:hover:border-white/[0.14] shadow-sm dark:shadow-none transition-all space-y-4">
                <div className="h-11 w-11 rounded-xl bg-[#0D9488] dark:bg-[#5EEAD4] flex items-center justify-center text-white dark:text-slate-950 shadow-md">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <line x1="7" y1="8" x2="17" y2="8" />
                    <line x1="7" y1="12" x2="13" y2="12" />
                    <circle cx="15" cy="14" r="2" />
                  </svg>
                </div>
                <h3 className="text-[17px] font-semibold text-slate-900 dark:text-white tracking-tight leading-snug">
                  Give engineering agreements a live smart escrow
                </h3>
                <p className="text-[13px] text-slate-600 dark:text-[#94A3B8] leading-relaxed font-normal">
                  Lock project funds safely in non-custodial EVM vaults and stream micro-payments to contributors on every valid work tick.
                </p>
              </div>

              {/* Card 3: Cyan Padlock Icon */}
              <div className="p-8 rounded-2xl bg-slate-50 dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.07] hover:border-indigo-300 dark:hover:border-white/[0.14] shadow-sm dark:shadow-none transition-all space-y-4">
                <div className="h-11 w-11 rounded-xl bg-[#0284C7] dark:bg-[#38BDF8] flex items-center justify-center text-white dark:text-slate-950 shadow-md">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                </div>
                <h3 className="text-[17px] font-semibold text-slate-900 dark:text-white tracking-tight leading-snug">
                  Cryptographic dispute freeze &amp; fair mediation
                </h3>
                <p className="text-[13px] text-slate-600 dark:text-[#94A3B8] leading-relaxed font-normal">
                  Zero-trust dispute states that freeze streaming instantly, lock unearned escrow, and resolve funds with audited code proof.
                </p>
              </div>

              {/* Card 4: Yellow Building Icon */}
              <div className="p-8 rounded-2xl bg-slate-50 dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.07] hover:border-indigo-300 dark:hover:border-white/[0.14] shadow-sm dark:shadow-none transition-all space-y-4">
                <div className="h-11 w-11 rounded-xl bg-[#EAB308] dark:bg-[#FACC15] flex items-center justify-center text-white dark:text-slate-950 shadow-md">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                    <rect x="4" y="2" width="16" height="20" rx="2" />
                    <line x1="9" y1="22" x2="9" y2="2" />
                    <path d="M8 6h.01M8 10h.01M8 14h.01M16 6h.01M16 10h.01M16 14h.01M16 18h.01" />
                  </svg>
                </div>
                <h3 className="text-[17px] font-semibold text-slate-900 dark:text-white tracking-tight leading-snug">
                  Build an immutable system of record for developer reputation
                </h3>
                <p className="text-[13px] text-slate-600 dark:text-[#94A3B8] leading-relaxed font-normal">
                  Convert deliverables, client reviews, and verified lines of code into permanent Ethereum Attestation Service (EAS) badges.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SECTION 3: GIT PROOF OF WORK & MERKLE INSPECTION */}
      {/* ========================================================================= */}
      <section id="proof-of-work" className="py-24 border-t border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#000000] transition-colors duration-150">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[11px] font-mono font-bold tracking-widest text-[#6366F1] dark:text-[#818CF8] uppercase">
              GIT PROOF OF WORK
            </span>
            <h2 className="text-3xl sm:text-5xl font-normal text-slate-900 dark:text-white tracking-[-0.03em] leading-tight">
              High-precision verification <br />
              on every single commit
            </h2>
            <p className="text-slate-600 dark:text-[#94A3B8] text-base sm:text-[17px] font-normal leading-relaxed">
              The AVEN CLI watcher hashes commit ranges and working tree diffs in real-time, submitting verifiable cryptographic Merkle roots before unlocking escrow payouts.
            </p>
          </div>

          {/* 2-Column Split: Agreement Proof Inspector & Stacked 01/02 Cards */}
          <div className="grid lg:grid-cols-12 gap-7 items-start">
            {/* Left: Cryptographic Proof Inspector Card */}
            <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-2xl p-6 space-y-6">
              {/* Top Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06] pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="ml-2 text-xs font-mono text-slate-500 dark:text-slate-400">AGREEMENT #0x7F4A &middot; payment-stream-engine</span>
                </div>
              </div>

              {/* Inspector Title */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-6 w-6 rounded-full bg-[#6366F1] flex items-center justify-center text-white text-[11px] font-medium">
                    A
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">Cryptographic Proof by AVEN</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">3 VERIFIED PROOFS</span>
              </div>

              {/* Verification List */}
              <div className="space-y-3 font-sans text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-white/[0.04] flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">&bull; Base commit a94c8e1 &rarr; Head commit e5b72f0</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-transparent font-mono text-[11px] font-semibold">
                    14 Commits
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-white/[0.04] flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">&bull; Monotonic wall-clock sync verified: +3,600s</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-transparent font-mono text-[11px] font-semibold">
                    Bounded Rate
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-white/[0.04] flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">&bull; SHA-256 deliverable report hash on-chain</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-transparent font-mono text-[11px] font-semibold">
                    PoW Mined
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Stacked Cards 01 & 02 */}
            <div className="lg:col-span-5 space-y-4">
              {/* Card 01 */}
              <div className="p-7 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-[#6366F1] shadow-sm dark:shadow-xl dark:shadow-indigo-500/10 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-white/[0.07] text-[11px] font-mono font-semibold text-[#6366F1] dark:text-slate-300">
                    MERKLE TREE SYNC
                  </span>
                  <span className="h-8 w-8 rounded-lg bg-[#6366F1] text-white text-xs font-semibold font-mono flex items-center justify-center shadow-md">
                    01
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Git Merkle tree verification</h3>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed font-normal">
                  Every work session generates an immutable cryptographic hash linking exact code diffs and commit histories directly into the agreement's smart contract.
                </p>
              </div>

              {/* Card 02 */}
              <div className="p-7 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.14] shadow-sm dark:shadow-none transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.07] text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300">
                    PER-SECOND STREAMING
                  </span>
                  <span className="h-8 w-8 rounded-lg bg-[#6366F1] text-white text-xs font-semibold font-mono flex items-center justify-center shadow-md">
                    02
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Continuous micropayment flow</h3>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed font-normal">
                  Contributors withdraw earned funds at any second during project execution with zero floating-point drift and verified balance updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SECTION 4: 4 HIGH-CONTRAST BENTO CARDS */}
      {/* ========================================================================= */}
      <section id="reputation" className="py-24 border-t border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#000000] transition-colors duration-150">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-5xl font-normal text-slate-900 dark:text-white tracking-[-0.03em] leading-tight">
              The decentralized protocol to keep <br />
              engineering contracts fair
            </h2>
            <p className="text-slate-600 dark:text-[#94A3B8] text-base sm:text-[17px] font-normal">
              Full transparency with non-custodial execution across every agreement, commit, and payout.
            </p>
          </div>

          {/* 4 Distinct Color Bento Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Tile 1: High Contrast Charcoal / Crisp Pure White Card */}
            <div className="p-8 rounded-3xl bg-slate-900 dark:bg-[#FFFFFF] text-white dark:text-[#0A0B10] flex flex-col justify-between h-[340px] shadow-xl dark:shadow-2xl transition-transform hover:-translate-y-1">
              <div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8 text-white dark:text-[#0A0B10] mb-8">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <h3 className="text-xl font-semibold tracking-tight text-white dark:text-[#0A0B10]">Dispute protection</h3>
              </div>
              <p className="text-xs text-slate-300 dark:text-[#334155] leading-relaxed font-normal">
                Instant stream freezing and fair mediation safeguards against fraudulent work or premature fund release.
              </p>
            </div>

            {/* Tile 2: Vivid Royal Purple Card */}
            <div className="p-8 rounded-3xl bg-[#6366F1] text-white flex flex-col justify-between h-[340px] shadow-xl dark:shadow-2xl transition-transform hover:-translate-y-1">
              <div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8 text-white mb-8">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
                <h3 className="text-xl font-semibold tracking-tight text-white">Immutable ledger</h3>
              </div>
              <p className="text-xs text-[#EEF2FF] leading-relaxed font-normal">
                Every micro-settlement, withdrawal, and milestone permanently recorded into verified proof-of-work blocks.
              </p>
            </div>

            {/* Tile 3: Mint / Teal Card */}
            <div className="p-8 rounded-3xl bg-[#0D9488] dark:bg-[#5EEAD4] text-white dark:text-[#0A0B10] flex flex-col justify-between h-[340px] shadow-xl dark:shadow-2xl transition-transform hover:-translate-y-1">
              <div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8 text-white dark:text-[#0A0B10] mb-8">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
                <h3 className="text-xl font-semibold tracking-tight text-white dark:text-[#0A0B10]">EAS reputation badges</h3>
              </div>
              <p className="text-xs text-teal-50 dark:text-[#0F172A] leading-relaxed font-normal">
                Verifiable developer skill attestations, project scores, and client ratings minted on-chain forever.
              </p>
            </div>

            {/* Tile 4: Lime Card */}
            <div className="p-8 rounded-3xl bg-[#84CC16] dark:bg-[#CCF24A] text-slate-950 dark:text-[#0A0B10] flex flex-col justify-between h-[340px] shadow-xl dark:shadow-2xl transition-transform hover:-translate-y-1">
              <div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8 text-slate-950 dark:text-[#0A0B10] mb-8">
                  <circle cx="6" cy="6" r="3" />
                  <circle cx="18" cy="6" r="3" />
                  <circle cx="12" cy="18" r="3" />
                  <line x1="8.5" y1="7.5" x2="15.5" y2="7.5" />
                  <line x1="7.5" y1="8.5" x2="10.5" y2="15.5" />
                  <line x1="16.5" y1="8.5" x2="13.5" y2="15.5" />
                </svg>
                <h3 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-[#0A0B10]">Non-custodial vaults</h3>
              </div>
              <p className="text-xs text-lime-950 dark:text-[#0F172A] leading-relaxed font-normal">
                Smart escrow contracts hold funds trustlessly with zero intermediary control and automatic refunds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SECTION 5: FOOTER */}
      {/* ========================================================================= */}
      <footer id="governance" className="pt-24 pb-14 border-t border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-[#000000] text-slate-600 dark:text-slate-400 text-xs transition-colors duration-150">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 space-y-16">
          {/* Top Row: Brand Info + 4 Columns */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-9">
            {/* Left Brand Column */}
            <div className="col-span-2 space-y-5">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-[#6366F1] flex items-center justify-center p-1 text-white shadow-md">
                  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white">
                    <path d="M12 2L3 7L12 12L21 7L12 2Z" fill="currentColor" />
                    <path d="M3 17L12 22L21 17" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
                <span className="font-normal text-[22px] tracking-tight text-slate-900 dark:text-white lowercase">aven</span>
              </div>
              <p className="text-[12.5px] text-slate-600 dark:text-slate-400 leading-[1.65] max-w-sm font-normal">
                AVEN is a decentralized continuous payment and on-chain developer reputation protocol that brings automated, context-aware proof of work into your IDE, pull requests, CLI, and Ethereum consensus layer. Built for high-trust engineering teams with real-time micropayment streaming, Git Merkle proof verification, zero-trust dispute freezes, and tamper-proof reputation scoring.
              </p>
              
              {/* Social Icons (GitHub, YouTube, LinkedIn, X) */}
              <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 pt-1">
                <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors" aria-label="GitHub">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
                </a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors" aria-label="YouTube">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors" aria-label="LinkedIn">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors" aria-label="X">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
              </div>
            </div>

            {/* Column 1: PROTOCOLS */}
            <div>
              <p className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-4 font-mono">Protocols</p>
              <ul className="space-y-3 text-[12.5px] font-normal">
                <li><Link to="/agreements" className="hover:text-slate-900 dark:hover:text-white transition-colors">Streaming Escrow</Link></li>
                <li><Link to="/agreements" className="hover:text-slate-900 dark:hover:text-white transition-colors">Git CLI Watcher</Link></li>
                <li><Link to="/agreements" className="hover:text-slate-900 dark:hover:text-white transition-colors">Dispute Resolution</Link></li>
              </ul>
            </div>

            {/* Column 2: DEVELOPERS */}
            <div>
              <p className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-4 font-mono">Developers</p>
              <ul className="space-y-3 text-[12.5px] font-normal">
                <li><a href="#docs" className="hover:text-slate-900 dark:hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#github" className="hover:text-slate-900 dark:hover:text-white transition-colors">GitHub Repository</a></li>
                <li><a href="#cli" className="hover:text-slate-900 dark:hover:text-white transition-colors">CLI Binaries</a></li>
                <li><a href="#contracts" className="hover:text-slate-900 dark:hover:text-white transition-colors">Smart Contracts</a></li>
                <li><Link to="/security" className="hover:text-slate-900 dark:hover:text-white transition-colors">AVEN Trust Center</Link></li>
              </ul>
            </div>

            {/* Column 3: ECOSYSTEM */}
            <div>
              <p className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-4 font-mono">Ecosystem</p>
              <ul className="space-y-3 text-[12.5px] font-normal">
                <li><a href="#eas" className="hover:text-slate-900 dark:hover:text-white transition-colors">EAS Attestation Registry</a></li>
                <li><a href="#vscode" className="hover:text-slate-900 dark:hover:text-white transition-colors">AVEN &amp; VS Code</a></li>
                <li><a href="#cursor" className="hover:text-slate-900 dark:hover:text-white transition-colors">AVEN &amp; Cursor</a></li>
                <li><a href="#ethereum" className="hover:text-slate-900 dark:hover:text-white transition-colors">Ethereum Testnet</a></li>
                <li><a href="#chains" className="hover:text-slate-900 dark:hover:text-white transition-colors">Supported L2 Networks</a></li>
                <li><a href="#glossary" className="hover:text-slate-900 dark:hover:text-white transition-colors">Protocol Glossary</a></li>
              </ul>
            </div>

            {/* Column 4: GOVERNANCE */}
            <div>
              <p className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-4 font-mono">Governance</p>
              <ul className="space-y-3 text-[12.5px] font-normal">
                <li><a href="#consensus" className="hover:text-slate-900 dark:hover:text-white transition-colors">PoW Consensus</a></li>
                <li><a href="#whitepaper" className="hover:text-slate-900 dark:hover:text-white transition-colors">Protocol Whitepaper</a></li>
                <li><a href="#audits" className="hover:text-slate-900 dark:hover:text-white transition-colors">Security Audits</a></li>
                <li><a href="#dao" className="hover:text-slate-900 dark:hover:text-white transition-colors">Community DAO</a></li>
                <li><a href="#privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy &amp; Cryptography</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Ecosystem & Integrations Bar */}
          <div className="pt-12 border-t border-slate-200 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-8">
            {/* 1. Languages */}
            <div className="space-y-3">
              <p className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-medium">
                SUPPORTED CONTRACTS &amp; LANGUAGES
              </p>
              <div className="flex items-center gap-3">
                {/* Solidity */}
                <div className="h-6 w-6 rounded bg-[#3C3C3D] text-[#818CF8] flex items-center justify-center font-bold text-[10px]" title="Solidity">
                  ◆
                </div>
                {/* TypeScript */}
                <div className="h-6 w-6 rounded bg-[#3178C6] text-white flex items-center justify-center font-bold text-[10px]" title="TypeScript">
                  TS
                </div>
                {/* JavaScript */}
                <div className="h-6 w-6 rounded bg-[#F7DF1E] text-black flex items-center justify-center font-bold text-[10px]" title="JavaScript">
                  JS
                </div>
                {/* Rust */}
                <div className="h-6 w-6 rounded bg-[#CE412B] text-white flex items-center justify-center font-bold text-[10px]" title="Rust">
                  Rs
                </div>
                {/* Go */}
                <div className="h-6 w-6 rounded bg-[#00ADD8] text-white flex items-center justify-center font-bold text-[10px]" title="Go">
                  Go
                </div>
                {/* Python */}
                <div className="h-6 w-6 rounded bg-slate-100 dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center p-1" title="Python">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">Py</span>
                </div>
                {/* C++ */}
                <div className="h-6 w-6 rounded bg-[#00599C] text-white flex items-center justify-center font-bold text-[10px]" title="C++">
                  C+
                </div>
                {/* Kotlin */}
                <div className="h-6 w-6 rounded bg-gradient-to-tr from-[#7F52FF] to-[#E24462] text-white flex items-center justify-center font-bold text-[10px]" title="Kotlin">
                  K
                </div>
              </div>
            </div>

            {/* 2. Available Now On */}
            <div className="space-y-3">
              <p className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-medium">
                INTEGRATED DEVELOPER TOOLS
              </p>
              <div className="flex items-center gap-2.5">
                <div className="h-6 px-2 rounded bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] flex items-center gap-1.5 text-[11px] font-mono text-slate-700 dark:text-slate-300 shadow-sm dark:shadow-none">
                  <span className="text-[#0284C7] dark:text-[#38BDF8]">VS</span> Code
                </div>
                <div className="h-6 px-2 rounded bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] flex items-center gap-1 text-[11px] font-mono text-slate-700 dark:text-slate-300 shadow-sm dark:shadow-none">
                  Cursor
                </div>
                <div className="h-6 px-2 rounded bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] flex items-center gap-1 text-[11px] font-mono text-slate-700 dark:text-slate-300 shadow-sm dark:shadow-none">
                  Windsurf
                </div>
                <div className="h-6 px-2 rounded bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] flex items-center gap-1 text-[11px] font-mono text-slate-700 dark:text-slate-300 shadow-sm dark:shadow-none">
                  GitHub Actions
                </div>
              </div>
            </div>

            {/* 3. Networks & Protocol Badges */}
            <div className="flex items-center gap-3">
              <div className="h-7 px-2.5 rounded bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-[10px] font-medium text-slate-700 dark:text-slate-300 shadow-sm dark:shadow-none">
                Ethereum EVM
              </div>
              <div className="h-7 px-2.5 rounded bg-[#632CA6] text-white flex items-center justify-center text-[10px] font-medium">
                EAS Protocol
              </div>
              <div className="h-7 px-2.5 rounded bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-[10px] font-medium text-slate-700 dark:text-slate-300 shadow-sm dark:shadow-none">
                Arbitrum Nitro
              </div>
              <div className="h-7 w-7 rounded-full bg-[#0284C7] text-white flex items-center justify-center text-[8px] font-bold shadow">
                PoW
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
