import { useState } from "react";
import Modal from "./Modal.jsx";
import { formatEth } from "../utils/format.js";

export default function RatingModal({
  open,
  onClose,
  agreement,
  onApprove,
  loading,
}) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);

  if (!agreement) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    await onApprove({ rating, review: review.trim() });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Approve Work & Mint EAS Attestation"
      subtitle={agreement.title}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-mono text-xs font-semibold uppercase tracking-wide transition-all shadow-md shadow-emerald-500/20"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading && <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-950/40 border-t-slate-950 animate-spin mr-2" />}
            {loading ? "Minting Attestation..." : "Approve & Mint On-Chain"}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl bg-[#6366F1]/10 border border-indigo-500/25 p-4">
          <div className="flex items-start gap-3">
            <div className="h-7 w-7 rounded-lg bg-[#6366F1]/20 flex items-center justify-center text-[#818CF8] shrink-0 mt-0.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-white">Atomic On-Chain Settlement</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">
                Releasing payment of <strong className="font-mono text-white">{formatEth(agreement.budget)}</strong> will atomically mint a permanent <strong className="text-[#818CF8]">EAS Attestation</strong> on the blockchain ledger with your verified rating and client confirmation.
              </p>
            </div>
          </div>
        </div>

        {/* Rating Stars */}
        <div>
          <label className="field-label mb-2">Worker Performance Rating</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = (hoveredRating || rating) >= star;
              return (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 text-2xl transition-transform hover:scale-110 focus:outline-none"
                >
                  <span className={active ? "text-amber-400" : "text-slate-600"}>★</span>
                </button>
              );
            })}
            <span className="text-xs font-mono text-slate-300 ml-2">
              {rating} / 5 Stars
            </span>
          </div>
        </div>

        {/* Feedback / Review */}
        <div>
          <label className="field-label">Client Review & Verification Feedback (Optional)</label>
          <textarea
            rows={3}
            className="input resize-none"
            placeholder="Share feedback on code quality, communication, and speed. This will be immortalized in the on-chain attestation..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
