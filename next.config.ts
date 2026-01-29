import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  // Vercel handles hosting - no static export needed
  images: {
    unoptimized: true,
  },
  eslint: {
    // Ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
  trailingSlash: true,
};

export default nextConfig;
