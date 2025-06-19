import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  staticPageGenerationTimeout: 60, // Set the timeout to 60 seconds
  eslint: {
    // Disable ESLint during builds to prevent hanging
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript checking during builds for faster builds
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
