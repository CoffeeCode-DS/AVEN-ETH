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
      title="Approve Work & Mint Attestation"
      subtitle={agreement.title}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-success"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading && <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin mr-2" />}
            {loading ? "Minting Attestation..." : "Approve & Mint On-Chain"}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl bg-accent-50/60 border border-accent-100 p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚡</span>
            <div>
              <p className="text-sm font-semibold text-accent-900">Atomic On-Chain Settlement</p>
              <p className="text-xs text-accent-700 mt-0.5 leading-relaxed">
                Releasing payment of <strong className="font-tabular">{formatEth(agreement.budget)}</strong> will atomically mint a permanent <strong className="underline">AttestationRecord</strong> on the blockchain with your verified rating and client confirmation.
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
                  <span className={active ? "text-amber-400" : "text-slate-200"}>★</span>
                </button>
              );
            })}
            <span className="text-sm font-medium text-ink-600 ml-2 font-tabular">
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
