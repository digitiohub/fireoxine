import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  // Running `next build` while `next dev` is live overwrites .next underneath
  // the dev server and corrupts its module graph. Giving a verification build
  // its own directory (npm run build:check) makes that impossible.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: 'standalone',
  // The API is the only app that reads the database, and it also serves the
  // media it stores. Tracing has to reach the repo root because the Prisma
  // schema and the shared packages live above this directory.
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@fireoxine/types'],
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
};

export default nextConfig;
