import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // output: 'export', // Removed: server runtime needed for PostgreSQL
  transpilePackages: ['@react-pdf/renderer', 'react-day-picker'],
  serverExternalPackages: ['postgres', 'pg'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // @ts-ignore - allowedDevOrigins is a new feature in Next.js 15
  allowedDevOrigins: ['localhost:9002', '10.118.21.225:9002', '0.0.0.0:9002'],
};

export default nextConfig;
