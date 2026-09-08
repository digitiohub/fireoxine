'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * The train travels.
 *
 * The world's grammar is "content advances car by car along one axis of
 * travel" and "scroll advances the train", so on a wide viewport the rake of
 * category cars moves laterally while the reader scrolls down. A tall outer
 * track supplies the scroll distance; the inner car sticks; one transform
 * moves the whole rake. However many cards, one animated element.
 *
 * It degrades in three directions, all of them deliberate:
 *   - below `lg`, and under prefers-reduced-motion, the rake stays the native
 *     scroll-snap rail it already was. Pinning a phone is a usability tax.
 *   - with no JavaScript, the same native rail renders. Nothing is hidden.
 *   - keyboard focus inside a translated rake scrolls the page to bring that
 *     card into view, because a card you can tab to but cannot see is worse
 *     than no horizontal section at all.
 */
export function HorizontalTravel({
  children,
  head,
  itemCount,
  className,
}: {
  children: ReactNode;
  /**
   * The section head travels with the rake. Left outside the sticky area it
   * scrolls away the moment the pin engages, leaving the cars floating under
   * a band of empty page with nothing naming them.
   */
  head?: ReactNode;
  itemCount: number;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const rakeRef = useRef<HTMLUListElement>(null);
  const [pinned, setPinned] = useState(false);
  const [distance, setDistance] = useState(0);

  // Measure how far the rake has to travel: its full width, less what the
  // viewport already shows. Re-measured on resize and on font load, because
  // a display face arriving late changes card heights and the scrollWidth.
  const measure = useCallback(() => {
    const wide = window.matchMedia('(min-width: 1024px)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rake = rakeRef.current;

    if (!wide || reduce || !rake) {
      setPinned(false);
      setDistance(0);
      return;
    }

    const travel = Math.max(0, rake.scrollWidth - window.innerWidth);
    // A rake that already fits has nothing to travel; pinning it would trap
    // the reader in a section that never moves.
    setPinned(travel > 80);
    setDistance(travel);
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    const wide = window.matchMedia('(min-width: 1024px)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    wide.addEventListener('change', measure);
    reduce.addEventListener('change', measure);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      window.removeEventListener('resize', measure);
      wide.removeEventListener('change', measure);
      reduce.removeEventListener('change', measure);
    };
  }, [measure]);

  // Drive the transform from scroll position. One rAF-throttled read, one
  // style write, no layout thrash and no per-card work.
  useEffect(() => {
    if (!pinned) {
      if (rakeRef.current) rakeRef.current.style.transform = '';
      return;
    }

    let ticking = false;

    const update = () => {
      const track = trackRef.current;
      const rake = rakeRef.current;
      if (!track || !rake) return;

      const box = track.getBoundingClientRect();
      const scrollable = track.offsetHeight - window.innerHeight;
      const progress =
        scrollable <= 0 ? 0 : Math.min(1, Math.max(0, -box.top / scrollable));

      rake.style.transform = `translate3d(${-progress * distance}px,0,0)`;
      track.style.setProperty('--fx-progress', String(progress));
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pinned, distance]);

  // Keyboard parity. Tabbing into a card that the transform has pushed off
  // screen scrolls the page to the point where that card is in view, so the
  // focus ring is never somewhere the reader cannot look.
  const onFocusCapture = useCallback(
    (event: React.FocusEvent<HTMLUListElement>) => {
      if (!pinned || distance <= 0) return;
      const track = trackRef.current;
      const rake = rakeRef.current;
      if (!track || !rake) return;

      const card = (event.target as HTMLElement).closest('li');
      if (!card) return;

      const target = Math.min(
        1,
        Math.max(0, (card as HTMLElement).offsetLeft / distance)
      );
      const scrollable = track.offsetHeight - window.innerHeight;
      window.scrollTo({
        top: track.offsetTop + target * scrollable,
        behavior: 'smooth',
      });
    },
    [pinned, distance]
  );

  const rake = (
    <ul
      ref={rakeRef}
      onFocusCapture={onFocusCapture}
      className={cn(
        'flex gap-4 px-4 sm:px-6 lg:px-10',
        pinned
          ? 'fx-travel-rake w-max'
          : 'snap-x snap-mandatory overflow-x-auto pb-4'
      )}
    >
      {children}
    </ul>
  );

  if (!pinned) {
    return (
      <div className={className}>
        {head}
        <div className="mt-10">{rake}</div>
      </div>
    );
  }

  return (
    <div
      ref={trackRef}
      className={cn('relative', className)}
      style={{ height: `calc(100vh + ${distance}px)` }}
    >
      <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col justify-center gap-10 overflow-hidden">
        {head}
        {rake}

        {/* How far along the rake you are. A pinned section with no sense of
            its own length is disorienting — the reader cannot tell whether
            three cars remain or nine. Drawn as a rule, because rules are how
            this world shows structure. */}
        <div
          aria-hidden="true"
          className="mx-4 mt-10 h-px bg-rule sm:mx-6 lg:mx-10"
        >
          <div className="fx-travel-progress h-px bg-wedge" />
        </div>
        <p className="fx-stencil mx-4 mt-3 text-[0.6rem] text-ink-faint sm:mx-6 lg:mx-10">
          Scroll to advance · {itemCount} collections
        </p>
      </div>
    </div>
  );
}
