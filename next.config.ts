import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native database driver: load from node_modules at runtime instead of bundling.
  serverExternalPackages: ["@libsql/client", "libsql"],
  // Self-contained server for the Docker image (see Dockerfile).
  output: process.env.ZEST_STANDALONE === "1" ? "standalone" : undefined,
};

export default nextConfig;
