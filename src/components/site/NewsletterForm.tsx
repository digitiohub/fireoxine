'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Send, Loader2 } from 'lucide-react';
import { newsletterAction, type FormState } from '@/actions/forms';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Subscribe"
      className="grid size-9 shrink-0 place-items-center text-wedge transition-colors hover:text-wedge-deep disabled:text-ink-faint"
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Send className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}

export function NewsletterForm() {
  const [state, action] = useActionState<FormState, FormData>(newsletterAction, {});

  return (
    <div>
      <form action={action} className="flex items-center gap-2 border-b border-rule-strong">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="Your email address"
          aria-invalid={state.error ? 'true' : undefined}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint"
        />
        <Submit />
      </form>
      <p
        aria-live="polite"
        className={`mt-2 min-h-[1.25rem] text-xs ${state.error ? 'text-wedge' : 'text-ink-faint'}`}
      >
        {state.error ?? state.message ?? ''}
      </p>
    </div>
  );
}
