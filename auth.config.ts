import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import AzureAD from "next-auth/providers/azure-ad";

/**
 * Edge-Compatible Authentication Configuration
 *
 * IMPORTANT: This file must remain edge-runtime compatible!
 *
 * Purpose:
 * - Provides authentication configuration for Vercel Edge Runtime
 * - Used by middleware.ts for route protection at the edge
 * - Contains only OAuth provider configurations and custom pages
 *
 * Restrictions:
 * - NO database imports (@prisma/client, lib/db, etc.)
 * - NO Node.js-specific modules (fs, crypto, etc.)
 * - NO heavy computations or blocking operations
 * - NO callbacks that query the database
 * - NO module-level function calls or side effects
 *
 * What Goes Here:
 * ✅ OAuth provider configurations (Google, GitHub, Azure AD)
 * ✅ Custom page routes (signIn, error)
 * ✅ Edge-compatible utilities
 *
 * What Goes in auth.ts:
 * ❌ Prisma adapter
 * ❌ Database queries in callbacks
 * ❌ Credentials provider (requires database)
 * ❌ Session/JWT callbacks with database access
 * ❌ Environment validation (moved to auth.ts)
 *
 * @see auth.ts for full Node.js configuration
 * @see middleware.ts for usage in edge runtime
 */

/**
 * Explicit Edge Runtime Declaration
 *
 * This tells Next.js that this module is designed for Edge Runtime.
 * It enables build-time validation and prevents Node.js-specific code
 * from being bundled into the Edge Runtime middleware.
 */
export const runtime = "edge";

// Route configuration constants
const DEFAULT_LOGIN_REDIRECT = "/dashboard";
const apiAuthPrefix = "/api/auth";
const authRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/error",
  "/auth/reset",
  "/auth/new-password",
  "/auth/new-verification",
];
const publicRoutes = ["/", "/auth/new-verification"];

export default {
  /**
   * OAuth Providers Configuration
   *
   * These providers handle authentication through third-party services.
   * All providers auto-verify email addresses and don't require database
   * access during the initial authentication flow.
   *
   * Environment Variables Required:
   * - Google: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
   * - GitHub: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
   * - Azure AD: AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, AZURE_AD_TENANT_ID
   *
   * Redirect URIs (must be configured in provider console):
   * - Google: https://your-domain.com/api/auth/callback/google
   * - GitHub: https://your-domain.com/api/auth/callback/github
   * - Azure AD: https://your-domain.com/api/auth/callback/azure-ad
   */
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    AzureAD({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      // Azure AD requires tenant-specific issuer URL
      // Use 'common' for multi-tenant, or specific tenant ID for single-tenant
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
    }),
  ],
  /**
   * Custom Pages Configuration
   *
   * Defines custom routes for authentication flows instead of Auth.js defaults.
   * This allows for branded, application-specific authentication pages.
   *
   * signIn: Custom login page (default would be /api/auth/signin)
   * error: Custom error page for OAuth failures (default would be /api/auth/error)
   */
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  /**
   * Callbacks for Edge Runtime
   *
   * These callbacks run in Edge Runtime and must not use Node.js-specific features.
   */
  callbacks: {
    /**
     * Authorized Callback
     *
     * This callback runs in Edge Runtime for every request to determine if the user
     * is authorized to access the requested page. This is the recommended way to
     * implement middleware logic in NextAuth v5.
     *
     * @param auth - The authentication session (null if not authenticated)
     * @param request - The incoming request
     * @returns boolean - true to allow, false to redirect to sign-in
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
      const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
      const isAuthRoute = authRoutes.includes(nextUrl.pathname);

      // Always allow API auth routes
      if (isApiAuthRoute) {
        return true;
      }

      // Redirect authenticated users away from auth pages
      if (isAuthRoute) {
        if (isLoggedIn) {
          return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
        }
        return true;
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
      const userRole = auth?.user?.role;

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

      return true;
    },
  },
} as NextAuthConfig;
