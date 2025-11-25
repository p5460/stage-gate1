/**
 * Next.js Middleware for Authentication (Edge Runtime)
 *
 * IMPORTANT: This middleware uses a separate NextAuth instance from auth.ts
 * because it runs in Edge Runtime and cannot use database operations.
 *
 * Architecture:
 * - middleware.ts: Uses NextAuth(authConfig) - Edge Runtime compatible
 * - auth.ts: Uses NextAuth(authConfig + database) - Node.js Runtime only
 *
 * This separation ensures middleware can run in Edge Runtime without
 * triggering database operations or Node.js-specific code.
 */

import NextAuth from "next-auth";
import authConfig from "./auth.config";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "./routes";

// Create Edge-compatible auth instance (no database operations)
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  if (isApiAuthRoute) {
    return;
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return;
  }

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

  const userRole = req.auth?.user?.role;

  if (nextUrl.pathname.startsWith("/admin")) {
    if (userRole !== "ADMIN" && userRole !== "GATEKEEPER") {
      return Response.redirect(new URL("/dashboard", nextUrl));
    }
  }

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

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
