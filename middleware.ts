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
 * @see auth.config.ts for edge-compatible auth configuration
 * @see routes.ts for route definitions
 */

import NextAuth from "next-auth";
import authConfig from "./auth.config";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "./routes";

/**
 * Initialize NextAuth with Edge-Compatible Configuration
 *
 * This creates an auth instance using only the edge-compatible configuration.
 * The auth function validates JWT tokens without querying the database.
 */
const { auth } = NextAuth(authConfig);

/**
 * Middleware Function
 *
 * Wrapped with auth() to provide authentication context.
 * Runs on every request matched by the config.matcher.
 */
export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  // Allow API auth routes
  if (isApiAuthRoute) {
    return;
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return;
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn && !isPublicRoute) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return Response.redirect(
      new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }

  // Role-based access control
  const userRole = req.auth?.user?.role;

  // Admin routes
  if (nextUrl.pathname.startsWith("/admin")) {
    if (userRole !== "ADMIN" && userRole !== "GATEKEEPER") {
      return Response.redirect(new URL("/dashboard", nextUrl));
    }
  }

  // Review routes
  if (
    nextUrl.pathname.startsWith("/reviews") ||
    nextUrl.pathname.includes("/review")
  ) {
    if (
      userRole !== "ADMIN" &&
      userRole !== "GATEKEEPER" &&
      userRole !== "REVIEWER"
    ) {
      return Response.redirect(new URL("/dashboard", nextUrl));
    }
  }

  // Project management routes
  if (
    nextUrl.pathname.startsWith("/projects/create") ||
    (nextUrl.pathname.includes("/projects/") &&
      nextUrl.pathname.includes("/edit"))
  ) {
    if (
      userRole !== "ADMIN" &&
      userRole !== "PROJECT_LEAD" &&
      userRole !== "GATEKEEPER"
    ) {
      return Response.redirect(new URL("/dashboard", nextUrl));
    }
  }

  // Reports routes
  if (nextUrl.pathname.startsWith("/reports")) {
    if (
      userRole !== "ADMIN" &&
      userRole !== "GATEKEEPER" &&
      userRole !== "PROJECT_LEAD" &&
      userRole !== "REVIEWER"
    ) {
      return Response.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return;
});

/**
 * Middleware Configuration
 *
 * Defines which routes the middleware should run on.
 */
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
