'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, TriangleAlert } from 'lucide-react';
import { saveVariant, deleteVariant, type AdminState } from '@/actions/admin';
import { formatPaiseExact } from '@/lib/money';

type Variant = {
  id: string;
  label: string;
  capacity: number;
  capacityUnit: string;
  sku: string;
  pricePaise: number;
  mrpPaise: number | null;
  stock: number;
};

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="fx-wedge">
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Saving
        </>
      ) : (
        label
      )}
    </button>
  );
}

export function VariantEditor({
  productId,
  productSku,
  variants,
}: {
  productId: string;
  productSku: string;
  variants: Variant[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Variant | null>(null);
  const [adding, setAdding] = useState(false);
  const [state, action] = useActionState<AdminState, FormData>(saveVariant, {});

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? 'Saved.');
      setEditing(null);
      setAdding(false);
      router.refresh();
    }
  }, [state, router]);

  const remove = async (id: string) => {
    const result = await deleteVariant(id);
    if (result.ok) {
      toast.success(result.message ?? 'Deleted.');
      router.refresh();
    } else {
      toast.error(result.error ?? 'Could not delete.');
    }
  };

  const showForm = adding || editing !== null;

  return (
    <div>
      {variants.length > 0 && (
        <div className="overflow-x-auto border border-rule">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-rule bg-ground-sunk text-left">
                {['Capacity', 'SKU', 'Price', 'MRP', 'Stock', ''].map((h, i) => (
                  <th key={i} className="fx-stencil px-4 py-3 text-[0.6rem] text-ink-faint">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id} className="border-b border-rule last:border-0">
                  <td className="fx-num px-4 py-3">{v.label}</td>
                  <td className="fx-num px-4 py-3 text-ink-muted">{v.sku}</td>
                  <td className="fx-num px-4 py-3">{formatPaiseExact(v.pricePaise)}</td>
                  <td className="fx-num px-4 py-3 text-ink-muted">
                    {v.mrpPaise ? formatPaiseExact(v.mrpPaise) : '—'}
                  </td>
                  <td className="fx-num px-4 py-3">
                    <span className={v.stock === 0 ? 'text-wedge' : ''}>{v.stock}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(v);
                        setAdding(false);
                      }}
                      className="mr-3 text-xs text-ink-muted underline decoration-rule-strong underline-offset-4 hover:text-ink"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(v.id)}
                      aria-label={`Delete variant ${v.label}`}
                      className="text-ink-faint transition-colors hover:text-wedge"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!showForm && (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="fx-wedge-ghost mt-5"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add a capacity
        </button>
      )}

      {showForm && (
        <form action={action} noValidate className="mt-5 border border-rule-strong bg-ground-raised p-6">
          <input type="hidden" name="productId" value={productId} />
          {editing && <input type="hidden" name="id" value={editing.id} />}

          <h3 className="fx-display mb-5 text-lg">
            {editing ? `Edit ${editing.label}` : 'New capacity'}
          </h3>

          {state.error && (
            <p
              role="alert"
              className="mb-5 flex gap-2.5 border border-wedge bg-wedge/[0.06] p-3 text-sm text-ink"
            >
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-wedge" aria-hidden="true" />
              {state.error}
            </p>
          )}

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label htmlFor="v-label" className="fx-label">
                Display label
              </label>
              <input
                id="v-label"
                name="label"
                required
                placeholder="4 kg"
                defaultValue={editing?.label ?? ''}
                className="fx-field"
              />
            </div>
            <div>
              <label htmlFor="v-capacity" className="fx-label">
                Capacity value
              </label>
              <input
                id="v-capacity"
                name="capacity"
                type="number"
                step="0.1"
                required
                defaultValue={editing?.capacity ?? ''}
                className="fx-field fx-num"
              />
            </div>
            <div>
              <label htmlFor="v-unit" className="fx-label">
                Unit
              </label>
              <input
                id="v-unit"
                name="capacityUnit"
                required
                placeholder="kg"
                defaultValue={editing?.capacityUnit ?? 'kg'}
                className="fx-field"
              />
            </div>
            <div>
              <label htmlFor="v-sku" className="fx-label">
                Variant SKU
              </label>
              <input
                id="v-sku"
                name="sku"
                required
                placeholder={`${productSku}-4KG`}
                defaultValue={editing?.sku ?? ''}
                className="fx-field fx-num"
              />
            </div>
            <div>
              <label htmlFor="v-price" className="fx-label">
                Selling price (₹)
              </label>
              <input
                id="v-price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={editing ? (editing.pricePaise / 100).toFixed(2) : ''}
                className="fx-field fx-num"
              />
            </div>
            <div>
              <label htmlFor="v-mrp" className="fx-label">
                MRP (₹) <span className="text-ink-faint">(optional)</span>
              </label>
              <input
                id="v-mrp"
                name="mrp"
                type="number"
                step="0.01"
                min="0"
                defaultValue={editing?.mrpPaise ? (editing.mrpPaise / 100).toFixed(2) : ''}
                className="fx-field fx-num"
              />
            </div>
            <div>
              <label htmlFor="v-stock" className="fx-label">
                Stock on hand
              </label>
              <input
                id="v-stock"
                name="stock"
                type="number"
                min="0"
                required
                defaultValue={editing?.stock ?? 0}
                className="fx-field fx-num"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Submit label={editing ? 'Save capacity' : 'Add capacity'} />
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setAdding(false);
              }}
              className="fx-wedge-ghost"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
