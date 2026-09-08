/**
 * Re-exported from the shared kernel so component imports stay short and the
 * three apps cannot drift on how a price or a date is rendered.
 */
export { cn, mediaUrl } from '@fireoxine/ui';
export {
  formatPaise,
  formatPaiseExact,
  discountPercent,
  mediumLabel,
  orderStatusLabel,
  formatDate,
  slugify,
} from '@fireoxine/types';
