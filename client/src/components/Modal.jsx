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
        className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-scaleIn"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative z-10 w-full ${width} rounded-2xl bg-[#0A0A0A] border border-white/[0.1] p-6 max-h-[88vh] overflow-y-auto shadow-2xl animate-scaleIn my-auto text-slate-100`}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            {title && (
              <h3 id="modal-title" className="text-base font-medium text-white">
                {title}
              </h3>
            )}
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-white/[0.06]">{footer}</div>}
      </div>
    </div>
  );
}
