/**
 * NextAuth v4 Helper Functions
 *
 * These helpers provide a consistent API for getting session data
 * in server components and API routes.
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

/**
 * Get the current session in server components
 *
 * Usage:
 * ```ts
 * const session = await auth();
 * ```
 */
export async function auth() {
  return await getServerSession(authOptions);
}
