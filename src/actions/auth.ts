'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { signIn, signOut } from '@/lib/auth';
import { mergeGuestCart } from '@/lib/cart';

export type AuthState = { error?: string; ok?: boolean };

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, 'Enter a 10-digit mobile number.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
});

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: 'An account with that email already exists. Sign in instead.' };
  }

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
    },
  });

  await mergeGuestCart(user.id);

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: 'Account created. Please sign in.' };
    throw error;
  }

  revalidatePath('/', 'layout');
  redirect('/account');
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });

  try {
    await signIn('credentials', { ...parsed.data, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      // One message for both wrong-email and wrong-password, so the form is
      // not a tool for discovering which addresses have accounts.
      return { error: 'Those details did not match an account.' };
    }
    throw error;
  }

  if (user) await mergeGuestCart(user.id);

  revalidatePath('/', 'layout');
  redirect(user?.role === 'ADMIN' ? '/admin' : '/account');
}

export async function logoutAction() {
  await signOut({ redirect: false });
  revalidatePath('/', 'layout');
  redirect('/');
}
