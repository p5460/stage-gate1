# Design Document

## Overview

This design document outlines the architecture for redesigning the authentication system to align with Auth.js v5 best practices. The redesign focuses on proper separation of concerns between edge-compatible and Node.js-specific code, improved callback organization, enhanced security, and better maintainability.

The key architectural change is splitting authentication configuration into two files:

- `auth.config.ts`: Edge-compatible configuration for middleware
- `auth.ts`: Full Node.js configuration with database operations

This separation ensures the middleware can run in Vercel's Edge Runtime while server components and API routes can leverage full database access.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Login Page   │  │ OAuth Flow   │  │ Protected    │     │
│  │              │  │              │  │ Pages        │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Middleware                        │
│                   (Edge Runtime)                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  auth.config.ts (Edge-Compatible)                  │    │
│  │  - Route protection                                 │    │
│  │  - Session validation from JWT                      │    │
│  │  - Role-based redirects                             │    │
│  │  - No database queries                              │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│              Server Components / API Routes                  │
│                   (Node.js Runtime)                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │  auth.ts (Full Configuration)                      │    │
│  │  - Prisma Adapter                                   │    │
│  │  - Database queries in callbacks                    │    │
│  │  - User data enrichment                             │    │
│  │  - Email verification checks                        │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Prisma Client                                      │    │
│  │  - User table                                       │    │
│  │  - Account table (OAuth)                            │    │
│  │  - Session table                                    │    │
│  │  - VerificationToken table                          │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

**Credentials Authentication:**

1. User submits email/password on login page
2. Credentials provider validates input against schema
3. System queries database for user by email
4. System compares password hash using bcrypt
5. If valid and email verified, JWT token is created
6. Session callback enriches session with user data
7. User is redirected to dashboard

**OAuth Authentication:**

1. User clicks OAuth provider button
2. System redirects to provider (Google/GitHub/Azure AD)
3. User authenticates with provider
4. Provider redirects back with authorization code
5. Auth.js exchanges code for user profile
6. SignIn callback checks if user exists, creates if needed
7. System assigns default role if none exists
8. JWT token is created with user data
9. User is redirected to dashboard

### Runtime Separation Strategy

**Edge Runtime (middleware.ts):**

- Uses `auth.config.ts` only
- No database queries
- Reads session data from JWT token
- Performs route protection and redirects
- Validates authentication state
- Enforces role-based access control using cached role data

**Node.js Runtime (server components, API routes):**

- Uses `auth.ts` with full configuration
- Performs database queries in callbacks
- Enriches JWT tokens with fresh user data
- Handles email verification checks
- Manages OAuth account linking
- Updates user roles and profile data

## Components and Interfaces

### Core Configuration Files

#### auth.config.ts (Edge-Compatible)

```typescript
import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import AzureAD from "next-auth/providers/azure-ad";

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    AzureAD({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
    }),
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
```

#### auth.ts (Full Node.js Configuration)

```typescript
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/data/user";
import { LoginSchema } from "@/schemas";
import authConfig from "@/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // OAuth providers auto-verify email
      if (account?.provider !== "credentials") {
        const existingUser = await getUserByEmail(user.email!);
        if (existingUser && !existingUser.role) {
          await db.user.update({
            where: { id: existingUser.id },
            data: { role: "USER" },
          });
        }
        return true;
      }

      // Credentials require email verification
      const existingUser = await getUserByEmail(user.email!);
      if (!existingUser?.emailVerified) return false;

      return true;
    },
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role;
      }

      if (session.user) {
        session.user.name = token.name;
        session.user.email = token.email!;
        session.user.isOAuth = token.isOAuth as boolean;
      }

      return session;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.role = user.role;
        token.isOAuth = !!account;
      }

      // Subsequent requests - refresh user data
      if (!user && token.email) {
        const dbUser = await db.user.findUnique({
          where: { email: token.email },
          include: { accounts: true },
        });

        if (dbUser) {
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.role = dbUser.role;
          token.isOAuth = dbUser.accounts.length > 0;
        }
      }

      return token;
    },
  },
  providers: [
    ...authConfig.providers,
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;

          const user = await getUserByEmail(email);
          if (!user || !user.password) return null;

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) return user;
        }

        return null;
      },
    }),
  ],
});
```

#### middleware.ts (Edge Runtime)

```typescript
import { auth } from "@/auth";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "@/routes";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  // Allow API auth routes
  if (isApiAuthRoute) return;

  // Redirect logged-in users away from auth routes
  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return;
  }

  // Redirect non-logged-in users to login
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
```

### Provider Configuration

#### OAuth Providers

**Google Provider:**

- Requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Provides email, name, and profile picture
- Auto-verifies email

**GitHub Provider:**

- Requires `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
- Provides username, email, and avatar
- Auto-verifies email

**Azure AD Provider:**

- Requires `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, and `AZURE_AD_TENANT_ID`
- Provides enterprise authentication
- Supports organizational accounts
- Auto-verifies email

#### Credentials Provider

- Validates email/password against database
- Uses Zod schema for input validation
- Requires email verification before allowing access
- Uses bcrypt for password hashing and comparison

### Session Management

#### JWT Strategy

The system uses JWT strategy for session management:

**Token Structure:**

```typescript
{
  sub: string; // User ID
  name: string; // User name
  email: string; // User email
  role: UserRole; // User role
  isOAuth: boolean; // OAuth vs credentials
  iat: number; // Issued at
  exp: number; // Expiration
}
```

**Token Lifecycle:**

1. Created on successful authentication
2. Stored in HTTP-only cookie
3. Refreshed on each request in Node.js runtime
4. Read from cookie in edge runtime (no refresh)
5. Invalidated on sign out

#### Session Enrichment

The session callback enriches the session object with:

- User ID from token.sub
- User role for RBAC
- User name and email
- OAuth status flag

## Data Models

### User Model (Existing Prisma Schema)

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  password      String?
  role          UserRole  @default(USER)
  accounts      Account[]
  sessions      Session[]
  // ... other fields
}

enum UserRole {
  ADMIN
  USER
  GATEKEEPER
  PROJECT_LEAD
  RESEARCHER
  REVIEWER
  CUSTOM
}
```

### Account Model (OAuth Linking)

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}
```

### Session Model (Database Sessions - Optional)

```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

Note: With JWT strategy, database sessions are not used, but the model remains for potential future migration.

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Credentials authentication validates against stored data

_For any_ valid email and password combination stored in the database, authenticating with those credentials should succeed and return a user object with matching email.
**Validates: Requirements 2.1**

### Property 2: OAuth authentication creates verified accounts

_For any_ new user authenticating via OAuth (Google, GitHub, or Azure AD), the system should create a user account with emailVerified automatically set to a non-null date.
**Validates: Requirements 2.3**

### Property 3: OAuth users receive default roles

_For any_ OAuth user signing in without an existing role, the system should assign the USER role by default.
**Validates: Requirements 2.4**

### Property 4: Unverified credentials users are denied access

_For any_ credentials user without email verification, sign-in attempts should be rejected and return false from the signIn callback.
**Validates: Requirements 2.5**

### Property 5: Role-based access control enforces route permissions

_For any_ protected route and any user, access should only be granted if the user's role is in the set of allowed roles for that route type (admin routes: ADMIN/GATEKEEPER, review routes: ADMIN/GATEKEEPER/REVIEWER, project routes: ADMIN/PROJECT_LEAD/GATEKEEPER, report routes: ADMIN/GATEKEEPER/PROJECT_LEAD/REVIEWER).
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 6: Unauthorized access redirects to dashboard

_For any_ user attempting to access a route without proper role permissions, the middleware should redirect to /dashboard.
**Validates: Requirements 3.5**

### Property 7: Sessions contain complete user data

_For any_ authenticated session, the session object should include all required fields: user ID, role, name, email, and isOAuth status.
**Validates: Requirements 4.2**

### Property 8: JWT tokens refresh user data in Node.js runtime

_For any_ JWT token refresh in Node.js runtime (server components, API routes), the system should query the database for fresh user data and update the token.
**Validates: Requirements 4.3**

### Property 9: Role changes reflect in next session

_For any_ user whose role is updated in the database, the next JWT token refresh should include the updated role value.
**Validates: Requirements 4.5**

### Property 10: Sessions persist across page refreshes

_For any_ successfully authenticated user, the session should remain valid across page refreshes until expiration or sign out.
**Validates: Requirements 5.1**

### Property 11: Sign out invalidates sessions

_For any_ user who signs out, subsequent requests should not have an authenticated session.
**Validates: Requirements 5.4**

### Property 12: Authenticated users redirect from auth routes

_For any_ authenticated user visiting an auth route (login, register, reset), the middleware should redirect to the dashboard.
**Validates: Requirements 5.5**

### Property 13: Middleware uses JWT data without database queries

_For any_ middleware execution, route access evaluation should use only session data from the JWT token without performing database queries.
**Validates: Requirements 6.3**

### Property 14: Middleware redirects use proper URL construction

_For any_ redirect in middleware, the URL should be properly constructed using the URL constructor with the nextUrl parameter.
**Validates: Requirements 6.4**

### Property 15: Authentication errors are logged

_For any_ authentication error (sign-in failure, callback error, database error), the system should log the error with sufficient context.
**Validates: Requirements 7.1**

### Property 16: Invalid credentials return user-friendly errors

_For any_ invalid credentials submission, the system should return null from the authorize function, triggering an appropriate error message.
**Validates: Requirements 7.2**

### Property 17: Database errors in callbacks are handled gracefully

_For any_ database query failure in JWT or session callbacks, the system should catch the error, log it, and return a valid token/session object without crashing.
**Validates: Requirements 7.4**

### Property 18: User queries include required relationships

_For any_ user sign-in, the database query should include the accounts relationship to determine OAuth status.
**Validates: Requirements 8.2**

### Property 19: Email verification uses correct field

_For any_ email verification check, the system should reference the emailVerified field from the database user object.
**Validates: Requirements 8.3**

### Property 20: All role types are supported

_For any_ user with a role from the set (ADMIN, USER, GATEKEEPER, PROJECT_LEAD, RESEARCHER, REVIEWER, CUSTOM), the system should correctly store and retrieve that role in sessions.
**Validates: Requirements 8.5**

### Property 21: Passwords use bcrypt hashing

_For any_ password comparison during credentials authentication, the system should use bcrypt.compare for constant-time comparison.
**Validates: Requirements 9.1, 9.2**

### Property 22: Required environment variables are present

_For any_ OAuth provider configuration, the required environment variables (client ID, client secret, and tenant ID for Azure) should be present.
**Validates: Requirements 9.4**

## Error Handling

### Authentication Errors

**Invalid Credentials:**

- Credentials provider returns `null` from authorize function
- Auth.js displays error message on login page
- No sensitive information leaked in error messages

**Email Not Verified:**

- SignIn callback returns `false`
- User redirected to login with verification message
- Verification email can be resent

**OAuth Provider Failures:**

- Auth.js redirects to `/auth/error` page
- Error details passed via query parameters
- User can retry authentication

### Database Errors

**Connection Failures:**

- JWT callback catches database errors
- Returns existing token data without crash
- Error logged for monitoring

**Query Failures:**

- Try-catch blocks around all database operations
- Graceful degradation (use cached data)
- Errors logged with context

### Session Errors

**Expired Sessions:**

- Middleware detects missing/invalid session
- Redirects to login with callback URL
- User can re-authenticate seamlessly

**Invalid JWT Tokens:**

- Auth.js validates token signature
- Invalid tokens treated as unauthenticated
- User redirected to login

### Edge Runtime Errors

**Database Access in Edge:**

- Prevented by code organization
- auth.config.ts contains no database imports
- Middleware uses only auth.config.ts

**Timeout Errors:**

- Middleware logic kept minimal
- No heavy computations in middleware
- Quick redirects and checks only

## Testing Strategy

### Unit Testing

The authentication system will use unit tests for specific scenarios and edge cases:

**Test Coverage:**

- Credentials provider validation with valid/invalid inputs
- Password hashing and comparison
- Email verification checks
- Role assignment for new OAuth users
- Error handling in callbacks
- URL construction for redirects
- Environment variable validation

**Testing Framework:**

- Jest for unit testing
- Testing Library for component tests
- Mock Auth.js functions for isolated testing

**Example Unit Tests:**

```typescript
describe("Credentials Provider", () => {
  it("should return null for invalid email format", async () => {
    const result = await authorize({ email: "invalid", password: "test" });
    expect(result).toBeNull();
  });

  it("should return null for non-existent user", async () => {
    const result = await authorize({
      email: "nonexistent@example.com",
      password: "test",
    });
    expect(result).toBeNull();
  });

  it("should return null for incorrect password", async () => {
    const result = await authorize({
      email: "user@example.com",
      password: "wrong",
    });
    expect(result).toBeNull();
  });
});

describe("SignIn Callback", () => {
  it("should reject unverified credentials users", async () => {
    const result = await signInCallback({
      user: { email: "unverified@example.com" },
      account: { provider: "credentials" },
    });
    expect(result).toBe(false);
  });

  it("should accept OAuth users", async () => {
    const result = await signInCallback({
      user: { email: "oauth@example.com" },
      account: { provider: "google" },
    });
    expect(result).toBe(true);
  });
});
```

### Property-Based Testing

The authentication system will use property-based testing to verify universal properties across all inputs:

**Property Testing Library:**

- fast-check for JavaScript/TypeScript property-based testing
- Minimum 100 iterations per property test

**Property Test Coverage:**

- Role-based access control across all role combinations
- Session data completeness for all user types
- JWT token refresh behavior
- Password hashing for random passwords
- URL construction for various paths
- Error handling for random invalid inputs

**Property Test Implementation:**

Each property-based test will be tagged with a comment explicitly referencing the correctness property from this design document using the format: **Feature: authjs-redesign, Property {number}: {property_text}**

```typescript
import fc from "fast-check";

describe("Property Tests", () => {
  /**
   * Feature: authjs-redesign, Property 5: Role-based access control enforces route permissions
   */
  it("should enforce RBAC for all route and role combinations", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("/admin", "/reviews", "/projects/create", "/reports"),
        fc.constantFrom(
          "ADMIN",
          "USER",
          "GATEKEEPER",
          "PROJECT_LEAD",
          "RESEARCHER",
          "REVIEWER",
          "CUSTOM"
        ),
        (route, role) => {
          const hasAccess = checkRouteAccess(route, role);
          const expectedAccess = getExpectedAccess(route, role);
          return hasAccess === expectedAccess;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: authjs-redesign, Property 7: Sessions contain complete user data
   */
  it("should include all required fields in sessions", () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          email: fc.emailAddress(),
          name: fc.string(),
          role: fc.constantFrom(
            "ADMIN",
            "USER",
            "GATEKEEPER",
            "PROJECT_LEAD",
            "RESEARCHER",
            "REVIEWER",
            "CUSTOM"
          ),
          isOAuth: fc.boolean(),
        }),
        (user) => {
          const session = createSession(user);
          return (
            session.user.id === user.id &&
            session.user.email === user.email &&
            session.user.name === user.name &&
            session.user.role === user.role &&
            session.user.isOAuth === user.isOAuth
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: authjs-redesign, Property 21: Passwords use bcrypt hashing
   */
  it("should use bcrypt for all password comparisons", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 8, maxLength: 100 }),
        async (password) => {
          const hash = await bcrypt.hash(password, 10);
          const match = await bcrypt.compare(password, hash);
          return match === true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Test Scenarios:**

- Complete authentication flows (credentials and OAuth)
- Session persistence across requests
- Role-based access control in real routes
- Error handling with actual database
- Middleware execution with various routes

**Testing Approach:**

- Use test database for integration tests
- Mock OAuth providers for testing
- Test actual HTTP requests and responses
- Verify database state after operations

### Edge Runtime Validation

**Validation Tests:**

- Import analysis to ensure no Node.js modules in auth.config.ts
- Middleware execution in edge runtime simulator
- Performance testing for middleware response times
- Deployment testing on Vercel

**Validation Tools:**

- Vercel CLI for local edge runtime testing
- Bundle analysis to check imports
- Lighthouse for performance metrics

## Implementation Notes

### Migration Strategy

**Phase 1: Preparation**

1. Review current auth implementation
2. Identify breaking changes
3. Plan backward compatibility approach
4. Set up feature flags if needed

**Phase 2: Configuration Refactoring**

1. Create new auth.config.ts with edge-compatible code
2. Update auth.ts with Node.js-specific code
3. Ensure proper callback organization
4. Test configuration in isolation

**Phase 3: Middleware Update**

1. Update middleware to use new auth configuration
2. Test edge runtime compatibility
3. Verify RBAC logic
4. Test redirects and URL construction

**Phase 4: Testing**

1. Run unit tests
2. Run property-based tests
3. Run integration tests
4. Test on Vercel preview deployment

**Phase 5: Deployment**

1. Deploy to staging environment
2. Monitor for errors
3. Validate authentication flows
4. Deploy to production

### Backward Compatibility

**Existing Sessions:**

- JWT tokens remain compatible
- No session invalidation required
- Users stay logged in during migration

**Database Schema:**

- No schema changes required
- Existing User, Account, Session tables work as-is
- All relationships maintained

**API Compatibility:**

- Auth.js exports remain the same
- `auth()`, `signIn()`, `signOut()` functions unchanged
- Server components continue working

### Performance Considerations

**Middleware Performance:**

- Minimal logic in middleware
- No database queries in edge runtime
- Fast JWT token validation
- Quick redirects

**Session Refresh:**

- Database queries only in Node.js runtime
- Cached token data used in edge runtime
- Efficient Prisma queries with proper indexes

**OAuth Performance:**

- Provider redirects handled by Auth.js
- Minimal custom logic in callbacks
- Efficient user lookup queries

### Security Considerations

**Password Security:**

- bcrypt with 10 salt rounds
- Constant-time comparison
- No password in JWT tokens
- Passwords never logged

**JWT Security:**

- Secure signing algorithm (HS256 or RS256)
- HTTP-only cookies
- Secure flag in production
- SameSite=Lax for CSRF protection

**OAuth Security:**

- State parameter validation (handled by Auth.js)
- PKCE for public clients
- Secure redirect URI validation
- Token exchange over HTTPS

**Session Security:**

- Short-lived JWT tokens (default 30 days)
- Automatic token refresh
- Secure cookie storage
- No sensitive data in tokens

### Monitoring and Logging

**Authentication Metrics:**

- Sign-in success/failure rates
- OAuth provider usage
- Email verification rates
- Session duration statistics

**Error Monitoring:**

- Database connection errors
- OAuth provider failures
- Invalid credential attempts
- Middleware errors

**Logging Strategy:**

- Log all authentication errors
- Log OAuth provider interactions
- Log role assignment events
- Avoid logging sensitive data (passwords, tokens)

**Monitoring Tools:**

- Vercel Analytics for performance
- Error tracking service (Sentry, etc.)
- Custom logging to database
- Real-time alerts for critical errors
