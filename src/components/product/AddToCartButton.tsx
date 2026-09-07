'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { addToCart } from '@/actions/cart';
import { cn } from '@/lib/utils';

export function AddToCartButton({
  variantId,
  quantity = 1,
  disabled,
  compact,
  className,
  label = 'Add to cart',
}: {
  variantId: string;
  quantity?: number;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();

  const handle = () => {
    startTransition(async () => {
      const result = await addToCart(variantId, quantity);
      if (result.ok) toast.success(result.message ?? 'Added to cart.');
      else toast.error(result.error);
    });
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handle}
        disabled={disabled || pending}
        aria-label={disabled ? 'Out of stock' : label}
        className={cn(
          'grid size-10 shrink-0 place-items-center border transition-colors duration-200',
          disabled
            ? 'cursor-not-allowed border-rule text-ink-faint'
            : 'border-ink bg-ink text-ground hover:bg-wedge hover:border-wedge hover:text-wedge-ink',
          className
        )}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <ShoppingBag className="size-4" aria-hidden="true" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={disabled || pending}
      className={cn('fx-wedge', className)}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Adding
        </>
      ) : (
        <>
          <ShoppingBag className="size-4" aria-hidden="true" />
          {disabled ? 'Out of stock' : label}
        </>
      )}
    </button>
  );
}
