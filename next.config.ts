import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Story pages read content/ with fs. Ship it with the server code so pages
  // that are rendered at request time (or revalidated) can still read it.
  outputFileTracingIncludes: {
    "/story/**": ["./content/**/*.json"],
  },
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
