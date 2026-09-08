import { db } from '@/lib/db';
import { forbidden, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/guard';

/** Both inboxes in one call: trade enquiries and contact messages. */
export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return forbidden();

  const [partners, messages, subscribers] = await Promise.all([
    db.partnerEnquiry.findMany({ orderBy: { createdAt: 'desc' } }),
    db.contactMessage.findMany({ orderBy: { createdAt: 'desc' } }),
    db.newsletterSubscriber.findMany({ orderBy: { createdAt: 'desc' } }),
  ]);

  return ok({
    partners: partners.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })),
    messages: messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
    subscribers: subscribers.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() })),
  });
}
