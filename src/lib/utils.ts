import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MEDIUM_LABELS: Record<string, string> = {
  ABC_POWDER: 'ABC dry powder',
  BC_POWDER: 'BC dry powder',
  CO2: 'Carbon dioxide',
  MECHANICAL_FOAM: 'Mechanical foam (AFFF)',
  WATER: 'Water',
  WATER_MIST: 'Water mist',
  CLEAN_AGENT: 'Clean agent',
  WET_CHEMICAL: 'Wet chemical',
  D_CLASS_POWDER: 'Class D powder',
  NOT_APPLICABLE: '—',
};

export function mediumLabel(medium: string): string {
  return MEDIUM_LABELS[medium] ?? medium;
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/** Order numbers are human-readable and sortable: FX-250907-4821 */
export function makeOrderNumber(): string {
  const d = new Date();
  const stamp = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `FX-${stamp}-${rand}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
