import { z } from 'zod';
import { db } from '@/lib/db';
import { err, ok } from '@/lib/http';

const schema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return err(parsed.error.issues[0].message);

  const existing = await db.newsletterSubscriber.findUnique({
    where: { email: parsed.data.email },
  });
  // Already subscribed is not an error worth showing as one.
  if (existing) return ok({ message: 'You are already on the list.' });

  await db.newsletterSubscriber.create({ data: parsed.data });
  return ok({ message: 'Subscribed. Roughly one email a month.' }, { status: 201 });
}
