'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { EnquiryStatus } from '@prisma/client';
import { updateEnquiryStatus } from '@/actions/admin';

const STATUSES: EnquiryStatus[] = ['NEW', 'CONTACTED', 'CLOSED'];

export function EnquiryStatusSelect({
  kind,
  id,
  status,
}: {
  kind: 'partner' | 'contact';
  id: string;
  status: EnquiryStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label>
      <span className="sr-only">Enquiry status</span>
      <select
        value={status}
        disabled={pending}
        onChange={(e) =>
          startTransition(async () => {
            const result = await updateEnquiryStatus(kind, id, e.target.value as EnquiryStatus);
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
