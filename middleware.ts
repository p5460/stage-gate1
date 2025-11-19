import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Route configuration
const publicRoutes = ["/", "/auth/new-verification"];
const authRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/error",
  "/auth/reset",
  "/auth/new-password",
];
const apiAuthPrefix = "/api/auth";
const DEFAULT_LOGIN_REDIRECT = "/dashboard";

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // Allow API auth routes to pass through
  if (pathname.startsWith(apiAuthPrefix)) {
    return NextResponse.next();
  }

  // Get the session token
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  const isLoggedIn = !!token;
  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthRoute = authRoutes.includes(pathname);

  // Redirect logged-in users away from auth pages
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return NextResponse.next();
  }

  // Redirect non-logged-in users to login
  if (!isLoggedIn && !isPublicRoute) {
    let callbackUrl = pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }

    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return NextResponse.redirect(
      new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }

  // Role-based access control for protected routes
  if (isLoggedIn && token?.role) {
    const userRole = token.role as string;

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

  return NextResponse.next();
}

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
