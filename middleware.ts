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
 * Initialize Auth.js with Edge-Compatible Configuration
 *
 * IMPORTANT: Uses authConfig (not full auth.ts) for edge compatibility.
 * authConfig contains only OAuth providers and pages, no database operations.
 *
 * The auth() function returned here:
 * - Validates JWT tokens
 * - Provides session data from token
 * - Does NOT query database
 * - Works in Edge Runtime
 */
const { auth } = NextAuth(authConfig);

/**
 * Middleware Function
 *
 * Wrapped with auth() to provide authentication context.
 * Runs on every request matched by the config.matcher.
 *
 * Request Flow:
 * 1. User makes request
 * 2. Middleware intercepts request
 * 3. Auth validates JWT token
 * 4. Middleware checks route permissions
 * 5. Middleware allows/redirects request
 * 6. Request continues to page/API
 *
 * @param req - Augmented request with auth property
 * @returns Response or undefined (undefined = allow request)
 */
export default auth((req) => {
  const { nextUrl } = req;

  /**
   * Authentication Status Check
   *
   * req.auth contains session data from JWT token if user is authenticated.
   * Convert to boolean for easier checks.
   *
   * Note: This does NOT query the database. Session data comes from JWT token.
   */
  const isLoggedIn = !!req.auth;

  /**
   * Route Classification
   *
   * Classify the current route to determine how to handle it.
   *
   * Route Types:
   * - API Auth Routes: /api/auth/* (Auth.js endpoints)
   * - Public Routes: Accessible without authentication
   * - Auth Routes: Login, register, etc. (redirect if logged in)
   * - Protected Routes: Require authentication (redirect if not logged in)
   */
  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  /**
   * Rule 1: Allow API Auth Routes
   *
   * Always allow Auth.js API routes (/api/auth/*).
   * These handle sign-in, sign-out, callbacks, etc.
   *
   * Examples:
   * - /api/auth/signin
   * - /api/auth/callback/google
   * - /api/auth/session
   *
   * Why: These routes are needed for authentication to work.
   */
  if (isApiAuthRoute) {
    return; // Allow request to continue
  }

  /**
   * Rule 2: Redirect Authenticated Users from Auth Routes
   *
   * If user is already logged in, redirect away from auth pages.
   * This prevents logged-in users from seeing login/register pages.
   *
   * Auth Routes:
   * - /auth/login
   * - /auth/register
   * - /auth/reset
   * - /auth/new-password
   *
   * Redirect To: Dashboard (or custom DEFAULT_LOGIN_REDIRECT)
   *
   * Why: Improves UX by sending logged-in users to the app.
   */
  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return; // Allow unauthenticated users to access auth routes
  }

  /**
   * Rule 3: Redirect Unauthenticated Users to Login
   *
   * If user is not logged in and trying to access a protected route,
   * redirect to login page with callback URL.
   *
   * Callback URL:
   * - Preserves the original destination
   * - After login, user is redirected back to original page
   * - Includes query parameters if present
   *
   * Example:
   * User visits: /projects/123?tab=details
   * Redirected to: /auth/login?callbackUrl=%2Fprojects%2F123%3Ftab%3Ddetails
   * After login: Redirected back to /projects/123?tab=details
   *
   * Why: Provides seamless UX and prevents unauthorized access.
   */
  if (!isLoggedIn && !isPublicRoute) {
    // Build callback URL with path and query parameters
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }

    // URL-encode the callback URL for safe transmission
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);

    // Redirect to login with callback URL
    // IMPORTANT: Use URL constructor for edge-compatible URL building
    return Response.redirect(
      new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }

  /**
   * Role-Based Access Control (RBAC)
   *
   * For authenticated users, check if their role allows access to the route.
   *
   * Role Data Source:
   * - Comes from JWT token (req.auth.user.role)
   * - No database query needed (edge-compatible)
   * - Updated on token refresh in Node.js runtime
   *
   * Important: Role data may be slightly stale in edge runtime.
   * For critical operations, verify role in API route or server component.
   */
  const userRole = req.auth?.user?.role;

  /**
   * RBAC Rule 1: Admin Routes
   *
   * Routes: /admin/*
   * Allowed Roles: ADMIN, GATEKEEPER
   *
   * Admin routes provide access to:
   * - User management
   * - System configuration
   * - Analytics and reporting
   * - Cluster management
   *
   * Why GATEKEEPER: Gatekeepers need admin access for approval workflows
   */
  if (nextUrl.pathname.startsWith("/admin")) {
    if (userRole !== "ADMIN" && userRole !== "GATEKEEPER") {
      return Response.redirect(new URL("/dashboard", nextUrl));
    }
  }

  /**
   * RBAC Rule 2: Review Routes
   *
   * Routes: /reviews/*, any path containing "/review"
   * Allowed Roles: ADMIN, GATEKEEPER, REVIEWER
   *
   * Review routes provide access to project reviews, gate reviews,
   * review submissions, and review history.
   *
   * Why these roles are allowed:
   * ADMIN has full system access.
   * GATEKEEPER has approval authority.
   * REVIEWER is assigned to review projects.
   */
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

  /**
   * RBAC Rule 3: Project Management Routes
   *
   * Routes: /projects/create, /projects/[id]/edit
   * Allowed Roles: ADMIN, PROJECT_LEAD, GATEKEEPER
   *
   * Project management routes provide access to creating new projects,
   * editing existing projects, managing project details, and assigning team members.
   *
   * Why these roles are allowed:
   * ADMIN has full system access.
   * PROJECT_LEAD manages their own projects.
   * GATEKEEPER has oversight and approval authority.
   *
   * Note: Viewing projects is allowed for all authenticated users.
   * Only creation and editing are restricted.
   */
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

  /**
   * RBAC Rule 4: Reports Routes
   *
   * Routes: /reports/*
   * Allowed Roles: ADMIN, GATEKEEPER, PROJECT_LEAD, REVIEWER
   *
   * Reports routes provide access to project reports, analytics dashboards,
   * export functionality, and historical data.
   *
   * Why these roles are allowed:
   * ADMIN has full system access.
   * GATEKEEPER needs reports for oversight.
   * PROJECT_LEAD needs reports for their projects.
   * REVIEWER needs reports for review context.
   *
   * Note: Most roles need access to reports for their work.
   * Only basic users (USER, RESEARCHER) are restricted.
   */
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

  /**
   * Allow Request
   *
   * If we reach here, the request passes all checks:
   * - User is authenticated (or route is public)
   * - User has required role (or route doesn't require specific role)
   * - No redirects needed
   *
   * Return undefined to allow the request to continue to the page/API.
   */
  return;
});

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
