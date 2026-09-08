import { db } from '@/lib/db';
import { forbidden, notFound, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/guard';

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) return forbidden();
  const { id } = await ctx.params;

  const image = await db.productImage.findUnique({ where: { id } });
  if (!image) return notFound('Image not found.');

  await db.productImage.updateMany({
    where: { productId: image.productId },
    data: { isPrimary: false },
  });
  await db.productImage.update({ where: { id }, data: { isPrimary: true } });

  return ok({ message: 'Primary image set.' });
}
