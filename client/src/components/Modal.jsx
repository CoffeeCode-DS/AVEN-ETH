import { useEffect, useRef } from "react";

export default function Modal({ open, onClose, title, subtitle, children, footer, width = "max-w-lg" }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-navy-950/50 backdrop-blur-[2px] animate-scaleIn"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={`relative w-full ${width} card !rounded-2xl p-6 max-h-[88vh] overflow-y-auto animate-scaleIn`}
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
            onClick={onClose}
            aria-label="Close dialog"
            className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-ink-400 hover:bg-ink-900/5 hover:text-ink-700 transition-colors"
          >
            &times;
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="mt-6 flex items-center justify-end gap-2.5">{footer}</div>}
      </div>
    </div>
  );
}
