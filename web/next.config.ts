import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build a self-contained server bundle (.next/standalone) so the
  // Docker image can run `node server.js` without the full node_modules.
  output: "standalone",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;