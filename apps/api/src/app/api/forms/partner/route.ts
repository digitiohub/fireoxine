import { z } from 'zod';
import { db } from '@/lib/db';
import { err, ok } from '@/lib/http';

const schema = z.object({
  businessName: z.string().trim().min(2, 'Enter your business name.'),
  contactPerson: z.string().trim().min(2, 'Enter a contact person.'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  phone: z.string().trim().regex(/^[0-9]{10}$/, 'Enter a 10-digit mobile number.'),
  businessType: z.string().trim().min(2, 'Select your business type.'),
  city: z.string().trim().min(2, 'Enter your city.'),
  state: z.string().trim().min(2, 'Enter your state.'),
  gstNumber: z.string().trim().optional().or(z.literal('')),
  monthlyVolume: z.string().trim().optional().or(z.literal('')),
  message: z.string().trim().max(1000).optional().or(z.literal('')),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return err(parsed.error.issues[0].message);

  const d = parsed.data;
  await db.partnerEnquiry.create({
    data: {
      ...d,
      gstNumber: d.gstNumber || null,
      monthlyVolume: d.monthlyVolume || null,
      message: d.message || null,
    },
  });

  return ok(
    { message: 'Enquiry received. Our trade team replies within two working days.' },
    { status: 201 }
  );
}
