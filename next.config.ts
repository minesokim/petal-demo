import type { NextConfig } from "next";
import { config } from "dotenv";

config();

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // assetPrefix removed
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost"
      },
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  },
  turbopack: {},
  webpack: (config) => {
    // react-pdf requires canvas to be false for SSR
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
