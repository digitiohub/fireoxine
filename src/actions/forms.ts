'use server';

import { z } from 'zod';
import { db } from '@/lib/db';

export type FormState = { ok?: boolean; error?: string; message?: string };

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  subject: z.string().trim().min(3, 'Enter a subject.'),
  message: z.string().trim().min(10, 'Tell us a little more — at least 10 characters.'),
});

export async function contactAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.contactMessage.create({ data: parsed.data });
  return { ok: true, message: 'Message received. We reply within one working day.' };
}

const partnerSchema = z.object({
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

export async function partnerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = partnerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  await db.partnerEnquiry.create({
    data: {
      ...d,
      gstNumber: d.gstNumber || null,
      monthlyVolume: d.monthlyVolume || null,
      message: d.message || null,
    },
  });

  return {
    ok: true,
    message: 'Enquiry received. Our trade team replies within two working days.',
  };
}

const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
});

export async function newsletterAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newsletterSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = await db.newsletterSubscriber.findUnique({
    where: { email: parsed.data.email },
  });
  // Already subscribed is not an error worth showing as one.
  if (existing) return { ok: true, message: 'You are already on the list.' };

  await db.newsletterSubscriber.create({ data: parsed.data });
  return { ok: true, message: 'Subscribed. Roughly one email a month.' };
}
