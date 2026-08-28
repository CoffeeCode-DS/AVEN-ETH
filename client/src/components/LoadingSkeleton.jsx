export function CardSkeleton() {
  return (
    <div className="card p-5">
      <div className="skeleton h-4 w-2/3 mb-3" />
      <div className="skeleton h-3 w-1/3 mb-5" />
      <div className="skeleton h-2 w-full mb-2" />
      <div className="skeleton h-2 w-5/6" />
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="card p-5">
      <div className="skeleton h-3 w-1/2 mb-3" />
      <div className="skeleton h-7 w-2/3" />
    </div>
  );
}

export default function LoadingGrid({ count = 3, kind = "card" }) {
  const Skeleton = kind === "stat" ? StatSkeleton : CardSkeleton;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} />
      ))}
    </div>
  );
}
