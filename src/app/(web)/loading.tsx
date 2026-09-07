export default function Loading() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-24 sm:px-6 lg:px-10" aria-busy="true">
      <span className="sr-only">Loading</span>
      <div className="h-3 w-24 animate-pulse bg-ground-sunk" />
      <div className="mt-6 h-16 w-2/3 animate-pulse bg-ground-sunk" />
      <div className="mt-4 h-4 w-1/2 animate-pulse bg-ground-sunk" />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] animate-pulse bg-ground-sunk" />
        ))}
      </div>
    </div>
  );
}
