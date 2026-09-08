/**
 * Money is integer paise end to end. These helpers are the only place that
 * knows how to turn it into something a person reads.
 */

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrExact = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ₹1,690 — for cards and listings, where the paise are noise. */
export function formatPaise(paise: number): string {
  return inr.format(paise / 100);
}

/** ₹1,690.00 — for the cart, checkout and invoices, where they are not. */
export function formatPaiseExact(paise: number): string {
  return inrExact.format(paise / 100);
}

/** Discount percentage, floored. Returns null when there is nothing to show. */
export function discountPercent(pricePaise: number, mrpPaise: number | null): number | null {
  if (!mrpPaise || mrpPaise <= pricePaise) return null;
  return Math.floor(((mrpPaise - pricePaise) / mrpPaise) * 100);
}
