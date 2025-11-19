import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "@/routes";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  if (isApiAuthRoute) {
    return null;
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return null;
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

  // Role-based access control for protected routes
  if (isLoggedIn && req.auth?.user) {
    const userRole = req.auth.user.role;
    const pathname = nextUrl.pathname;

    // Admin routes - restricted to ADMIN and GATEKEEPER roles
    if (pathname.startsWith("/admin")) {
      if (!["ADMIN", "GATEKEEPER"].includes(userRole)) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
      }
    }

    // Gatekeeper and review routes - restricted to ADMIN, GATEKEEPER, and REVIEWER roles
    if (pathname.includes("/gate-reviews") || pathname.includes("/reviews")) {
      if (!["ADMIN", "GATEKEEPER", "REVIEWER"].includes(userRole)) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
      }
    }

    // Project management routes - require PROJECT_LEAD, ADMIN, or GATEKEEPER
    if (
      pathname.includes("/projects/create") ||
      pathname.includes("/projects/edit")
    ) {
      if (!["ADMIN", "PROJECT_LEAD", "GATEKEEPER"].includes(userRole)) {
        return NextResponse.redirect(new URL("/projects", nextUrl));
      }
    }

    // Templates management - admin and gatekeeper only
    if (pathname.includes("/templates") && pathname.includes("/manage")) {
      if (!["ADMIN", "GATEKEEPER"].includes(userRole)) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
      }
    }

    // Reports - accessible to multiple roles
    if (pathname.startsWith("/reports")) {
      if (
        ![
          "ADMIN",
          "GATEKEEPER",
          "PROJECT_LEAD",
          "RESEARCHER",
          "REVIEWER",
        ].includes(userRole)
      ) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
      }
    }
  }

  return null;
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
