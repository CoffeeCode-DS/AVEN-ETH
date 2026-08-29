import { useState } from "react";
import Modal from "./Modal.jsx";

export default function ConfirmDialog({
  open,
  onClose,
  title,
  subtitle,
  children,
  confirmLabel = "Confirm",
  loadingLabel = "Processing...",
  tone = "primary",
  onConfirm,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }
    setLoading(false);
  }

  const confirmClass =
    tone === "danger"
      ? "h-10 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs font-semibold uppercase tracking-wide transition-all shadow-md"
      : tone === "success"
      ? "h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-mono text-xs font-semibold uppercase tracking-wide transition-all shadow-md shadow-emerald-500/20"
      : "h-10 px-5 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white font-mono text-xs font-semibold uppercase tracking-wide transition-all shadow-md shadow-indigo-500/25";

  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      title={title}
      subtitle={subtitle}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className={confirmClass} onClick={handleConfirm} disabled={loading}>
            {loading && (
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin mr-2" />
            )}
            {loading ? loadingLabel : confirmLabel}
          </button>
        </>
      }
    >
      {children}
      {error && (
        <div className="mt-4 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3.5 py-3 text-xs font-mono text-rose-400">
          {error}
        </div>
      )}
    </Modal>
  );
}
