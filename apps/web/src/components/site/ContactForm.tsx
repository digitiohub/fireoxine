'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Check, TriangleAlert } from 'lucide-react';
import { contactAction, type FormState } from '@/actions/forms';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="fx-wedge mt-7 w-full justify-center">
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Sending
        </>
      ) : (
        'Send message'
      )}
    </button>
  );
}

export function ContactForm() {
  const [state, action] = useActionState<FormState, FormData>(contactAction, {});

  if (state.ok) {
    return (
      <div>
        <span className="grid size-10 place-items-center bg-wedge text-wedge-ink">
          <Check className="size-5" aria-hidden="true" />
        </span>
        <h3 className="fx-display mt-5 text-2xl">Message sent</h3>
        <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-ink-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} noValidate>
      {state.error && (
        <p
          role="alert"
          className="mb-6 flex gap-2.5 border border-wedge bg-wedge/[0.06] p-3 text-sm text-ink"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-wedge" aria-hidden="true" />
          {state.error}
        </p>
      )}

      <div className="space-y-5">
        <div>
          <label htmlFor="contact-name" className="fx-label">
            Name
          </label>
          <input
            id="contact-name"
            name="name"
            required
            autoComplete="name"
            className="fx-field"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="fx-label">
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="fx-field"
          />
        </div>
        <div>
          <label htmlFor="contact-subject" className="fx-label">
            Subject
          </label>
          <input
            id="contact-subject"
            name="subject"
            required
            placeholder="Product selection, refilling, AMC, trade supply…"
            className="fx-field"
          />
        </div>
        <div>
          <label htmlFor="contact-message" className="fx-label">
            Message
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={6}
            required
            minLength={10}
            placeholder="If you are asking about coverage, tell us the floor area, what the space is used for, and whether there is a kitchen, a server room or fuel stored on site."
            className="fx-field resize-y"
          />
        </div>
      </div>

      <Submit />
    </form>
  );
}
