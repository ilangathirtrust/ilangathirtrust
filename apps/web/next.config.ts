import path from 'node:path';
import type { NextConfig } from 'next';

const sharedSrc = path.resolve(process.cwd(), '../../packages/shared/src/index.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'www.ilangathirtrust.com' }
    ]
  },
  transpilePackages: ['@ilangathir/shared'],
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@ilangathir/shared': sharedSrc
    };
    return config;
  }
};

export default nextConfig;
