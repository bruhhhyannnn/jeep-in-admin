import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {},
  // experimental: {
  //   // Allow Firebase Admin SDK in server components
  //   serverComponentsExternalPackages: ['firebase-admin'],
  // },
};

export default nextConfig;
