/**
 * The shared kernel: the contract between the API and its two clients.
 *
 * Nothing here may import Prisma, React or Next. apps/api owns the database
 * and is the only workspace allowed to talk to it; web and admin see the
 * catalogue only through these shapes, over HTTP. Keeping the DTOs in one
 * place is what stops the three apps drifting apart silently.
 */
export * from './dto';
export * from './money';
export * from './labels';
