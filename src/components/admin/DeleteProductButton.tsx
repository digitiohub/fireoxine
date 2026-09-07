'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteProduct } from '@/actions/admin';

/**
 * Two-step, and the confirmation asks for the product name rather than a
 * generic "are you sure" — a destructive action should cost a moment of
 * attention, not a reflex click.
 */
export function DeleteProductButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [typed, setTyped] = useState('');
  const [pending, startTransition] = useTransition();

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="mt-5 inline-flex items-center gap-2 border border-wedge px-4 py-2.5 text-sm text-wedge transition-colors hover:bg-wedge hover:text-wedge-ink"
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Delete product
      </button>
    );
  }

  return (
    <div className="mt-5 border border-wedge bg-wedge/[0.06] p-5">
      <label htmlFor="confirm-delete" className="fx-label">
        Type <span className="text-ink">{productName}</span> to confirm
      </label>
      <input
        id="confirm-delete"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        className="fx-field max-w-md"
        autoComplete="off"
      />
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          disabled={typed !== productName || pending}
          onClick={() =>
            startTransition(async () => {
              const result = await deleteProduct(productId);
              if (result.ok) {
                toast.success(result.message ?? 'Deleted.');
                router.push('/admin/products');
                router.refresh();
              } else {
                toast.error(result.error ?? 'Could not delete.');
              }
            })
          }
          className="fx-wedge"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Deleting
            </>
          ) : (
            'Delete permanently'
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setArmed(false);
            setTyped('');
          }}
          className="fx-wedge-ghost"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
