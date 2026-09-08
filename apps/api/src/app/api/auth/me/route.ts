import { ok, unauthorized } from '@/lib/http';
import { getUser } from '@/lib/guard';

export async function GET(request: Request) {
  const user = await getUser(request);
  if (!user) return unauthorized();
  return ok(user);
}
