import { useState } from "react";
import Modal from "./Modal.jsx";

/**
 * A confirm dialog that owns its own loading/error state so every
 * financial action (fund escrow, release payment, ...) gets a
 * consistent "confirm -> loading -> success or error" pattern instead
 * of each page re-implementing it.
 */
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

  const confirmClass = tone === "danger" ? "btn-danger !text-white !bg-danger-600 !border-danger-600 hover:!bg-danger-700" : tone === "success" ? "btn-success" : "btn-primary";

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
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            )}
            {loading ? loadingLabel : confirmLabel}
          </button>
        </>
      }
    >
      {children}
      {error && (
        <div className="mt-4 rounded-xl bg-danger-50 border border-danger-100 px-3.5 py-3 text-sm text-danger-700">
          {error}
        </div>
      )}
    </Modal>
  );
}
