import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
      {
        hostname: 'docs.dedevs.club',
      },
    ],
  },
  redirects: async () => [],
};

export default nextConfig;
