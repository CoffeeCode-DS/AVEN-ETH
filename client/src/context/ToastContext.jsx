import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, variant = "success") => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => dismiss(id), 4200);
      return id;
    },
    [dismiss]
  );

  const toast = {
    success: (msg) => push(msg, "success"),
    error: (msg) => push(msg, "error"),
    info: (msg) => push(msg, "info"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 w-[min(360px,calc(100vw-2.5rem))]">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`animate-fadeUp card !rounded-xl px-4 py-3.5 flex items-start gap-3 border-l-4 ${
              t.variant === "success"
                ? "border-l-success"
                : t.variant === "error"
                ? "border-l-danger-600"
                : "border-l-accent"
            }`}
          >
            <span
              className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                t.variant === "success"
                  ? "bg-success"
                  : t.variant === "error"
                  ? "bg-danger-600"
                  : "bg-accent"
              }`}
            />
            <p className="text-sm text-ink-800 leading-snug flex-1">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-ink-300 hover:text-ink-600 text-lg leading-none"
              aria-label="Dismiss notification"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
