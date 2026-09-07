import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Running `next build` while `next dev` is live overwrites .next underneath
  // the dev server and corrupts its module graph — the symptom is a runtime
  // "__webpack_modules__[moduleId] is not a function". Giving a verification
  // build its own directory (npm run build:check) makes that impossible.
  distDir: process.env.NEXT_DIST_DIR || '.next',

  // Standalone tracing so the container ships only the files the server
  // actually reaches, instead of the whole node_modules tree.
  output: 'standalone',

  // The dev server is reached over 127.0.0.1 as well as localhost.
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  // Several sibling projects share this parent directory, each with its own
  // lockfile. Pin the root so Next stops inferring the wrong one.
  outputFileTracingRoot: __dirname,
  images: {
    // Product imagery is uploaded through /admin and served from /uploads.
    // Remote patterns stay empty until the client names a CDN.
    remotePatterns: [],
  },
  experimental: { optimizePackageImports: ['lucide-react'] },
};

export default nextConfig;
