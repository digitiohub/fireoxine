import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="fx-drive pointer-events-none absolute inset-y-0 left-0 w-[40%] bg-wedge"
        style={{ clipPath: 'polygon(0 0, 100% 0, 55% 100%, 0 100%)' }}
      />
      <div className="relative mx-auto flex min-h-[70dvh] max-w-[1600px] flex-col justify-center px-4 py-24 sm:px-6 lg:px-10">
        <p className="fx-display fx-num text-[clamp(5rem,18vw,14rem)] leading-[0.8] text-wedge-ink">
          404
        </p>
        <h1 className="fx-display mt-6 text-3xl sm:text-4xl">This page is not here</h1>
        <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-ink-muted">
          The link may be out of date, or the product may have been withdrawn. The catalogue is
          still where you left it.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/shop/all" className="fx-wedge">
            All products
          </Link>
          <Link href="/hazard" className="fx-wedge-ghost">
            Shop by hazard
          </Link>
        </div>
      </div>
    </div>
  );
}
