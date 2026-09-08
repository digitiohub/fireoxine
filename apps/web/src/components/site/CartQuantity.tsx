'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Minus, Plus, Trash2, Loader2 } from 'lucide-react';
import { updateCartQuantity, removeCartItem } from '@/actions/cart';

export function CartQuantity({
  itemId,
  quantity,
  max,
}: {
  itemId: string;
  quantity: number;
  max: number;
}) {
  const [pending, startTransition] = useTransition();

  const set = (next: number) => {
    startTransition(async () => {
      const result = await updateCartQuantity(itemId, next);
      if (!result.ok) toast.error(result.error);
      else if (result.message) toast.info(result.message);
    });
  };

  const remove = () => {
    startTransition(async () => {
      const result = await removeCartItem(itemId);
      if (result.ok) toast.success('Removed from cart.');
      else toast.error(result.error);
    });
  };

  return (
    <div className="flex items-center gap-4">
      <div className="inline-flex items-stretch border border-rule-strong">
        <button
          type="button"
          onClick={() => set(quantity - 1)}
          disabled={pending || quantity <= 1}
          aria-label="Decrease quantity"
          className="grid size-9 place-items-center text-ink-muted transition-colors hover:text-ink disabled:text-ink-faint/50"
        >
          <Minus className="size-3.5" aria-hidden="true" />
        </button>
        <span
          aria-live="polite"
          className="fx-num grid w-10 place-items-center border-x border-rule-strong text-sm"
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : quantity}
        </span>
        <button
          type="button"
          onClick={() => set(quantity + 1)}
          disabled={pending || quantity >= max}
          aria-label="Increase quantity"
          className="grid size-9 place-items-center text-ink-muted transition-colors hover:text-ink disabled:text-ink-faint/50"
        >
          <Plus className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="inline-flex items-center gap-1.5 text-xs text-ink-faint transition-colors hover:text-wedge"
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
        Remove
      </button>
    </div>
  );
}
