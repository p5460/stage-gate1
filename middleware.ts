/**
 * Next.js Middleware for Authentication and Authorization
 *
 * This middleware runs on EVERY request in Vercel Edge Runtime.
 * It handles authentication checks and role-based access control (RBAC).
 *
 * Execution Context: Vercel Edge Runtime
 *
 * Edge Runtime Constraints:
 * - NO database queries (use JWT token data only)
 * - NO Node.js-specific modules (fs, crypto, etc.)
 * - NO heavy computations (must complete quickly)
 * - Must use edge-compatible auth configuration
 *
 * Performance Requirements:
 * - Must complete in < 50ms typically
 * - Must not block page rendering
 * - Must be lightweight and fast
 *
 * What This Middleware Does:
 * 1. Validates authentication status from JWT token
 * 2. Redirects unauthenticated users to login
 * 3. Redirects authenticated users away from auth pages
 * 4. Enforces role-based access control for protected routes
 * 5. Preserves callback URLs for post-login redirects
 *
 * @see auth.config.ts for edge-compatible auth configuration and middleware logic
 * @see routes.ts for route definitions
 */

import NextAuth from "next-auth";
import authConfig from "./auth.config";

/**
 * Initialize NextAuth with Edge-Compatible Configuration
 *
 * This creates an auth instance using only the edge-compatible configuration.
 * The actual middleware logic is in the `authorized` callback in auth.config.ts.
 *
 * NextAuth v5 automatically handles Edge Runtime compatibility when using
 * the `authorized` callback pattern.
 */
export const { auth } = NextAuth(authConfig);

/**
 * Export auth as default middleware
 *
 * NextAuth v5 wraps the auth function to create middleware that:
 * - Validates JWT tokens
 * - Calls the `authorized` callback for each request
 * - Handles redirects based on callback return value
 */
export default auth;

/**
 * Middleware Configuration
 *
 * Defines which routes the middleware should run on.
 *
 * Matcher Pattern Explanation:
 * - "/((?!.+\\.[\\w]+$|_next).*)" - Match all routes except:
 *   - Static files (files with extensions like .jpg, .css, .js)
 *   - Next.js internal routes (_next/*)
 * - "/" - Match root route
 * - "/(api|trpc)(.*)" - Match all API and tRPC routes
 *
 * Why this matcher:
 * - Runs on all pages and API routes
 * - Skips static assets (performance optimization)
 * - Skips Next.js internals (prevents conflicts)
 *
 * Performance Impact:
 * - Middleware runs on every matched request
 * - Keep logic lightweight and fast
 * - Avoid heavy computations or database queries
 */
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
