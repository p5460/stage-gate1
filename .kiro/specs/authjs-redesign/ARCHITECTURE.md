# Authentication Architecture Documentation

## Overview

This document describes the authentication architecture implemented using Auth.js (NextAuth v5) with a focus on edge runtime compatibility, security, and maintainability.

## Architecture Principles

### 1. Runtime Separation

The authentication system is split into two configuration files to support both Edge Runtime and Node.js Runtime:

- **`auth.config.ts`**: Edge-compatible configuration (no database access)
- **`auth.ts`**: Full Node.js configuration (with database operations)

This separation ensures:

- Middleware can run in Vercel's Edge Runtime
- Server components and API routes can access the database
- Optimal performance in both environments

### 2. Session Strategy

The system uses **JWT (JSON Web Token)** strategy for session management:

**Benefits:**

- No database queries required for session validation
- Works seamlessly in Edge Runtime
- Scalable across distributed systems
- Reduced database load

**Trade-offs:**

- Session data updates require token refresh
- Token size limitations (keep data minimal)
- Cannot instantly invalidate sessions (until token expires)

## Component Architecture

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

## Authentication Flows

### Credentials Authentication Flow

1. User submits email/password on login page
2. Credentials provider validates input using Zod schema
3. System queries database for user by email
4. System compares password hash using bcrypt
5. If valid and email verified, JWT token is created
6. Session callback enriches session with user data
7. User is redirected to dashboard

**Key Security Features:**

- Bcrypt password hashing with 10 salt rounds
- Constant-time password comparison
- Email verification requirement
- Input validation with Zod schemas

### OAuth Authentication Flow

1. User clicks OAuth provider button (Google/GitHub/Azure AD)
2. System redirects to provider's authentication page
3. User authenticates with provider
4. Provider redirects back with authorization code
5. Auth.js exchanges code for user profile
6. SignIn callback checks if user exists, creates if needed
7. System assigns default role if none exists
8. System auto-verifies email for OAuth users
9. JWT token is created with user data
10. User is redirected to dashboard

**Supported Providers:**

- **Google**: Requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- **GitHub**: Requires `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
- **Azure AD**: Requires `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, and `AZURE_AD_TENANT_ID`

## Callback Functions

### JWT Callback (`auth.ts`)

**Purpose**: Manages JWT token creation and refresh

**Execution Context**: Node.js Runtime only

**Behavior:**

- **Initial Sign-In** (user present): Sets role and OAuth status from user object
- **Subsequent Requests** (user absent): Queries database for fresh user data
- **Error Handling**: Catches database errors, returns existing token data

```typescript
async jwt({ token, user, account }) {
  // Initial sign in
  if (user) {
    token.role = user.role;
    token.isOAuth = !!account;
  }

  // Subsequent requests - refresh user data
  if (!user && token.email) {
    try {
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
    } catch (error) {
      console.error("Error refreshing user data:", error);
      // Return existing token on error
    }
  }

  return token;
}
```

### Session Callback (`auth.ts`)

**Purpose**: Enriches session object with user data from JWT token

**Execution Context**: Both Edge and Node.js Runtime

**Behavior:**

- Adds user ID from token.sub
- Adds user role for RBAC
- Adds user name and email
- Adds OAuth status flag

```typescript
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
}
```

### SignIn Callback (`auth.ts`)

**Purpose**: Controls access during sign-in process

**Execution Context**: Node.js Runtime only

**Behavior:**

- **OAuth Users**: Auto-verify email, assign default role if needed, allow access
- **Credentials Users**: Check email verification, deny if not verified

```typescript
async signIn({ user, account }) {
  // OAuth providers auto-verify email
  if (account?.provider !== "credentials") {
    try {
      const existingUser = await getUserByEmail(user.email!);
      if (existingUser && !existingUser.role) {
        await db.user.update({
          where: { id: existingUser.id },
          data: { role: "USER" },
        });
      }
    } catch (error) {
      console.error("Error in OAuth sign-in:", error);
    }
    return true;
  }

  // Credentials require email verification
  try {
    const existingUser = await getUserByEmail(user.email!);
    if (!existingUser?.emailVerified) return false;
  } catch (error) {
    console.error("Error checking email verification:", error);
    return false;
  }

  return true;
}
```

## Role-Based Access Control (RBAC)

### Supported Roles

```typescript
enum UserRole {
  ADMIN          // Full system access
  USER           // Basic user access
  GATEKEEPER     // Review and approval access
  PROJECT_LEAD   // Project management access
  RESEARCHER     // Research access
  REVIEWER       // Review access
  CUSTOM         // Custom role access
}
```

### Route Protection Rules

Implemented in `middleware.ts`:

| Route Pattern      | Allowed Roles                             |
| ------------------ | ----------------------------------------- |
| `/admin/*`         | ADMIN, GATEKEEPER                         |
| `/reviews/*`       | ADMIN, GATEKEEPER, REVIEWER               |
| `/projects/create` | ADMIN, PROJECT_LEAD, GATEKEEPER           |
| `/projects/*/edit` | ADMIN, PROJECT_LEAD, GATEKEEPER           |
| `/reports/*`       | ADMIN, GATEKEEPER, PROJECT_LEAD, REVIEWER |

**Unauthorized Access**: Redirects to `/dashboard`

### Middleware Implementation

```typescript
// Role-based access control
const userRole = req.auth?.user?.role;

if (nextUrl.pathname.startsWith("/admin")) {
  if (userRole !== "ADMIN" && userRole !== "GATEKEEPER") {
    return Response.redirect(new URL("/dashboard", nextUrl));
  }
}

// Additional route checks...
```

## Session Management

### JWT Token Structure

```typescript
{
  sub: string; // User ID
  name: string; // User name
  email: string; // User email
  role: UserRole; // User role
  isOAuth: boolean; // OAuth vs credentials
  iat: number; // Issued at timestamp
  exp: number; // Expiration timestamp
}
```

### Token Lifecycle

1. **Creation**: On successful authentication
2. **Storage**: HTTP-only cookie (secure, sameSite)
3. **Refresh**: On each request in Node.js runtime (JWT callback)
4. **Validation**: On each request in Edge runtime (no refresh)
5. **Invalidation**: On sign out

### Session Persistence

- Sessions persist across page refreshes
- Sessions persist across browser sessions (until expiration)
- Default expiration: 30 days
- Sessions invalidated immediately on sign out

## Security Features

### Password Security

- **Hashing**: bcrypt with 10 salt rounds
- **Comparison**: Constant-time comparison (bcrypt.compare)
- **Storage**: Never stored in JWT tokens
- **Logging**: Never logged or exposed

### JWT Security

- **Algorithm**: HS256 (HMAC with SHA-256)
- **Secret**: Strong random secret from environment
- **HTTP-Only**: Cookies not accessible via JavaScript
- **Secure**: HTTPS-only in production
- **SameSite**: CSRF protection

### OAuth Security

- **State Parameter**: CSRF protection (handled by Auth.js)
- **PKCE**: Code challenge for public clients (handled by Auth.js)
- **Token Validation**: Provider tokens validated by Auth.js
- **Scope Limitation**: Minimal scopes requested

### Input Validation

- **Zod Schemas**: All user inputs validated
- **Email Format**: RFC 5322 compliant
- **Password Requirements**: Enforced at registration
- **SQL Injection**: Prevented by Prisma ORM

## Error Handling

### Error Types

1. **Authentication Errors**: Invalid credentials, unverified email
2. **Database Errors**: Connection failures, query errors
3. **OAuth Errors**: Provider failures, token exchange errors
4. **Session Errors**: Expired sessions, invalid tokens
5. **Edge Runtime Errors**: Timeout, unsupported operations

### Error Handling Strategy

- **Logging**: All errors logged with context
- **User Feedback**: User-friendly error messages
- **Graceful Degradation**: System continues with cached data when possible
- **Error Pages**: Custom error pages for OAuth failures
- **Retry Logic**: Transient errors retried automatically

### Error Logging

Implemented in `lib/auth-error-logger.ts`:

```typescript
export function logAuthError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, any>
) {
  console.error(`[Auth Error - ${context}]`, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...additionalInfo,
    timestamp: new Date().toISOString(),
  });
}
```

## Performance Considerations

### Middleware Performance

- **No Database Queries**: All data from JWT token
- **Minimal Logic**: Quick checks and redirects only
- **Edge Runtime**: Optimized for low latency
- **Response Time**: < 50ms typical

### Database Query Optimization

- **Selective Queries**: Only fetch required fields
- **Relationship Loading**: Include only needed relationships
- **Indexes**: Proper indexes on email and id fields
- **Connection Pooling**: Prisma connection pooling enabled

### Session Refresh Strategy

- **Edge Runtime**: No refresh, use cached token data
- **Node.js Runtime**: Refresh on each request
- **Stale Data**: Acceptable for non-critical data
- **Critical Updates**: Force re-authentication when needed

## TypeScript Type Safety

### Extended Types

```typescript
// next-auth.d.ts
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      isOAuth: boolean;
      name: string;
      email: string;
      image?: string;
    };
  }

  interface User {
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    isOAuth: boolean;
  }
}
```

### Type Safety Benefits

- Compile-time error detection
- IDE autocomplete support
- Refactoring safety
- Documentation through types

## Deployment Considerations

### Environment Variables

Required for all deployments:

```bash
# Auth.js
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key

# Database
DATABASE_URL=your-database-url

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Azure AD OAuth (optional)
AZURE_AD_CLIENT_ID=your-azure-client-id
AZURE_AD_CLIENT_SECRET=your-azure-client-secret
AZURE_AD_TENANT_ID=your-azure-tenant-id
```

### Vercel Deployment

- Edge Runtime automatically detected
- Middleware runs at edge locations
- Server components run in Node.js runtime
- Environment variables configured in Vercel dashboard

### Edge Runtime Compatibility

**Compatible:**

- JWT token validation
- Session data reading
- Route protection logic
- URL redirects

**Not Compatible:**

- Database queries
- File system access
- Node.js built-in modules
- Heavy computations

## Monitoring and Debugging

### Logging Strategy

- **Authentication Events**: Sign-in, sign-out, failures
- **Error Events**: All errors with context
- **Performance Metrics**: Response times, query durations
- **Security Events**: Failed login attempts, suspicious activity

### Debug Mode

Enable detailed logging:

```typescript
// auth.ts
export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: process.env.NODE_ENV === "development",
  // ... rest of config
});
```

### Common Issues

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed troubleshooting guide.

## Best Practices

### Do's

✅ Keep auth.config.ts edge-compatible (no database imports)
✅ Use JWT strategy for session management
✅ Validate all user inputs with Zod schemas
✅ Log errors with sufficient context
✅ Use proper TypeScript types
✅ Test authentication flows thoroughly
✅ Keep JWT tokens minimal (only essential data)
✅ Use environment variables for secrets

### Don'ts

❌ Don't query database in middleware
❌ Don't store sensitive data in JWT tokens
❌ Don't expose error details to users
❌ Don't skip email verification for credentials users
❌ Don't use weak secrets
❌ Don't log passwords or tokens
❌ Don't assume session data is always fresh
❌ Don't perform heavy computations in middleware

## Further Reading

- [Auth.js Documentation](https://authjs.dev/)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Vercel Edge Runtime](https://vercel.com/docs/functions/edge-functions/edge-runtime)
- [Prisma Documentation](https://www.prisma.io/docs)
