import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@staysafeos/ui", "@staysafeos/theme"],
  experimental: {
    // Enable server actions
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.staysafeos.com"],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.staysafeos.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
