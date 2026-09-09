import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "online-pictures-columbus-api.trycloudflare.com",
    "192.168.1.111",
    "localhost",
    "127.0.0.1",
  ],
  serverExternalPackages: ["snarkjs", "ffjavascript", "circomlibjs", "viem"],
  turbopack: {
    resolveAlias: {
      fs: "./lib/empty.ts",
      path: "./lib/empty.ts",
      os: "./lib/empty.ts",
      crypto: "./lib/empty.ts",
      stream: "./lib/empty.ts",
      readline: "./lib/empty.ts",
    },
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      os: false,
      path: false,
      crypto: false,
      stream: false,
      readline: false,
    };
    return config;
  },
};

export default nextConfig;
