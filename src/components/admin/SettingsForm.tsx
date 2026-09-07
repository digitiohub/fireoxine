'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, TriangleAlert } from 'lucide-react';
import { saveSettings, type AdminState } from '@/actions/admin';

type Group = {
  group: string;
  label: string;
  note?: string;
  rows: { key: string; label: string; value: string }[];
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="fx-wedge">
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Saving
        </>
      ) : (
        'Save settings'
      )}
    </button>
  );
}

export function SettingsForm({ groups }: { groups: Group[] }) {
  const router = useRouter();
  const [state, action] = useActionState<AdminState, FormData>(saveSettings, {});

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? 'Saved.');
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={action} className="space-y-10">
      {state.error && (
        <p
          role="alert"
          className="flex gap-2.5 border border-wedge bg-wedge/[0.06] p-3 text-sm text-ink"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-wedge" aria-hidden="true" />
          {state.error}
        </p>
      )}

      {groups.map(({ group, label, note, rows }) => (
        <fieldset key={group}>
          <legend className="fx-display mb-2 text-xl">{label}</legend>
          {note && <p className="mb-5 max-w-[64ch] text-sm text-ink-muted">{note}</p>}
          <div className="grid gap-5 sm:grid-cols-2">
            {rows.map((row) => (
              <div key={row.key} className={row.key.includes('address') ? 'sm:col-span-2' : ''}>
                <label htmlFor={row.key} className="fx-label">
                  {row.label}
                </label>
                <input
                  id={row.key}
                  name={row.key}
                  defaultValue={row.value}
                  className="fx-field"
                />
                <p className="fx-num mt-1 text-[0.65rem] text-ink-faint">{row.key}</p>
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      <div className="border-t border-rule pt-6">
        <Submit />
      </div>
    </form>
  );
}
