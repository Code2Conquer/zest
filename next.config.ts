import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native database driver: load from node_modules at runtime instead of bundling.
  serverExternalPackages: ["@libsql/client", "libsql"],
};

export default nextConfig;
