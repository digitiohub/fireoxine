'use client';

import { useEffect } from 'react';

/**
 * The scroll layer for the landing page.
 *
 * Mounted once. It adds no markup and wraps nothing — it reads `data-fx`
 * attributes already on the existing elements and drives them. That keeps the
 * UI byte-identical whether this component runs or not, which is the whole
 * point: motion is a layer over the page, never a condition of it.
 *
 * Nothing is hidden until this component has confirmed motion is wanted. The
 * `fx-motion` class on <html> is what arms every pre-animation state in CSS,
 * so a thrown script or a reduced-motion preference leaves the page complete
 * and still rather than blank and waiting.
 */
export function ScrollChoreography() {
  useEffect(() => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Bail before arming anything. Under reduced motion the page simply never
    // enters the animated mode, so there is no state to unwind.
    if (reduceMotion.matches) return;
    if (!('IntersectionObserver' in window)) return;

    root.classList.add('fx-motion');
    // Tell the inline script we are alive, so it stops counting down to
    // stripping the animated mode off the page.
    (window as unknown as { __fxReady?: () => void }).__fxReady?.();

    let targets = Array.from(document.querySelectorAll<HTMLElement>('[data-fx]'));

    // This component writes exactly one thing to the DOM: a class. Stagger
    // order is expressed in CSS with nth-child, because setting inline styles
    // here would race React's hydration — an effect can reach a node before
    // React has reconciled it, and React then reports an attribute mismatch
    // it refuses to patch up.

    const pending = new Set(targets);

    const reveal = (el: Element) => {
      el.classList.add('fx-in');
      pending.delete(el as HTMLElement);
      // Reveal once. A section that re-animates every time it re-enters the
      // viewport turns scrolling back into a chore.
      observer.unobserve(el);
    };

    /**
     * Reveal everything the viewport has reached or already passed.
     *
     * IntersectionObserver only reports what is intersecting at the moment it
     * checks, so a reader who *jumps* — the End key, a restored scroll
     * position, an in-page anchor, a trackpad flick — sails past sections that
     * were never observed mid-flight and leaves them permanently invisible.
     * This sweep is what makes the reveal survive a discontinuous read.
     *
     * Elements with no layout box are skipped: the collapsed half of the
     * category grid is display:none and must stay pending until its own
     * component reveals it, not be silently marked arrived while hidden.
     */
    const sweep = () => {
      for (const el of pending) {
        const box = el.getBoundingClientRect();
        if (box.width === 0 && box.height === 0) continue;
        if (box.top < window.innerHeight * 0.95) reveal(el);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) reveal(entry.target);
        }
        // A jump fires a callback for whatever landed in view; use it as the
        // cue to catch up on everything skipped on the way there.
        sweep();
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.01 }
    );

    const track = (elements: HTMLElement[]) => {
      const fresh = elements.filter(
        (el) => !pending.has(el) && !el.classList.contains('fx-in')
      );
      if (fresh.length === 0) return;
      for (const el of fresh) {
        pending.add(el);
        observer.observe(el);
      }
      sweep();
    };

    for (const el of targets) observer.observe(el);

    // Anything already on screen at mount arrives immediately rather than
    // waiting for a scroll that may never come on a short viewport.
    requestAnimationFrame(sweep);

    /**
     * Pick up choreographed elements that appear after mount.
     *
     * The horizontal travel swaps its own DOM when it decides to pin, which
     * replaces its section head with fresh nodes the initial query never saw.
     * Those nodes would carry the pre-animation state with nothing left
     * watching them, and stay invisible for the life of the page. Any
     * client-rendered content with a data-fx attribute has the same problem,
     * so this is handled generally rather than special-cased.
     */
    let scanQueued = false;
    const mutations = new MutationObserver(() => {
      if (scanQueued) return;
      scanQueued = true;
      requestAnimationFrame(() => {
        scanQueued = false;
        targets = Array.from(document.querySelectorAll<HTMLElement>('[data-fx]'));
        track(targets);
      });
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    // --- the band answers the reader -------------------------------------
    // The marquee is the railcar's band, so it runs with the direction of
    // travel. Reversing on scroll direction makes the train feel driven
    // rather than idling.
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        sweep();
        const y = window.scrollY;
        if (Math.abs(y - lastY) > 4) {
          root.style.setProperty(
            '--fx-marquee-direction',
            y > lastY ? 'normal' : 'reverse'
          );
          lastY = y;
        }
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    const onPreferenceChange = () => {
      if (reduceMotion.matches) {
        root.classList.remove('fx-motion');
        for (const el of targets) el.classList.add('fx-in');
      }
    };
    reduceMotion.addEventListener('change', onPreferenceChange);

    return () => {
      mutations.disconnect();
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      reduceMotion.removeEventListener('change', onPreferenceChange);
      root.classList.remove('fx-motion');
    };
  }, []);

  return null;
}
