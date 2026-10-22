import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native database driver: load from node_modules at runtime instead of bundling.
  serverExternalPackages: ["@libsql/client", "libsql"],
  // Self-contained server for the Docker image (see Dockerfile).
  output: process.env.ZEST_STANDALONE === "1" ? "standalone" : undefined,
  // Photos on the website are resized per device; only files in /photos are optimised.
  images: { qualities: [75], localPatterns: [{ pathname: "/photos/**" }] },
};

export default nextConfig;
