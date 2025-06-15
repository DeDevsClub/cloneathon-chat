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
  redirects: async () => [
    {
      source: '/',
      destination: '/chats',
      permanent: true,
    },
  ],
};

export default nextConfig;
