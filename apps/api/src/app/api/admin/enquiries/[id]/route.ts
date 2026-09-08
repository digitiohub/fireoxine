import { z } from 'zod';
import { db } from '@/lib/db';
import { err, forbidden, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/guard';
import { ENQUIRY_STATUSES } from '@fireoxine/types';

const schema = z.object({
  kind: z.enum(['partner', 'contact']),
  status: z.enum(ENQUIRY_STATUSES),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) return forbidden();
  const { id } = await ctx.params;

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return err('Unknown enquiry status.');

  if (parsed.data.kind === 'partner') {
    await db.partnerEnquiry.update({ where: { id }, data: { status: parsed.data.status } });
  } else {
    await db.contactMessage.update({ where: { id }, data: { status: parsed.data.status } });
  }
  return ok({ message: 'Status updated.' });
}
