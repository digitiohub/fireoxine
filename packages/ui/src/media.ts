/**
 * The API stores image paths as `/uploads/<name>` and serves the files itself,
 * because it is the app that owns media as well as data. Both clients render
 * them from the API's origin, so there is one copy of every file on disk and
 * no sync step between three deployments.
 */
const BASE = (process.env.NEXT_PUBLIC_MEDIA_URL ?? 'http://localhost:3002').replace(/\/$/, '');

export function mediaUrl(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${BASE}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

export const MEDIA_BASE = BASE;
