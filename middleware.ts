/**
 * NextAuth v4 Middleware for Edge Runtime
 *
 * This middleware uses NextAuth v4's withAuth helper which is designed
 * for Edge Runtime compatibility.
 */

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { publicRoutes, authRoutes, apiAuthPrefix } from "./routes";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/auth");

    // Redirect authenticated users away from auth pages
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Role-based access control
    const userRole = token?.role;

    // Admin routes
    if (req.nextUrl.pathname.startsWith("/admin")) {
      if (userRole !== "ADMIN" && userRole !== "GATEKEEPER") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Review routes
    if (
      req.nextUrl.pathname.startsWith("/reviews") ||
      req.nextUrl.pathname.includes("/review")
    ) {
      if (
        userRole !== "ADMIN" &&
        userRole !== "GATEKEEPER" &&
        userRole !== "REVIEWER"
      ) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Project management routes
    if (
      req.nextUrl.pathname.startsWith("/projects/create") ||
      (req.nextUrl.pathname.includes("/projects/") &&
        req.nextUrl.pathname.includes("/edit"))
    ) {
      if (
        userRole !== "ADMIN" &&
        userRole !== "PROJECT_LEAD" &&
        userRole !== "GATEKEEPER"
      ) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Reports routes
    if (req.nextUrl.pathname.startsWith("/reports")) {
      if (
        userRole !== "ADMIN" &&
        userRole !== "GATEKEEPER" &&
        userRole !== "PROJECT_LEAD" &&
        userRole !== "REVIEWER"
      ) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Allow public routes
        const isPublicRoute = publicRoutes.includes(pathname);
        const isAuthRoute = authRoutes.some((route) =>
          pathname.startsWith(route)
        );
        const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);

        // Always allow API auth routes, auth pages, and public routes
        if (isApiAuthRoute || isAuthRoute || isPublicRoute) {
          return true;
        }

        // For all other routes, require authentication
        return !!token;
      },
    },
    pages: {
      signIn: "/auth/login",
    },
  }
);

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
