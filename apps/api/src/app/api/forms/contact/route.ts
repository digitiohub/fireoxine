import { z } from 'zod';
import { db } from '@/lib/db';
import { err, ok } from '@/lib/http';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your name.'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  subject: z.string().trim().min(3, 'Enter a subject.'),
  message: z.string().trim().min(10, 'Tell us a little more — at least 10 characters.'),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return err(parsed.error.issues[0].message);

  await db.contactMessage.create({ data: parsed.data });
  return ok({ message: 'Message received. We reply within one working day.' }, { status: 201 });
}
