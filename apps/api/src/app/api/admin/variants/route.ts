import { err, forbidden, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/guard';
import { saveVariant } from '@/lib/admin-write';

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) return forbidden();
  const result = await saveVariant(await request.json().catch(() => ({})));
  if (result.error) return err(result.error);
  return ok({ message: result.message });
}
