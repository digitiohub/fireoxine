import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/session';
import { LoginForm } from '@/components/LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage() {
  // Already signed in: no reason to show the form again.
  if (await getAdmin()) redirect('/');

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-16">
      <div className="w-full max-w-sm">
        <p className="fx-stencil text-[0.6rem] text-wedge">FireOxine</p>
        <h1 className="fx-display mt-2 text-4xl leading-none">Back office</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          This is a separate application from the storefront, with its own
          sign-in. A customer account cannot open it.
        </p>
        <div className="mt-8 border border-rule-strong bg-ground-raised p-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
