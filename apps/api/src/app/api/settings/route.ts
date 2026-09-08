import { ok } from '@/lib/http';
import { getSettings } from '@/lib/settings';

/** Public site copy and contact details. Read by every page of both clients. */
export async function GET() {
  return ok(await getSettings());
}
