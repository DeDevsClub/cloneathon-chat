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
    ],
  },
  redirects: async () => [
    {
      source: '/login',
      destination: '/auth/login',
      permanent: true,
    },
    {
      source: '/signup',
      destination: '/auth/signup',
      permanent: true,
    },
    {
      source: '/chat',
      destination: '/projects',
      permanent: true,
    },
    {
      source: '/chat/:id',
      destination: '/projects',
      permanent: true,
    },
  ],
};

export default nextConfig;
