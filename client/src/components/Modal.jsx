import { useEffect } from "react";

export default function Modal({ open, onClose, title, subtitle, children, footer, width = "max-w-lg" }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-navy-950/60 backdrop-blur-[2px] animate-scaleIn"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative z-10 w-full ${width} card !bg-white !rounded-2xl p-6 max-h-[88vh] overflow-y-auto shadow-2xl animate-scaleIn my-auto`}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {title && (
              <h3 id="modal-title" className="font-display text-lg font-semibold text-ink-900">
                {title}
              </h3>
            )}
            {subtitle && <p className="text-sm text-ink-500 mt-1">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-ink-400 hover:bg-ink-900/5 hover:text-ink-700 transition-colors"
          >
            &times;
          </button>
        </div>
        <div className="text-ink-900">{children}</div>
        {footer && <div className="mt-6 flex items-center justify-end gap-2.5">{footer}</div>}
      </div>
    </div>
  );
}
