import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  // Native database driver: load from node_modules at runtime instead of bundling.
  serverExternalPackages: ["@libsql/client", "libsql"],
  // Self-contained server for the Docker image (see Dockerfile).
  output: process.env.ZEST_STANDALONE === "1" ? "standalone" : undefined,
  // Photos on the website are resized per device; only files in /photos are optimised.
  images: { qualities: [60, 75], localPatterns: [{ pathname: "/photos/**" }] },
};

// Sentry: uploads source maps at build time so browser errors show real file and line numbers. Runs only when
// SENTRY_AUTH_TOKEN, SENTRY_ORG and SENTRY_PROJECT are set; otherwise the build is unchanged.
const sentry = !!(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT);

export default sentry
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
      telemetry: false,
      widenClientFileUpload: true,
      sourcemaps: { deleteSourcemapsAfterUpload: true },
    })
  : nextConfig;
