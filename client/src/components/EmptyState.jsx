export default function EmptyState({ icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      {icon && (
        <div className="h-12 w-12 rounded-2xl bg-ink-900/[0.04] flex items-center justify-center text-ink-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="font-display font-semibold text-ink-800 text-base">{title}</h3>
      {message && <p className="text-sm text-ink-400 mt-1.5 max-w-sm">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
