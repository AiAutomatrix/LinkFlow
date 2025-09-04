
import type {NextConfig} from 'next';
require('dotenv').config({ path: './.env.local' });

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      }
    ],
  },
  experimental: {
    ppr: false,
  },
  async rewrites() {
    return [
      {
        source: '/:username((?!api|dashboard|login|signup|_next|u|favicon.ico|sw.js).*)',
        destination: '/u/:username',
      },
    ]
  }
};

export default nextConfig;
