import { NextResponse } from 'next/server';
import { getToken } from '@/lib/session';

/**
 * A credential-attaching proxy, and the one route handler this app keeps.
 *
 * The admin token lives in an httpOnly cookie, so the browser cannot attach it
 * to a request itself — which is exactly the property that makes the cookie
 * worth having. The file picker posts here, this reads the cookie server-side
 * and forwards the multipart body to the API, which does the real validation
 * (magic bytes, size, type) and owns the file on disk.
 *
 * It streams the form through untouched rather than re-parsing it: this is a
 * courier, not a second implementation of the upload rules.
 */
const API = (process.env.API_URL ?? 'http://localhost:3002').replace(/\/$/, '');

export async function POST(request: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 403 });
  }

  const form = await request.formData();

  let upstream: Response;
  try {
    upstream = await fetch(`${API}/api/admin/images`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: form,
    });
  } catch {
    return NextResponse.json({ error: 'The API is unreachable.' }, { status: 502 });
  }

  const body = await upstream.json().catch(() => null);

  // Unwrap the API's envelope into the flat shape the uploader already reads.
  if (!upstream.ok || !body?.ok) {
    return NextResponse.json(
      { error: body?.error ?? 'Upload failed.' },
      { status: upstream.status }
    );
  }
  return NextResponse.json(body.data);
}
