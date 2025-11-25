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
     * JWT Callback for Edge Runtime
     *
     * This callback runs in Edge Runtime and must not use database queries.
     * It only passes through the token data without modifications.
     */
    async jwt({ token }) {
      return token;
    },
    /**
     * Session Callback for Edge Runtime
     *
     * This callback runs in Edge Runtime and enriches the session with token data.
     */
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.role && session.user) {
        session.user.role = token.role as any;
      }
      if (token.name && session.user) {
        session.user.name = token.name;
      }
      if (token.email && session.user) {
        session.user.email = token.email;
      }
      if (typeof token.isOAuth === "boolean" && session.user) {
        session.user.isOAuth = token.isOAuth;
      }
      return session;
    },
  },
} as NextAuthConfig;
