'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, TriangleAlert } from 'lucide-react';
import { loginAction, registerAction, type AuthState } from '@/actions/auth';
import { cn } from '@/lib/utils';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="fx-wedge mt-7 w-full justify-center">
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Working
        </>
      ) : (
        label
      )}
    </button>
  );
}

function Error({ message }: { message?: string }) {
  if (!message) return <p className="min-h-0" aria-live="polite" />;
  return (
    <p
      role="alert"
      className="mt-5 flex gap-2.5 border border-wedge bg-wedge/[0.06] p-3 text-sm text-ink"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-wedge" aria-hidden="true" />
      {message}
    </p>
  );
}

export function AuthPanel() {
  const [tab, setTab] = useState<'signin' | 'register'>('signin');
  const [loginState, login] = useActionState<AuthState, FormData>(loginAction, {});
  const [registerState, register] = useActionState<AuthState, FormData>(registerAction, {});

  return (
    <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2 lg:gap-16">
      <div className="border border-rule-strong bg-ground-raised p-7 sm:p-9">
        <div
          role="tablist"
          aria-label="Account"
          className="mb-8 flex border-b border-rule"
        >
          {(
            [
              ['signin', 'Sign in'],
              ['register', 'Create account'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={cn(
                'fx-stencil -mb-px border-b-2 px-4 py-3 text-[0.7rem] transition-colors',
                tab === value
                  ? 'border-wedge text-ink'
                  : 'border-transparent text-ink-faint hover:text-ink-muted'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'signin' ? (
          <form action={login} noValidate>
            <div className="space-y-5">
              <div>
                <label htmlFor="signin-email" className="fx-label">
                  Email
                </label>
                <input
                  id="signin-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="fx-field"
                />
              </div>
              <div>
                <label htmlFor="signin-password" className="fx-label">
                  Password
                </label>
                <input
                  id="signin-password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="fx-field"
                />
              </div>
            </div>
            <Error message={loginState.error} />
            <Submit label="Sign in" />
          </form>
        ) : (
          <form action={register} noValidate>
            <div className="space-y-5">
              <div>
                <label htmlFor="reg-name" className="fx-label">
                  Full name
                </label>
                <input
                  id="reg-name"
                  name="name"
                  required
                  autoComplete="name"
                  className="fx-field"
                />
              </div>
              <div>
                <label htmlFor="reg-email" className="fx-label">
                  Email
                </label>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="fx-field"
                />
              </div>
              <div>
                <label htmlFor="reg-phone" className="fx-label">
                  Mobile number
                </label>
                <input
                  id="reg-phone"
                  name="phone"
                  required
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="10 digits"
                  className="fx-field fx-num"
                />
              </div>
              <div>
                <label htmlFor="reg-password" className="fx-label">
                  Password
                </label>
                <input
                  id="reg-password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className="fx-field"
                />
              </div>
            </div>
            <Error message={registerState.error} />
            <Submit label="Create account" />
          </form>
        )}
      </div>

      <div className="self-center">
        <h2 className="fx-display text-3xl leading-tight sm:text-4xl">
          An extinguisher is not a one-off purchase.
        </h2>
        <div className="mt-6 space-y-4 text-[0.95rem] leading-relaxed text-ink-muted">
          <p>
            Every unit needs pressure checking every six months and refilling on a cycle — two
            years for water and foam, three for dry powder, five for CO2 and clean agent.
          </p>
          <p>
            An account keeps your order history, so when a refill falls due you can see exactly
            what you bought, in what capacity, and when.
          </p>
        </div>

        <dl className="mt-8 space-y-4 border-t border-rule pt-6 text-sm">
          {[
            ['Order history', 'Every unit, capacity and date in one place.'],
            ['Saved addresses', 'Site addresses for multi-premises buyers.'],
            ['Saved products', 'Build a list before you commit to an order.'],
          ].map(([term, detail]) => (
            <div key={term}>
              <dt className="fx-stencil text-[0.6rem] text-ink-faint">{term}</dt>
              <dd className="mt-1 text-ink-muted">{detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
