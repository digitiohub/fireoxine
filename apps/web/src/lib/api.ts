import { getCartSessionId, getToken } from '@/lib/session';
import type { ApiResult } from '@fireoxine/types';

/**
 * The storefront's only door to data. Every page and every action goes
 * through here, and nothing in this app imports Prisma — that is the whole
 * point of splitting the API into its own service.
 *
 * These calls run on the server, so the session token is read from an
 * httpOnly cookie and forwarded as a bearer token. The browser never sees it.
 */
const BASE = (process.env.API_URL ?? 'http://localhost:3002').replace(/\/$/, '');

type Options = {
  /** Skip the session and cart headers, for genuinely public reads. */
  anonymous?: boolean;
  /** Next's fetch cache. Catalogue reads revalidate; carts never cache. */
  revalidate?: number | false;
  tags?: string[];
};

async function headers(options: Options, json: boolean): Promise<HeadersInit> {
  const out: Record<string, string> = {};
  if (json) out['content-type'] = 'application/json';
  if (!options.anonymous) {
    const token = await getToken();
    if (token) out.authorization = `Bearer ${token}`;
    const cart = await getCartSessionId();
    if (cart) out['x-cart-session'] = cart;
  }
  return out;
}

async function parse<T>(res: Response): Promise<ApiResult<T>> {
  const body = await res.json().catch(() => null);
  if (body && typeof body === 'object' && 'ok' in body) return body as ApiResult<T>;
  // A non-JSON answer means the API is down or misconfigured, not that the
  // request was invalid. Say so rather than showing an empty catalogue.
  return { ok: false, error: `The catalogue service returned ${res.status}.` };
}

export async function apiGet<T>(path: string, options: Options = {}): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: await headers(options, false),
      next:
        options.revalidate === undefined
          ? { revalidate: 0 }
          : { revalidate: options.revalidate === false ? 0 : options.revalidate, tags: options.tags },
    });
    return parse<T>(res);
  } catch {
    return { ok: false, error: 'The catalogue service is unreachable.' };
  }
}

async function send<T>(
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
  options: Options = {}
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: await headers(options, body !== undefined),
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    });
    return parse<T>(res);
  } catch {
    return { ok: false, error: 'The catalogue service is unreachable.' };
  }
}

export const apiPost = <T>(path: string, body?: unknown, o?: Options) =>
  send<T>('POST', path, body, o);
export const apiPatch = <T>(path: string, body?: unknown, o?: Options) =>
  send<T>('PATCH', path, body, o);
export const apiDelete = <T>(path: string, o?: Options) =>
  send<T>('DELETE', path, undefined, o);

/**
 * For reads where an empty result is a better page than an error page —
 * a rail that cannot load should not take the home page down with it.
 */
export async function apiGetOr<T>(path: string, fallback: T, options: Options = {}): Promise<T> {
  const res = await apiGet<T>(path, options);
  return res.ok ? res.data : fallback;
}

/**
 * Rebuilds a page's search params as a query string for the API. Repeated
 * keys survive, because the filter UI relies on `?class=A&class=B`.
 */
export function queryString(params: Record<string, string | string[] | undefined>): string {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) out.append(key, v);
  }
  const s = out.toString();
  return s ? `?${s}` : '';
}
