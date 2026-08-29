import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import Modal from "../components/Modal.jsx";
import { formatEth, formatDate, formatDateTime, truncateAddress } from "../utils/format.js";

const TX_BADGES = {
  WALLET_DEPOSIT: "bg-emerald-50 text-emerald-700 border-emerald-100",
  WALLET_TRANSFER: "bg-purple-50 text-purple-700 border-purple-100",
  STREAM_CREATED: "bg-sky-50 text-sky-700 border-sky-100",
  STREAM_CLAIMED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  ATTESTATION_MINTED: "bg-amber-50 text-amber-700 border-amber-100",
  STREAM_CANCELLED: "bg-danger-50 text-danger-700 border-danger-100",
};

export default function Wallet() {
  const { user } = useAuth();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("2.5");
  const [depositing, setDepositing] = useState(false);

  const [transferOpen, setTransferOpen] = useState(false);
  const [transferAddress, setTransferAddress] = useState("");
  const [transferAmount, setTransferAmount] = useState("0.5");
  const [transferring, setTransferring] = useState(false);

  const [copied, setCopied] = useState(false);

  function load() {
    api
      .wallet()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }

  useEffect(load, []);

  function copyAddress(addr) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(addr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleDeposit(e) {
    e.preventDefault();
    const amt = Number(depositAmount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid deposit amount.");
      return;
    }
    setDepositing(true);
    try {
      const res = await api.depositFunds(amt, "Faucet deposit via Wallet Hub");
      toast.success(`Successfully deposited ${formatEth(res.amountDeposited)} to your wallet!`);
      setDepositOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDepositing(false);
    }
  }

  async function handleTransfer(e) {
    e.preventDefault();
    const amt = Number(transferAmount);
    if (!transferAddress.trim() || !transferAddress.startsWith("0x")) {
      toast.error("Enter a valid recipient Ethereum address starting with 0x...");
      return;
    }
    if (!amt || amt <= 0) {
      toast.error("Enter a valid transfer amount.");
      return;
    }
    setTransferring(true);
    try {
      const res = await api.transferFunds(transferAddress.trim(), amt);
      toast.success(`Transferred ${formatEth(res.amountTransferred)} to ${truncateAddress(transferAddress)}!`);
      setTransferOpen(false);
      setTransferAddress("");
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTransferring(false);
    }
  }

  if (loading) {
    return (
      <AppLayout title="Wallet & Liquidity Hub" subtitle="Loading your balances...">
        <div className="space-y-6">
          <div className="skeleton h-60 w-full" />
          <div className="skeleton h-48 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout title="Wallet & Liquidity Hub">
        <div className="rounded-xl bg-danger-50 border border-danger-100 px-4 py-3 text-sm text-danger-700">
          Failed to load wallet data: {error}
        </div>
      </AppLayout>
    );
  }

  const { wallet, activeStreams, transactions } = data;
  const isClient = user.role === "CLIENT";

  return (
    <AppLayout
      title="Wallet & Liquidity Hub"
      subtitle="Manage your testnet ETH funds, stream liquidity reserves, and on-chain deposits."
    >
      <div className="space-y-8">
        {/* Main Wallet Hero Card */}
        <div className="card p-8 bg-navy-900 !border-navy-800 text-white relative overflow-hidden">
          <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-accent/25 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

          <div className="relative grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 uppercase tracking-wider border border-emerald-500/30">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  {wallet.network}
                </span>

                <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-mono text-white/80">
                  <span>{truncateAddress(wallet.walletAddress)}</span>
                  <button
                    onClick={() => copyAddress(wallet.walletAddress)}
                    className="hover:text-accent-300 text-white/50 transition-colors"
                    title="Copy full address"
                  >
                    {copied ? "✓ Copied" : "📋"}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Available Spendable Balance</p>
                <h2 className="font-tabular text-4xl sm:text-5xl font-extrabold text-white tracking-tight mt-1">
                  {formatEth(wallet.availableBalance)}
                </h2>
                <p className="text-xs text-white/60 mt-1.5">
                  Available for instant stream funding, milestone releases, or transfers.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 flex-wrap">
                <button
                  onClick={() => setDepositOpen(true)}
                  className="btn-primary !bg-emerald-500 hover:!bg-emerald-600 !text-navy-950 font-semibold shadow-lg shadow-emerald-500/20"
                >
                  ⚡ Add Funds (Faucet Deposit)
                </button>
                <button
                  onClick={() => setTransferOpen(true)}
                  className="btn-secondary !bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
                >
                  ↗ Send / Transfer
                </button>
              </div>
            </div>

            {/* Quick Balances Stats Card */}
            <div className="lg:col-span-4 rounded-2xl bg-white/[0.05] border border-white/10 p-6 space-y-4">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                Liquidity Allocations
              </p>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <span className="text-white/60 text-xs">Locked in Stream Escrows</span>
                  <span className="font-tabular font-bold text-amber-400">
                    {formatEth(wallet.lockedInEscrows)}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <span className="text-white/60 text-xs">Total Ledger Events</span>
                  <span className="font-tabular font-bold text-white">
                    {wallet.totalTransactions} Txns
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-xs">Account Role</span>
                  <span className="font-semibold text-accent-300 capitalize text-xs">
                    {wallet.role.toLowerCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Stream Allocations */}
        {activeStreams.length > 0 && (
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-lg text-ink-900">
                Active Stream Escrow Vaults ({activeStreams.length})
              </h3>
              <Link to="/agreements" className="text-xs font-semibold text-accent hover:underline">
                View All Streams &rarr;
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeStreams.map((stream) => (
                <div key={stream.id} className="p-4 rounded-xl bg-ink-900/[0.02] border border-border-soft space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-medium text-sm text-ink-900 truncate">{stream.title}</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-accent-50 text-accent-700">
                      {stream.category}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-ink-500 font-tabular pt-1 border-t border-border-soft">
                    <span>Locked in Vault:</span>
                    <strong className="text-ink-800">{formatEth(stream.escrowBalance)}</strong>
                  </div>
                  <Link
                    to={`/agreements/${stream.id}`}
                    className="text-xs text-accent font-semibold hover:underline block pt-1"
                  >
                    Open Stream &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complete Wallet Activity History */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-lg text-ink-900">
                Wallet Ledger &amp; Transaction History
              </h3>
              <p className="text-xs text-ink-400">
                Every deposit, stream lock, and withdrawal verified with cryptographic SHA-256 blocks.
              </p>
            </div>
            <Link to="/blockchain" className="text-xs font-semibold text-accent hover:underline">
              Inspect Blocks &rarr;
            </Link>
          </div>

          <div className="divide-y divide-border-soft">
            {transactions.length === 0 ? (
              <p className="text-sm text-ink-400 py-6 text-center">No transactions recorded yet.</p>
            ) : (
              transactions.map((tx) => {
                const badgeClass = TX_BADGES[tx.type] || "bg-slate-100 text-slate-700";
                const isIncoming = tx.toUser === user.id;

                return (
                  <div key={tx.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
                          {tx.type}
                        </span>
                        <span className="font-mono text-xs text-ink-500">
                          {truncateAddress(tx.simulatedTxHash)}
                        </span>
                      </div>
                      <p className="text-xs text-ink-400 font-tabular">
                        {formatDateTime(tx.timestamp)}
                        {tx.agreementId && (
                          <span> &middot; Stream: <Link to={`/agreements/${tx.agreementId}`} className="text-accent underline">#{tx.agreementId}</Link></span>
                        )}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`font-tabular text-base font-bold ${isIncoming ? "text-emerald-600" : "text-ink-900"}`}>
                        {isIncoming ? "+" : "-"}{formatEth(tx.amount)}
                      </p>
                      <span className="text-[10px] text-ink-400 font-mono">Confirmed</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Deposit / Add Funds Modal */}
      <Modal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        title="Deposit Funds to Wallet (Simulated Faucet)"
        subtitle="Mint testnet ETH to fund payment streams or test withdrawals."
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDepositOpen(false)} disabled={depositing}>
              Cancel
            </button>
            <button className="btn-primary !bg-emerald-500 hover:!bg-emerald-600 !text-navy-950 font-semibold" onClick={handleDeposit} disabled={depositing}>
              {depositing && <span className="h-3.5 w-3.5 rounded-full border-2 border-navy-950/40 border-t-navy-950 animate-spin mr-2" />}
              {depositing ? "Mining Deposit Block..." : `Deposit ${depositAmount || 0} ETH`}
            </button>
          </>
        }
      >
        <form onSubmit={handleDeposit} className="space-y-5">
          <div>
            <label className="field-label mb-2">Select Quick Amount</label>
            <div className="grid grid-cols-4 gap-2">
              {["1.0", "2.5", "5.0", "10.0"].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setDepositAmount(preset)}
                  className={`py-2 rounded-xl text-xs font-semibold font-tabular border transition-all ${
                    depositAmount === preset
                      ? "bg-navy-900 text-white border-navy-900"
                      : "bg-ink-900/[0.03] text-ink-700 border-border-soft hover:bg-ink-900/[0.08]"
                  }`}
                >
                  +{preset} ETH
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="field-label">Custom Amount (ETH)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="1000"
              className="input font-tabular"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="e.g. 5.0"
              required
            />
          </div>

          <div className="rounded-xl bg-accent-50/70 border border-accent-100 p-3 text-xs text-accent-800 leading-relaxed">
            ⚡ <strong>Instant Testnet Settlement:</strong> Deposited funds will be credited to your address ({truncateAddress(wallet.walletAddress)}) and recorded in the next mined blockchain block.
          </div>
        </form>
      </Modal>

      {/* Transfer Modal */}
      <Modal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="Transfer Funds"
        subtitle="Send ETH to another simulated address or recipient."
        footer={
          <>
            <button className="btn-secondary" onClick={() => setTransferOpen(false)} disabled={transferring}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleTransfer} disabled={transferring}>
              {transferring && <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin mr-2" />}
              {transferring ? "Mining Transfer Tx..." : "Confirm & Send"}
            </button>
          </>
        }
      >
        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <label className="field-label">Recipient Wallet Address (0x...)</label>
            <input
              type="text"
              className="input font-mono text-xs"
              placeholder="0x71Cb05EE1b1F506fC321Da3Cc38F21E02d12f9B1"
              value={transferAddress}
              onChange={(e) => setTransferAddress(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="field-label !mb-0">Transfer Amount (ETH)</label>
              <span className="text-xs text-ink-400 font-tabular">
                Available: <strong className="text-ink-800">{formatEth(wallet.availableBalance)}</strong>
              </span>
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={wallet.availableBalance}
              className="input font-tabular"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="e.g. 0.5"
              required
            />
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
