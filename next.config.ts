import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    SOLANA_NETWORK: process.env.SOLANA_NETWORK || 'devnet',
  },
};

export default nextConfig;

