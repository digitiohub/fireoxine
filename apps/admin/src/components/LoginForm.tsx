'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, TriangleAlert } from 'lucide-react';
import { adminLoginAction, type AuthState } from '@/actions/auth';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="fx-wedge w-full justify-center">
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Signing in
        </>
      ) : (
        'Sign in'
      )}
    </button>
  );
}

export function LoginForm() {
  const [state, action] = useActionState<AuthState, FormData>(adminLoginAction, {});

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <p
          role="alert"
          className="flex gap-2.5 border border-wedge bg-wedge/[0.06] p-3 text-sm text-ink"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-wedge" aria-hidden="true" />
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="email" className="fx-label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="fx-field"
        />
      </div>

      <div>
        <label htmlFor="password" className="fx-label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="fx-field"
        />
      </div>

      <Submit />
    </form>
  );
}
