import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@staysafeos/ui", "@staysafeos/theme"],
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3001", "*.staysafeos.com"],
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
        hostname: "imagedelivery.net",
      },
    ],
  },
};

export default nextConfig;
