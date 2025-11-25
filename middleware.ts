/**
 * NextAuth v4 Middleware for Edge Runtime
 *
 * This middleware uses getToken directly for full control over authentication
 * and route protection logic.
 */

import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "./routes";

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // Get authentication token
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isLoggedIn = !!token;

  // Check route types
  const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthRoute = authRoutes.includes(pathname);

  // Rule 1: Always allow API auth routes
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // Rule 2: Redirect authenticated users away from auth pages
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return NextResponse.next();
  }

  // Rule 3: Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Rule 4: Redirect unauthenticated users to login
  if (!isLoggedIn) {
    let callbackUrl = pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return NextResponse.redirect(
      new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }

  // Role-based access control
  const userRole = token?.role as string | undefined;

  // Admin routes
  if (pathname.startsWith("/admin")) {
    if (userRole !== "ADMIN" && userRole !== "GATEKEEPER") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  // Review routes
  if (pathname.startsWith("/reviews") || pathname.includes("/review")) {
    if (
      userRole !== "ADMIN" &&
      userRole !== "GATEKEEPER" &&
      userRole !== "REVIEWER"
    ) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  // Project management routes
  if (
    pathname.startsWith("/projects/create") ||
    (pathname.includes("/projects/") && pathname.includes("/edit"))
  ) {
    if (
      userRole !== "ADMIN" &&
      userRole !== "PROJECT_LEAD" &&
      userRole !== "GATEKEEPER"
    ) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  // Reports routes
  if (pathname.startsWith("/reports")) {
    if (
      userRole !== "ADMIN" &&
      userRole !== "GATEKEEPER" &&
      userRole !== "PROJECT_LEAD" &&
      userRole !== "REVIEWER"
    ) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
