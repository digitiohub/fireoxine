'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { OrderStatus } from '@fireoxine/types';
import { updateOrderStatus } from '@/actions/admin';

const STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

export function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">Order status</span>
      <select
        value={status}
        disabled={pending}
        onChange={(e) =>
          startTransition(async () => {
            const result = await updateOrderStatus(orderId, e.target.value as OrderStatus);
            if (result.ok) {
              toast.success(result.message ?? 'Updated.');
              router.refresh();
            } else {
              toast.error(result.error ?? 'Could not update.');
            }
          })
        }
        className="border border-rule-strong bg-ground px-2.5 py-1.5 text-xs text-ink focus:border-wedge focus:outline-2 focus:outline-wedge disabled:text-ink-faint"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
