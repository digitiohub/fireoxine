import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { db } from '@/lib/db';
import { forbidden, notFound, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/guard';

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) return forbidden();
  const { id } = await ctx.params;

  const image = await db.productImage.findUnique({ where: { id } });
  if (!image) return notFound('Image not found.');

  await db.productImage.delete({ where: { id } });

  // Remove the file too, but only from our own uploads directory.
  if (image.url.startsWith('/uploads/')) {
    const file = path.join(process.cwd(), 'public', 'uploads', path.basename(image.url));
    await unlink(file).catch(() => {});
  }

  // Promote the next image so a product never loses its primary silently.
  if (image.isPrimary) {
    const next = await db.productImage.findFirst({
      where: { productId: image.productId },
      orderBy: { position: 'asc' },
    });
    if (next) await db.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
  }

  return ok({ message: 'Image removed.' });
}
