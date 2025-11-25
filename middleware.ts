import NextAuth from "next-auth";
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

  // Allow API auth routes
  if (isApiAuthRoute) {
    return;
  }

  // Redirect logged-in users away from auth routes
  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return;
  }

  // Redirect non-logged-in users to login for protected routes
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

  // Admin routes - only ADMIN and GATEKEEPER
  if (nextUrl.pathname.startsWith("/admin")) {
    if (userRole !== "ADMIN" && userRole !== "GATEKEEPER") {
      return Response.redirect(new URL("/dashboard", nextUrl));
    }
  }

  // Gatekeeper routes - ADMIN, GATEKEEPER, REVIEWER
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

  // Project management routes - ADMIN, PROJECT_LEAD, GATEKEEPER
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

  // Reports routes - multiple roles
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

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
