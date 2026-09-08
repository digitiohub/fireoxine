import { db } from '@/lib/db';
import { ok } from '@/lib/http';
import type { FaqDto } from '@fireoxine/types';

export async function GET(request: Request) {
  const group = new URL(request.url).searchParams.get('group');
  const rows = await db.faq.findMany({
    where: { isActive: true, ...(group ? { group: group as 'GENERAL' | 'PARTNER' } : {}) },
    orderBy: [{ group: 'asc' }, { position: 'asc' }],
    select: { id: true, question: true, answer: true, group: true },
  });
  return ok<FaqDto[]>(rows);
}
