/**
 * Full Authentication Configuration (Node.js Runtime)
 *
 * This file contains the complete Auth.js configuration including database operations.
 * It extends the edge-compatible configuration from auth.config.ts with Node.js-specific
 * features like database adapters, callbacks with database queries, and credentials provider.
 *
 * Architecture:
 * - Imports auth.config.ts for OAuth providers and pages
 * - Adds Prisma adapter for database integration
 * - Implements JWT strategy for session management
 * - Includes callbacks that query the database for fresh user data
 * - Provides Credentials provider for email/password authentication
 *
 * Runtime Context:
 * - Used by server components and API routes (Node.js runtime)
 * - NOT used by middleware (middleware uses auth.config.ts for edge compatibility)
 *
 * Key Features:
 * - Database-backed user authentication
 * - JWT token refresh with database queries
 * - Email verification enforcement
 * - Role-based access control
 * - OAuth account linking
 * - Comprehensive error handling and logging
 *
 * @see auth.config.ts for edge-compatible configuration
 * @see middleware.ts for edge runtime usage
 */

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/data/user";
import { LoginSchema } from "@/schemas";
import authConfig from "@/auth.config";
import {
  logAuthError,
  AuthErrorType,
  getUserFriendlyErrorMessage,
  retryOnTransientError,
} from "@/lib/auth-error-logger";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Spread edge-compatible configuration from auth.config.ts
  // This includes OAuth providers and custom pages
  ...authConfig,

  /**
   * Prisma Adapter Configuration
   *
   * Connects Auth.js to the database using Prisma ORM.
   * Handles automatic creation and management of:
   * - User accounts
   * - OAuth account linking
   * - Session storage (when using database strategy)
   * - Verification tokens
   *
   * Note: We use JWT strategy, so sessions are not stored in database,
   * but the adapter is still needed for user and account management.
   */
  adapter: PrismaAdapter(db) as any,

  /**
   * Session Strategy: JWT
   *
   * Uses JSON Web Tokens for session management instead of database sessions.
   *
   * Benefits:
   * - No database queries needed for session validation (edge-compatible)
   * - Scalable across distributed systems
   * - Works seamlessly in Edge Runtime
   * - Reduced database load
   *
   * Trade-offs:
   * - Session data updates require token refresh
   * - Cannot instantly invalidate sessions (must wait for token expiry)
   * - Token size limitations (keep data minimal)
   *
   * Alternative: "database" strategy stores sessions in database
   */
  session: { strategy: "jwt" },

  /**
   * Events Configuration
   *
   * Events are triggered at specific points in the authentication lifecycle.
   * Unlike callbacks, events cannot modify the flow or return values.
   * They're useful for side effects like logging or database updates.
   */
  events: {
    /**
     * linkAccount Event
     *
     * Triggered when an OAuth account is linked to a user.
     * This happens on first OAuth sign-in or when linking additional providers.
     *
     * Purpose: Auto-verify email for OAuth users
     *
     * OAuth providers (Google, GitHub, Azure AD) verify emails themselves,
     * so we trust their verification and mark the user's email as verified.
     */
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },

  /**
   * Callbacks Configuration
   *
   * Callbacks allow you to control what happens at various stages of authentication.
   * They can modify tokens, sessions, and control access.
   *
   * Execution Order:
   * 1. signIn - Controls whether sign-in is allowed
   * 2. jwt - Modifies JWT token (on creation and refresh)
   * 3. session - Modifies session object sent to client
   */
  callbacks: {
    /**
     * SignIn Callback
     *
     * Controls whether a user is allowed to sign in.
     * Return true to allow, false to deny.
     *
     * Execution Context: Node.js runtime (can query database)
     *
     * Use Cases:
     * - Enforce email verification for credentials users
     * - Assign default roles to new OAuth users
     * - Block users based on custom logic
     * - Auto-verify email for OAuth users
     *
     * @param user - User object from provider
     * @param account - Account object (contains provider info)
     * @returns boolean - true to allow sign-in, false to deny
     */
    async signIn({ user, account }) {
      try {
        /**
         * OAuth Provider Flow
         *
         * OAuth providers (Google, GitHub, Azure AD) handle authentication externally.
         * We trust their email verification, so we:
         * 1. Auto-verify the user's email
         * 2. Assign a default role if they don't have one
         * 3. Always allow sign-in
         *
         * This ensures OAuth users have a smooth onboarding experience.
         */
        if (account?.provider !== "credentials") {
          try {
            // Query database for existing user
            // Use retry logic to handle transient database errors
            const existingUser = await retryOnTransientError(
              () => getUserByEmail(user.email!),
              2, // Max 2 retries
              500 // 500ms delay between retries
            );

            if (existingUser) {
              // Prepare updates for the user record
              const updates: any = {};

              // Ensure OAuth users always have email verified
              // OAuth providers verify emails themselves, so we trust them
              if (!existingUser.emailVerified) {
                updates.emailVerified = new Date();
              }

              // Assign default role if user doesn't have one
              // This handles the case where OAuth users are created without a role
              if (!existingUser.role) {
                updates.role = "USER"; // Default role for OAuth users
              }

              // Only perform database update if there are changes
              // This avoids unnecessary database writes
              if (Object.keys(updates).length > 0) {
                await retryOnTransientError(
                  () =>
                    db.user.update({
                      where: { id: existingUser.id },
                      data: updates,
                    }),
                  2,
                  500
                );
              }
            }
          } catch (error) {
            // Log error but don't block sign-in
            // Role assignment is not critical for OAuth authentication
            logAuthError({
              type: AuthErrorType.ROLE_ASSIGNMENT_FAILED,
              message: "Failed to assign role to OAuth user",
              error,
              email: user.email ?? undefined,
              provider: account?.provider,
            });
            // Continue with sign-in even if role assignment fails
            // User can still authenticate, role can be assigned later
          }
          return true; // Always allow OAuth sign-in
        }

        /**
         * Credentials Provider Flow
         *
         * For email/password authentication, we require email verification.
         * This prevents unauthorized access from unverified accounts.
         *
         * Flow:
         * 1. User registers with email/password
         * 2. Verification email is sent
         * 3. User clicks verification link
         * 4. emailVerified field is set in database
         * 5. User can now sign in
         *
         * Security: Prevents account takeover via unverified emails
         */
        try {
          // Query database for user with retry logic
          const existingUser = await retryOnTransientError(
            () => getUserByEmail(user.email!),
            2,
            500
          );

          // Check if email is verified
          // emailVerified is a DateTime field, null means not verified
          if (!existingUser?.emailVerified) {
            logAuthError({
              type: AuthErrorType.EMAIL_NOT_VERIFIED,
              message:
                "Credentials user attempted sign-in without email verification",
              email: user.email ?? undefined,
            });
            return false; // Deny sign-in
          }

          return true; // Allow sign-in for verified credentials users
        } catch (error) {
          // Log database errors
          logAuthError({
            type: AuthErrorType.DATABASE_ERROR,
            message: "Failed to verify user email during sign-in",
            error,
            email: user.email ?? undefined,
          });
          return false; // Deny sign-in on database error (fail secure)
        }
      } catch (error) {
        // Catch-all for unexpected errors
        logAuthError({
          type: AuthErrorType.SIGNIN_FAILED,
          message: "Unexpected error in signIn callback",
          error,
          email: user.email ?? undefined,
          provider: account?.provider,
        });
        return false; // Deny sign-in on unexpected error (fail secure)
      }
    },
    /**
     * Session Callback
     *
     * Enriches the session object with data from the JWT token.
     * This callback runs whenever the session is accessed (e.g., useSession(), auth()).
     *
     * Execution Context: Both Edge and Node.js runtime
     *
     * Purpose:
     * - Add user data from JWT token to session object
     * - Make user data available to client-side code
     * - Ensure session includes all required fields for RBAC
     *
     * Data Flow:
     * JWT Token → Session Callback → Session Object → Client
     *
     * Important: This callback does NOT query the database.
     * It only reads data from the JWT token (which was populated by jwt callback).
     * This makes it edge-compatible and fast.
     *
     * @param token - JWT token containing user data
     * @param session - Session object to be sent to client
     * @returns Enriched session object
     */
    async session({ token, session }) {
      try {
        /**
         * Add User ID to Session
         *
         * token.sub contains the user's unique identifier (subject claim in JWT).
         * We add this to the session so client code can identify the user.
         *
         * Used for:
         * - Identifying the current user
         * - Querying user-specific data
         * - Authorization checks
         */
        if (token.sub && session.user) {
          session.user.id = token.sub;
        } else if (!token.sub) {
          logAuthError({
            type: AuthErrorType.SESSION_ERROR,
            message: "Missing token.sub in session callback",
            email: token.email as string | undefined,
          });
        }

        /**
         * Add User Role to Session
         *
         * Role is essential for Role-Based Access Control (RBAC).
         * Middleware and components use this to determine access permissions.
         *
         * Used for:
         * - Route protection in middleware
         * - Conditional rendering in components
         * - API authorization
         */
        if (token.role && session.user) {
          session.user.role = token.role as
            | "ADMIN"
            | "USER"
            | "GATEKEEPER"
            | "PROJECT_LEAD"
            | "RESEARCHER"
            | "REVIEWER"
            | "CUSTOM";
        } else if (!token.role) {
          logAuthError({
            type: AuthErrorType.SESSION_ERROR,
            message: "Missing token.role in session callback",
            userId: token.sub as string | undefined,
            email: token.email as string | undefined,
          });
        }

        /**
         * Add User Profile Data to Session
         *
         * Name and email are displayed in the UI and used for user identification.
         */
        if (session.user) {
          if (token.name) {
            session.user.name = token.name;
          } else {
            logAuthError({
              type: AuthErrorType.SESSION_ERROR,
              message: "Missing token.name in session callback",
              userId: token.sub as string | undefined,
            });
          }

          if (token.email) {
            session.user.email = token.email;
          } else {
            logAuthError({
              type: AuthErrorType.SESSION_ERROR,
              message: "Missing token.email in session callback",
              userId: token.sub as string | undefined,
            });
          }

          /**
           * Add OAuth Status to Session
           *
           * isOAuth indicates whether the user authenticated via OAuth or credentials.
           *
           * Used for:
           * - Conditional UI (e.g., hide password change for OAuth users)
           * - Security features (e.g., different 2FA requirements)
           * - Analytics and user behavior tracking
           */
          if (typeof token.isOAuth === "boolean") {
            session.user.isOAuth = token.isOAuth;
          } else {
            logAuthError({
              type: AuthErrorType.SESSION_ERROR,
              message: "Missing or invalid token.isOAuth in session callback",
              userId: token.sub as string | undefined,
              email: token.email as string | undefined,
            });
            session.user.isOAuth = false; // Default to false if missing
          }
        }

        return session;
      } catch (error) {
        // Log error but return session to prevent auth failure
        // Better to have incomplete session data than no session at all
        logAuthError({
          type: AuthErrorType.SESSION_ERROR,
          message: "Unexpected error in session callback",
          error,
          userId: token.sub as string | undefined,
          email: token.email as string | undefined,
        });
        // Return session as-is if error occurs to prevent auth failure
        return session;
      }
    },
    /**
     * JWT Callback
     *
     * Manages JWT token creation and refresh with database queries.
     * This is the key callback for keeping user data fresh in the JWT token.
     *
     * Execution Context: Node.js runtime ONLY (can query database)
     *
     * Execution Timing:
     * - On initial sign-in (user object present)
     * - On every subsequent request (user object absent)
     *
     * Purpose:
     * - Populate JWT token with user data on sign-in
     * - Refresh user data from database on subsequent requests
     * - Ensure role changes are reflected in active sessions
     *
     * Data Flow:
     * Database → JWT Callback → JWT Token → Session Callback → Client
     *
     * Important: This callback queries the database on EVERY request in Node.js runtime.
     * In Edge Runtime (middleware), the JWT token is used as-is without refresh.
     *
     * @param token - Current JWT token
     * @param user - User object (only present on initial sign-in)
     * @param account - Account object (only present on initial sign-in)
     * @returns Updated JWT token
     */
    async jwt({ token, user, account }) {
      /**
       * Initial Sign-In Flow
       *
       * When user object is present, this is the initial sign-in.
       * We populate the JWT token with user data from the sign-in.
       *
       * Data Source: User object from provider (OAuth or Credentials)
       */
      if (user) {
        // Add user role to token for RBAC
        token.role = user.role;

        // Determine if this is an OAuth sign-in
        // account object is only present for OAuth providers
        token.isOAuth = !!account;
      }

      /**
       * Subsequent Requests Flow (Token Refresh)
       *
       * When user object is absent, this is a subsequent request.
       * We query the database to get fresh user data and update the token.
       *
       * Why Refresh?
       * - Role changes: Admin updates user role in database
       * - Profile updates: User changes name or email
       * - Account linking: User links additional OAuth providers
       *
       * Data Source: Database query
       *
       * Performance Note:
       * This query runs on every request in Node.js runtime (server components, API routes).
       * It does NOT run in Edge Runtime (middleware), where the cached token is used.
       *
       * Trade-off:
       * - Pro: User data stays fresh, role changes take effect immediately
       * - Con: Additional database query on each request
       *
       * Optimization: Consider caching or reducing refresh frequency for high-traffic apps
       */
      if (!user && token.sub) {
        try {
          // Query database for fresh user data
          // Include accounts relationship to determine OAuth status
          const existingUser = await retryOnTransientError(
            async () =>
              await db.user.findUnique({
                where: { id: token.sub },
                include: {
                  accounts: true, // Include OAuth accounts
                },
              }),
            2, // Max 2 retries
            500 // 500ms delay between retries
          );

          if (existingUser) {
            // Update token with fresh data from database
            token.name = existingUser.name;
            token.email = existingUser.email;
            token.role = existingUser.role; // Critical: Ensures role changes take effect
            token.isOAuth = existingUser.accounts.length > 0; // User has OAuth accounts
          } else {
            // User not found in database (deleted or ID mismatch)
            logAuthError({
              type: AuthErrorType.JWT_ERROR,
              message: "User not found during JWT refresh",
              userId: token.sub,
            });
            // Keep existing token data, don't invalidate session
          }
        } catch (error) {
          // Database query failed (connection error, timeout, etc.)
          logAuthError({
            type: AuthErrorType.JWT_ERROR,
            message: "Failed to refresh user data in JWT callback",
            error,
            userId: token.sub,
          });
          // Return token with existing data (graceful degradation)
          // Better to have stale data than no session at all
        }
      }

      return token;
    },
  },
  /**
   * Providers Configuration
   *
   * Combines OAuth providers from auth.config.ts with Credentials provider.
   *
   * Provider Types:
   * 1. OAuth Providers (from auth.config.ts):
   *    - Google, GitHub, Azure AD
   *    - Handle authentication externally
   *    - Auto-verify email
   *    - No password required
   *
   * 2. Credentials Provider (defined here):
   *    - Email/password authentication
   *    - Requires database access
   *    - Requires email verification
   *    - Uses bcrypt for password hashing
   */
  providers: [
    // Spread OAuth providers from edge-compatible config
    ...authConfig.providers,

    /**
     * Credentials Provider
     *
     * Enables email/password authentication with database validation.
     *
     * Security Features:
     * - Input validation with Zod schema
     * - Bcrypt password hashing (10 salt rounds)
     * - Constant-time password comparison (prevents timing attacks)
     * - No sensitive data in error messages
     * - Comprehensive error logging
     *
     * Flow:
     * 1. User submits email/password
     * 2. Validate input format with Zod
     * 3. Query database for user by email
     * 4. Verify user exists and has password
     * 5. Compare password hash with bcrypt
     * 6. Return user object on success, null on failure
     *
     * Note: Email verification is checked in signIn callback, not here.
     * This allows us to return appropriate error messages.
     */
    Credentials({
      /**
       * Authorize Function
       *
       * Validates credentials and returns user object if valid.
       *
       * @param credentials - Raw credentials from login form
       * @returns User object if valid, null if invalid
       */
      async authorize(credentials) {
        try {
          /**
           * Step 1: Input Validation
           *
           * Use Zod schema to validate email format and password presence.
           * This prevents SQL injection and ensures data integrity.
           *
           * LoginSchema validates:
           * - Email is valid format (RFC 5322)
           * - Password is present (length checked at registration)
           */
          const validatedFields = LoginSchema.safeParse(credentials);

          if (!validatedFields.success) {
            logAuthError({
              type: AuthErrorType.CREDENTIALS_INVALID,
              message: "Invalid credentials format",
            });
            return null; // Invalid format, deny access
          }

          const { email, password } = validatedFields.data;

          /**
           * Step 2: User Lookup
           *
           * Query database for user by email.
           * Use retry logic to handle transient database errors.
           */
          const user = await retryOnTransientError(
            () => getUserByEmail(email),
            2, // Max 2 retries
            500 // 500ms delay
          );

          /**
           * Step 3: User Existence Check
           *
           * Verify user exists and has a password.
           * OAuth users don't have passwords, so we check for that.
           *
           * Security: Return same error for "user not found" and "wrong password"
           * to prevent user enumeration attacks.
           */
          if (!user || !user.password) {
            logAuthError({
              type: AuthErrorType.CREDENTIALS_INVALID,
              message: "User not found or no password set",
              email,
            });
            return null; // User doesn't exist or is OAuth-only
          }

          /**
           * Step 4: Password Verification
           *
           * Use bcrypt.compare for constant-time password comparison.
           * This prevents timing attacks where attackers measure response time
           * to determine if password is partially correct.
           *
           * bcrypt.compare:
           * - Automatically handles salt extraction from hash
           * - Constant-time comparison (same time for correct/incorrect)
           * - Secure against timing attacks
           */
          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) {
            /**
             * Success: Return User Object
             *
             * Return minimal user data needed for JWT token.
             * Don't include password or other sensitive data.
             *
             * Note: Email verification is checked in signIn callback.
             * We return the user here, and signIn callback will deny if not verified.
             */
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              emailVerified: user.emailVerified,
            };
          }

          /**
           * Failure: Password Mismatch
           *
           * Log the attempt but don't reveal which part was wrong.
           * Return null to deny access.
           */
          logAuthError({
            type: AuthErrorType.CREDENTIALS_INVALID,
            message: "Password mismatch",
            email,
          });
          return null;
        } catch (error) {
          /**
           * Unexpected Error
           *
           * Catch-all for any unexpected errors during authorization.
           * Log the error and deny access (fail secure).
           */
          logAuthError({
            type: AuthErrorType.CREDENTIALS_INVALID,
            message: "Error during credentials authorization",
            error,
          });
          return null;
        }
      },
    }),
  ],
});
