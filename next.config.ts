import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Experimental Features Configuration
   *
   * serverComponentsExternalPackages: Prevents these packages from being bundled
   * by webpack, treating them as external dependencies. This is important for
   * packages that use Node.js-specific features.
   */
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },

  /**
   * Webpack Configuration
   *
   * Custom webpack configuration to handle Edge Runtime compatibility.
   * This prevents Node.js-specific packages from being bundled into
   * Edge Runtime middleware, which would cause runtime errors.
   */
  webpack: (config, { isServer, nextRuntime }) => {
    /**
     * Edge Runtime Bundle Configuration
     *
     * When building for Edge Runtime (middleware), we need to prevent
     * Node.js-specific packages from being included in the bundle.
     *
     * Why this is needed:
     * - Prisma Client uses __dirname, process.cwd(), and other Node.js globals
     * - These are not available in Vercel's Edge Runtime
     * - Setting these to false prevents webpack from bundling them
     *
     * Effect:
     * - If middleware tries to import these packages, build will fail
     * - This is good! It catches Edge Runtime incompatibilities at build time
     * - Middleware should only import auth.config.ts (edge-compatible)
     * - API routes and server components can still use these packages
     */
    if (isServer && nextRuntime === "edge") {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        // Prevent Prisma from being bundled in Edge Runtime
        "@prisma/client": false,
        "@prisma/client/edge": false,
        ".prisma/client": false,
        // Prevent bcryptjs from being bundled in Edge Runtime
        bcryptjs: false,
        bcrypt: false,
      };
    }

    return config;
  },
};

export default nextConfig;
