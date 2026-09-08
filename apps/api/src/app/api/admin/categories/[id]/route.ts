import { z } from 'zod';
import { db } from '@/lib/db';
import { err, forbidden, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/guard';

const schema = z.object({ imageUrl: z.string().nullable() });

/** Collection artwork is the only field the admin edits here today. */
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) return forbidden();
  const { id } = await ctx.params;

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return err('Invalid image.');

  await db.category.update({ where: { id }, data: { imageUrl: parsed.data.imageUrl } });
  return ok({
    message: parsed.data.imageUrl ? 'Collection image set.' : 'Collection image removed.',
  });
}
