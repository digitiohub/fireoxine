import type { NextConfig } from 'next';
import path from 'node:path';

/** The API's origin, which is also where uploaded media is served from. */
const mediaUrl = new URL(process.env.NEXT_PUBLIC_MEDIA_URL ?? 'http://localhost:3002');

const nextConfig: NextConfig = {
  // Running `next build` while `next dev` is live overwrites .next underneath
  // the dev server and corrupts its module graph. Giving a verification build
  // its own directory (npm run build:check) makes that impossible.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@fireoxine/types', '@fireoxine/ui'],
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  images: {
    // Product photography now lives with the API, not in this app's public
    // directory, so next/image has to be told the origin is trusted.
    remotePatterns: [
      {
        protocol: mediaUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: mediaUrl.hostname,
        port: mediaUrl.port || undefined,
        pathname: '/uploads/**',
      },
      {
        protocol: mediaUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: mediaUrl.hostname,
        port: mediaUrl.port || undefined,
        pathname: '/placeholders/**',
      },
    ],
  },
  experimental: { optimizePackageImports: ['lucide-react'] },
};

export default nextConfig;
