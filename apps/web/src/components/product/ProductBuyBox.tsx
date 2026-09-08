'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Minus, Plus, Heart, Loader2, ShoppingBag } from 'lucide-react';
import { addToCart, toggleWishlist } from '@/actions/cart';
import { formatPaiseExact, discountPercent } from '@/lib/money';
import { cn } from '@/lib/utils';

type Variant = {
  id: string;
  label: string;
  pricePaise: number;
  mrpPaise: number | null;
  stock: number;
  sku: string;
};

/**
 * Capacity is this category's variant axis. The selector shows every size
 * including the out-of-stock ones, disabled rather than hidden — a buyer
 * comparing a 4 kg against a 6 kg needs to know the 6 kg exists and is
 * temporarily gone, not to silently see a shorter list.
 */
export function ProductBuyBox({
  productId,
  variants,
  isSaved,
}: {
  productId: string;
  variants: Variant[];
  isSaved: boolean;
}) {
  const firstAvailable = variants.find((v) => v.stock > 0) ?? variants[0];
  const [selectedId, setSelectedId] = useState(firstAvailable?.id);
  const [quantity, setQuantity] = useState(1);
  const [saved, setSaved] = useState(isSaved);
  const [pending, startTransition] = useTransition();
  const [savePending, startSaveTransition] = useTransition();

  const variant = variants.find((v) => v.id === selectedId) ?? firstAvailable;
  if (!variant) return null;

  const inStock = variant.stock > 0;
  const discount = discountPercent(variant.pricePaise, variant.mrpPaise);
  const max = Math.max(1, Math.min(variant.stock, 99));

  const handleAdd = () => {
    startTransition(async () => {
      const result = await addToCart(variant.id, quantity);
      if (result.ok) toast.success(result.message ?? 'Added to cart.');
      else toast.error(result.error);
    });
  };

  const handleSave = () => {
    startSaveTransition(async () => {
      const result = await toggleWishlist(productId);
      if (result.ok) {
        setSaved((v) => !v);
        toast.success(result.message ?? 'Saved.');
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="border border-rule-strong bg-ground-raised p-6 sm:p-7">
      <div className="flex flex-wrap items-baseline gap-3">
        <p className="fx-display fx-num text-4xl leading-none">
          {formatPaiseExact(variant.pricePaise)}
        </p>
        {variant.mrpPaise && variant.mrpPaise > variant.pricePaise && (
          <p className="fx-num text-base text-ink-faint line-through">
            {formatPaiseExact(variant.mrpPaise)}
          </p>
        )}
        {discount !== null && (
          <span className="fx-stencil fx-num bg-wedge px-2 py-0.5 text-[0.6rem] text-wedge-ink">
            {discount}% off
          </span>
        )}
      </div>
      <p className="mt-1.5 text-xs text-ink-faint">Inclusive of all taxes</p>

      {/* Size */}
      <fieldset className="mt-7">
        <legend className="fx-stencil mb-3 text-[0.65rem] text-ink-faint">
          Select capacity
        </legend>
        <div className="flex flex-wrap gap-2">
          {variants.map((v) => {
            const active = v.id === variant.id;
            const out = v.stock === 0;
            return (
              <label
                key={v.id}
                className={cn(
                  'fx-num relative cursor-pointer border px-4 py-2.5 text-sm transition-colors',
                  active && !out && 'border-ink bg-ink text-ground',
                  !active && !out && 'border-rule-strong text-ink hover:border-ink',
                  out && 'cursor-not-allowed border-rule text-ink-faint'
                )}
              >
                <input
                  type="radio"
                  name="variant"
                  value={v.id}
                  checked={active}
                  disabled={out}
                  onChange={() => {
                    setSelectedId(v.id);
                    setQuantity(1);
                  }}
                  className="sr-only"
                />
                {v.label}
                {out && <span className="ml-1.5 text-[0.65rem]">· out</span>}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Quantity */}
      <div className="mt-6">
        <p className="fx-stencil mb-3 text-[0.65rem] text-ink-faint">Quantity</p>
        <div className="inline-flex items-stretch border border-rule-strong">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1 || !inStock}
            aria-label="Decrease quantity"
            className="grid size-10 place-items-center text-ink-muted transition-colors hover:text-ink disabled:text-ink-faint/50"
          >
            <Minus className="size-3.5" aria-hidden="true" />
          </button>
          <span
            aria-live="polite"
            className="fx-num grid w-12 place-items-center border-x border-rule-strong text-sm"
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(max, q + 1))}
            disabled={quantity >= max || !inStock}
            aria-label="Increase quantity"
            className="grid size-10 place-items-center text-ink-muted transition-colors hover:text-ink disabled:text-ink-faint/50"
          >
            <Plus className="size-3.5" aria-hidden="true" />
          </button>
        </div>
        {inStock && variant.stock <= 10 && (
          <p className="fx-num mt-2.5 text-xs text-wedge">Only {variant.stock} left in stock</p>
        )}
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inStock || pending}
          className="fx-wedge flex-1 justify-center"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Adding
            </>
          ) : (
            <>
              <ShoppingBag className="size-4" aria-hidden="true" />
              {inStock ? 'Add to cart' : 'Out of stock'}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={savePending}
          aria-pressed={saved}
          aria-label={saved ? 'Remove from saved items' : 'Save for later'}
          className={cn(
            'grid size-11 shrink-0 place-items-center border transition-colors',
            saved
              ? 'border-wedge bg-wedge text-wedge-ink'
              : 'border-rule-strong text-ink-muted hover:border-ink hover:text-ink'
          )}
        >
          {savePending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Heart className={cn('size-4', saved && 'fill-current')} aria-hidden="true" />
          )}
        </button>
      </div>

      <p className="fx-num mt-5 border-t border-rule pt-4 text-xs text-ink-faint">
        SKU {variant.sku}
      </p>
    </div>
  );
}
