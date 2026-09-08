import { NextResponse } from 'next/server';
import type { ApiErr, ApiOk } from '@fireoxine/types';

/**
 * Every route answers in one envelope, so a client never has to infer meaning
 * from a status code alone. The status is still correct for caches and logs.
 */
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiOk<T>>({ ok: true, data }, init);
}

export function err(error: string, status = 400, fieldErrors?: Record<string, string>) {
  return NextResponse.json<ApiErr>({ ok: false, error, fieldErrors }, { status });
}

export const unauthorized = () => err('Sign in to continue.', 401);
export const forbidden = () => err('Not authorised.', 403);
export const notFound = (what = 'Not found.') => err(what, 404);

/**
 * Turns a Zod error into the flat field map the forms expect.
 * Zod 4 exposes issues as a flat array; the first message per field wins.
 */
export function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? '_');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
