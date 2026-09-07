import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';

declare module 'next-auth' {
  interface Session {
    user: { id: string; role: 'CUSTOMER' | 'ADMIN' } & DefaultSession['user'];
  }
  interface User {
    role?: 'CUSTOMER' | 'ADMIN';
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  // JWT sessions, because the credentials provider cannot use database
  // sessions. Role rides on the token so admin route checks never hit the DB.
  session: { strategy: 'jwt' },
  pages: { signIn: '/account' },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        // Compare against a dummy hash when no user exists, so a missing
        // account and a wrong password take the same time to answer.
        const hash =
          user?.passwordHash ??
          '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
        const ok = await bcrypt.compare(parsed.data.password, hash);
        if (!user || !ok) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? 'CUSTOMER';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as 'CUSTOMER' | 'ADMIN') ?? 'CUSTOMER';
      }
      return session;
    },
  },
});

/** Returns null for any non-admin. Used by every /admin page. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') return null;
  return session.user;
}
