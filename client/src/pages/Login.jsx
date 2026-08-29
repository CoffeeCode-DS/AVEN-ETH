import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const DEMO_ACCOUNTS = [
  { role: "CLIENT", label: "Client demo", name: "Sarah Chen", email: "client@aven.dev" },
  { role: "FREELANCER", label: "Freelancer demo", name: "Marcus Rivera", email: "freelancer@aven.dev" },
];

export default function Login() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!loading && user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(acc) {
    setEmail(acc.email);
    setPassword("password123");
    setError(null);
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-paper">
      {/* Left: brand / narrative panel */}
      <div className="hidden lg:flex flex-col justify-between bg-navy-900 text-white p-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center font-display font-bold">A</div>
          <span className="font-display font-semibold text-lg">AVEN-ETH</span>
        </div>

        <div className="relative max-w-md">
          <p className="text-xs font-semibold tracking-widest text-accent-400 uppercase mb-4">
            Decentralized Payment Streams &middot; On-Chain Reputation
          </p>
          <h1 className="font-display text-3xl font-semibold leading-tight">
            Continuous real-time payments &amp; verifiable on-chain reputation.
          </h1>
          <p className="text-white/60 mt-4 text-[15px] leading-relaxed">
            Stream tokens second-by-second as work happens, lock funds in audited vaults, and mint immutable cryptographic proof-of-work attestations directly on-chain.
          </p>

          <div className="mt-10 flex items-center gap-3 text-sm text-white/50">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400" /> Client Wallet
            </span>
            <span>&rarr;</span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Stream Vault
            </span>
            <span>&rarr;</span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Worker Payout
            </span>
          </div>
        </div>

        <p className="relative text-xs text-white/40 font-mono">
          AVEN-ETH Protocol &middot; Connected to Ethereum Local Net (Chain ID: 31337)
        </p>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center font-display font-bold text-white">
              A
            </div>
            <span className="font-display font-semibold text-lg text-ink-900">AVEN-ETH</span>
          </div>

          <h2 className="font-display text-2xl font-semibold text-ink-900">Welcome to AVEN-ETH</h2>
          <p className="text-ink-400 text-sm mt-1.5">Sign in to manage your payment streams and on-chain reputation.</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="field-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="field-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                className="input"
                placeholder={"\u2022".repeat(10)}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div role="alert" className="rounded-xl bg-danger-50 border border-danger-100 px-3.5 py-3 text-sm text-danger-700">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full !py-3" disabled={submitting}>
              {submitting && <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border-soft">
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-3">Try a demo account</p>
            <div className="grid grid-cols-2 gap-2.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className="text-left rounded-xl border border-border px-3.5 py-3 hover:border-accent hover:bg-accent-50/50 transition-colors"
                >
                  <p className="text-xs font-semibold text-ink-800">{acc.label}</p>
                  <p className="text-xs text-ink-400 mt-0.5">{acc.name}</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-ink-300 mt-3">Password for both: password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
