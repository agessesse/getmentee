import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    dirs: ['app', 'components', 'lib', 'utils'],
  },
};

export default nextConfig;
