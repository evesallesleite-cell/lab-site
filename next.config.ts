import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  // Vercel handles hosting - no static export needed
  images: {
    unoptimized: true,
  },
  // trailingSlash: true, // Disabled - breaks API POST requests
};

export default nextConfig;
