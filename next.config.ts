import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  // better-sqlite3 is a native module — exclude from bundler
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
