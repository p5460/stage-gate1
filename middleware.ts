/**
 * Minimal Next.js Middleware for Testing Edge Runtime
 *
 * This is a simplified version to test if NextAuth v5 works in Edge Runtime at all.
 */

export { auth as middleware } from "@/auth";

/**
 * Middleware Configuration
 */
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
