import { z } from 'zod';
import { db } from '@/lib/db';
import { err, forbidden, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/guard';
import type { SettingRowDto } from '@fireoxine/types';

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return forbidden();
  const rows = await db.siteSetting.findMany({ orderBy: { key: 'asc' } });
  return ok<SettingRowDto[]>(rows);
}

const schema = z.object({ values: z.record(z.string(), z.string()) });

/** Only keys that already exist are written, so the form cannot invent rows. */
export async function PUT(request: Request) {
  if (!(await requireAdmin(request))) return forbidden();

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return err('Nothing to save.');

  const rows = await db.siteSetting.findMany();
  let changed = 0;
  for (const row of rows) {
    const value = parsed.data.values[row.key];
    if (typeof value === 'string' && value !== row.value) {
      await db.siteSetting.update({ where: { key: row.key }, data: { value } });
      changed += 1;
    }
  }
  return ok({ changed, message: 'Settings saved.' });
}
