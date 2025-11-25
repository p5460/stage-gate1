# Design Document: Fix Vercel Edge Middleware Deployment

## Overview

This design addresses the Vercel deployment failure caused by Edge Runtime incompatibility in the NextAuth.js middleware configuration. The core issue is that `auth.config.ts` imports Node.js-specific modules (`bcryptjs` and Prisma Client via `getUserByEmail`) that cannot run in Vercel's Edge Runtime environment. The solution involves splitting the authentication configuration into Edge-compatible and Node.js-specific files while preserving all authentication functionality.

## Architecture

### Current Architecture (Problematic)

```
middleware.ts (Edge Runtime)
    ↓ imports
auth.config.ts
    ↓ imports
bcryptjs + getUserByEmail (Prisma) ❌ NOT EDGE COMPATIBLE
```

### Proposed Architecture (Solution)

```
middleware.ts (Edge Runtime)
    ↓ imports
auth.config.ts (Edge-compatible only)
    - Session callbacks
    - JWT callbacks (no DB queries)
    - OAuth providers only

auth.ts (Node.js Runtime)
    ↓ imports
auth.config.ts + Credentials Provider
    - Full NextAuth config
    - Database access via Prisma
    - bcryptjs for password hashing
    - Credentials provider with validation
```

### Key Architectural Decisions

1. **Two-Tier Configuration**: Separate Edge-compatible base config from Node.js-specific extensions
2. **Deferred Database Access**: Move all database queries out of Edge Runtime callbacks
3. **Token-Based Role Management**: Store role information in JWT tokens to avoid database lookups in middleware
4. **Provider Separation**: Keep OAuth providers in Edge config, move Credentials provider to Node.js config

## Components and Interfaces

### 1. auth.config.ts (Edge-Compatible)

**Purpose**: Provide minimal authentication configuration compatible with Edge Runtime

**Exports**:

- `authConfig: NextAuthConfig` - Base configuration object

**Key Features**:

- Session callback that reads from token (no DB access)
- JWT callback that only passes through existing token data
- OAuth providers (Google, GitHub, Azure AD)
- No Credentials provider
- No imports of bcryptjs or Prisma

**Interface**:

```typescript
export default {
  providers: [
    Google({ clientId, clientSecret }),
    GitHub({ clientId, clientSecret }),
    AzureAD({ clientId, clientSecret, issuer }),
  ],
  callbacks: {
    async session({ token, session }) {
      // Read from token only, no DB queries
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.role && session.user) {
        session.user.role = token.role;
      }
      // ... other token-based assignments
      return session;
    },
    async jwt({ token }) {
      // Pass through token without DB queries
      return token;
    },
  },
} satisfies NextAuthConfig;
```

### 2. auth.ts (Node.js Runtime)

**Purpose**: Full authentication configuration with database access and credential validation

**Exports**:

- `handlers` - NextAuth request handlers
- `signIn` - Sign in function
- `signOut` - Sign out function
- `auth` - Auth helper for server components

**Key Features**:

- Imports base config from auth.config.ts
- Adds Credentials provider with bcryptjs validation
- Implements full JWT callback with database queries
- Implements signIn callback with email verification
- Uses PrismaAdapter for session management

**Interface**:

```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig, // Spread base config
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    ...authConfig.providers, // Include OAuth providers
    Credentials({
      async authorize(credentials) {
        // Validate with bcryptjs and Prisma
        // Return user with role information
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Database queries for verification
    },
    async jwt({ token, user }) {
      // Database queries to populate token
      if (!token.sub) return token;
      const existingUser = await db.user.findUnique(...);
      token.role = existingUser.role;
      // ... other DB-based assignments
      return token;
    },
    async session({ token, session }) {
      // Reuse base session callback
      return authConfig.callbacks.session({ token, session });
    }
  }
});
```

### 3. middleware.ts (Edge Runtime)

**Purpose**: Handle authentication and authorization for all routes

**No Changes Required**: Will automatically use Edge-compatible auth.config.ts

**Current Implementation**:

```typescript
import NextAuth from "next-auth";
import authConfig from "@/auth.config"; // Now Edge-compatible

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  // Authentication and authorization logic
  // All role checks use req.auth.user.role from token
});
```

### 4. routes.ts (Configuration)

**Purpose**: Define route access patterns

**No Changes Required**: Existing route definitions remain valid

**Current Structure**:

```typescript
export const publicRoutes = ["/", "/auth/new-verification"];
export const authRoutes = ["/auth/login", "/auth/register", ...];
export const apiAuthPrefix = "/api/auth";
export const DEFAULT_LOGIN_REDIRECT = "/dashboard";
```

## Data Models

### JWT Token Structure

The JWT token will carry all necessary user information to avoid database queries in Edge Runtime:

```typescript
interface JWTToken {
  sub: string; // User ID
  name: string; // User name
  email: string; // User email
  role: UserRole; // User role (ADMIN, USER, etc.)
  isOAuth: boolean; // OAuth vs credentials login
  iat: number; // Issued at
  exp: number; // Expiration
}
```

### Session Structure

```typescript
interface Session {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    isOAuth: boolean;
  };
  expires: string;
}
```

### User Role Enum

```typescript
type UserRole =
  | "ADMIN"
  | "USER"
  | "GATEKEEPER"
  | "PROJECT_LEAD"
  | "RESEARCHER"
  | "REVIEWER"
  | "CUSTOM";
```

## Error Handling

### Edge Runtime Errors

**Strategy**: Prevent errors by eliminating incompatible imports

1. **Module Import Errors**: Resolved by removing bcryptjs and Prisma imports from auth.config.ts
2. **Database Connection Errors**: Prevented by removing all DB queries from Edge callbacks
3. **Runtime API Errors**: Avoided by using only Edge-compatible APIs

### Authentication Errors

**Strategy**: Maintain existing error handling patterns

1. **Invalid Credentials**: Handled in auth.ts Credentials provider (Node.js runtime)
2. **OAuth Failures**: Handled by NextAuth.js OAuth providers
3. **Session Expiration**: Handled by JWT expiration and middleware redirects
4. **Email Verification**: Checked in signIn callback (Node.js runtime)

### Deployment Errors

**Strategy**: Validate Edge compatibility before deployment

1. **Build-time Validation**: Vercel build process will verify Edge compatibility
2. **Module Resolution**: Ensure all middleware imports resolve to Edge-compatible code
3. **Runtime Verification**: Test middleware execution in Edge Runtime environment

## Testing Strategy

### Unit Tests

1. **auth.config.ts Tests**
   - Verify no Node.js-specific imports
   - Test session callback with mock tokens
   - Test JWT callback pass-through logic
   - Verify OAuth provider configuration

2. **auth.ts Tests**
   - Test Credentials provider validation
   - Test JWT callback with database queries
   - Test signIn callback email verification
   - Test role assignment logic

3. **middleware.ts Tests**
   - Test authentication redirects
   - Test role-based access control
   - Test public route access
   - Test callback URL preservation

### Integration Tests

1. **OAuth Flow Tests**
   - Test Google authentication end-to-end
   - Test GitHub authentication end-to-end
   - Test Azure AD authentication end-to-end
   - Verify role assignment for OAuth users

2. **Credentials Flow Tests**
   - Test email/password login
   - Test password validation with bcryptjs
   - Test email verification requirement
   - Verify role assignment for credential users

3. **Middleware Integration Tests**
   - Test authenticated route access
   - Test unauthenticated redirects
   - Test role-based route restrictions
   - Test API route pass-through

### Deployment Tests

1. **Vercel Build Tests**
   - Verify successful build completion
   - Check for Edge Function errors
   - Validate middleware compilation
   - Confirm no module compatibility warnings

2. **Production Runtime Tests**
   - Test middleware execution in production
   - Verify authentication flows work
   - Test role-based access in production
   - Monitor for Edge Runtime errors

### Edge Runtime Compatibility Tests

1. **Static Analysis**
   - Scan auth.config.ts for Node.js imports
   - Verify no Prisma Client usage in Edge code
   - Check for bcryptjs or other Node.js-only modules
   - Validate Edge Runtime API usage

2. **Runtime Validation**
   - Test middleware in local Edge Runtime
   - Verify no runtime errors in Edge environment
   - Test with Vercel CLI edge-runtime flag
   - Validate performance in Edge Runtime

## Implementation Phases

### Phase 1: Configuration Refactoring

1. Create new Edge-compatible auth.config.ts
2. Move Credentials provider to auth.ts
3. Remove bcryptjs and Prisma imports from auth.config.ts
4. Update JWT callback to avoid DB queries in Edge context

### Phase 2: Callback Optimization

1. Modify JWT callback in auth.ts to populate token with user data
2. Simplify JWT callback in auth.config.ts to pass-through only
3. Update session callback to read from token exclusively
4. Ensure role information is stored in JWT

### Phase 3: Testing and Validation

1. Run unit tests for both config files
2. Test authentication flows locally
3. Verify Edge Runtime compatibility
4. Test with Vercel CLI

### Phase 4: Deployment and Monitoring

1. Deploy to Vercel staging environment
2. Verify successful deployment
3. Test all authentication methods in production
4. Monitor for Edge Runtime errors
5. Deploy to production

## Security Considerations

### Token Security

- **JWT Signing**: Ensure NEXTAUTH_SECRET is properly configured
- **Token Expiration**: Maintain reasonable token expiration times
- **Token Refresh**: Implement token refresh logic if needed
- **Sensitive Data**: Avoid storing sensitive data in JWT tokens

### Password Security

- **bcryptjs Usage**: Continue using bcryptjs for password hashing in Node.js runtime
- **Password Validation**: Maintain strong password validation in Credentials provider
- **Credential Storage**: Keep password hashing in server-side code only

### OAuth Security

- **Provider Configuration**: Ensure OAuth client secrets are properly secured
- **Redirect URIs**: Validate OAuth redirect URIs
- **State Parameter**: Use NextAuth.js built-in CSRF protection
- **Token Validation**: Verify OAuth tokens from providers

### Edge Runtime Security

- **No Secrets in Edge**: Avoid exposing secrets in Edge Runtime code
- **Environment Variables**: Use Vercel environment variables properly
- **Rate Limiting**: Consider implementing rate limiting for authentication endpoints
- **CORS Configuration**: Properly configure CORS for API routes

## Performance Considerations

### Edge Runtime Benefits

- **Reduced Latency**: Middleware runs closer to users
- **Faster Authentication Checks**: No database queries in middleware
- **Improved Scalability**: Edge Runtime scales automatically
- **Global Distribution**: Middleware runs on Vercel's edge network

### Token-Based Performance

- **No Database Queries**: Reading from JWT eliminates DB latency
- **Cached User Data**: Role and user info cached in token
- **Reduced Load**: Database load reduced for authentication checks
- **Faster Redirects**: Immediate access decisions without DB queries

### Optimization Strategies

- **Token Size**: Keep JWT payload minimal
- **Callback Efficiency**: Optimize callback logic for speed
- **Conditional Logic**: Use early returns in middleware
- **Route Matching**: Optimize route pattern matching

## Rollback Plan

### Rollback Triggers

- Deployment fails on Vercel
- Authentication flows break in production
- Edge Runtime errors occur
- Performance degradation detected

### Rollback Steps

1. Revert to previous commit in Git
2. Redeploy previous working version
3. Verify authentication functionality restored
4. Investigate and fix issues before retry

### Rollback Prevention

- Thorough testing before deployment
- Staging environment validation
- Gradual rollout strategy
- Monitoring and alerting setup

## Monitoring and Maintenance

### Deployment Monitoring

- Monitor Vercel deployment logs
- Track Edge Function execution errors
- Alert on deployment failures
- Monitor build times and success rates

### Runtime Monitoring

- Track authentication success/failure rates
- Monitor middleware execution times
- Alert on Edge Runtime errors
- Track OAuth provider response times

### Maintenance Tasks

- Regular security updates for NextAuth.js
- Monitor for Edge Runtime API changes
- Update OAuth provider configurations as needed
- Review and optimize JWT token structure
- Periodic security audits

## Dependencies

### Required Packages

- `next-auth`: ^5.x (current version)
- `@auth/prisma-adapter`: Current version
- `bcryptjs`: Current version (Node.js only)
- `@prisma/client`: Current version (Node.js only)

### Environment Variables

- `NEXTAUTH_SECRET`: JWT signing secret
- `NEXTAUTH_URL`: Application URL
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GITHUB_CLIENT_ID`: GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth client secret
- `AZURE_AD_CLIENT_ID`: Azure AD client ID
- `AZURE_AD_CLIENT_SECRET`: Azure AD client secret
- `AZURE_AD_TENANT_ID`: Azure AD tenant ID
- `DATABASE_URL`: Prisma database connection string

## Success Criteria

1. ✅ Vercel deployment completes without Edge Function errors
2. ✅ All authentication methods (credentials, Google, GitHub, Azure AD) work correctly
3. ✅ Role-based access control functions as expected
4. ✅ Middleware executes successfully in Edge Runtime
5. ✅ No performance degradation compared to previous implementation
6. ✅ All tests pass (unit, integration, deployment)
7. ✅ No security vulnerabilities introduced
8. ✅ Code is maintainable and well-documented
