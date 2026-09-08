import { ok } from '@/lib/http';
import { loadCart } from '@/lib/cart';

export async function GET(request: Request) {
  return ok(await loadCart(request));
}
