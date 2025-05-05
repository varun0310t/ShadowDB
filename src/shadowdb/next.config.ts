import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com"], // Add your image domains here
  },
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint errors during build
  },
};

export default nextConfig;
