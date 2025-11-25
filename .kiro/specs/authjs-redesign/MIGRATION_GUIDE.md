# Migration Guide: Auth.js Redesign

## Overview

This guide helps you migrate from the previous authentication implementation to the new Auth.js v5 architecture with edge runtime compatibility.

## Migration Timeline

**Estimated Time**: 2-4 hours

**Phases**:

1. Pre-migration preparation (30 minutes)
2. Code updates (1-2 hours)
3. Testing (1 hour)
4. Deployment (30 minutes)

## Pre-Migration Checklist

### 1. Backup Current System

```bash
# Backup database
pg_dump your_database > backup_$(date +%Y%m%d).sql

# Backup code
git checkout -b backup-pre-auth-migration
git push origin backup-pre-auth-migration
```

### 2. Review Current Configuration

Document your current:

- OAuth providers and credentials
- Custom callback logic
- Session configuration
- Route protection rules
- User roles and permissions

### 3. Verify Dependencies

```bash
# Check Next.js version (requires 14.0.0+)
npm list next

# Check Auth.js version (requires 5.0.0+)
npm list next-auth

# Check Prisma version
npm list @prisma/client
```

### 4. Environment Variables

Ensure all required environment variables are set:

```bash
# Check .env.local
cat .env.local | grep -E "NEXTAUTH|GOOGLE|GITHUB|AZURE|DATABASE"
```

## Migration Steps

### Step 1: Create auth.config.ts

Create a new file `auth.config.ts` in your project root:

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
} satisfies NextAuthConfig;
```

**Important**: Do NOT include:

- Database imports
- Prisma client
- Node.js-specific modules
- Callbacks that query the database

### Step 2: Update auth.ts

Update your existing `auth.ts` file:

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

### Step 3: Update middleware.ts

Update your middleware to use the new configuration:

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

### Step 4: Update TypeScript Types

Update or create `next-auth.d.ts` in your project root:

```typescript
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

### Step 5: Add Error Handling Utilities

Create `lib/auth-error-logger.ts`:

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

### Step 6: Add Environment Variable Validation

Create `lib/env-validation.ts`:

```typescript
export function validateAuthEnv() {
  const warnings: string[] = [];

  // Check required base variables
  if (!process.env.NEXTAUTH_URL) {
    warnings.push("NEXTAUTH_URL is not set");
  }
  if (!process.env.NEXTAUTH_SECRET) {
    warnings.push("NEXTAUTH_SECRET is not set");
  }

  // Check OAuth providers
  if (process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_SECRET) {
    warnings.push(
      "GOOGLE_CLIENT_ID is set but GOOGLE_CLIENT_SECRET is missing"
    );
  }
  if (process.env.GITHUB_CLIENT_ID && !process.env.GITHUB_CLIENT_SECRET) {
    warnings.push(
      "GITHUB_CLIENT_ID is set but GITHUB_CLIENT_SECRET is missing"
    );
  }
  if (process.env.AZURE_AD_CLIENT_ID) {
    if (!process.env.AZURE_AD_CLIENT_SECRET) {
      warnings.push(
        "AZURE_AD_CLIENT_ID is set but AZURE_AD_CLIENT_SECRET is missing"
      );
    }
    if (!process.env.AZURE_AD_TENANT_ID) {
      warnings.push(
        "AZURE_AD_CLIENT_ID is set but AZURE_AD_TENANT_ID is missing"
      );
    }
  }

  if (warnings.length > 0) {
    console.warn("[Auth Environment Validation]", warnings);
  }

  return warnings;
}
```

Call this in your `auth.ts` or `auth.config.ts`:

```typescript
import { validateAuthEnv } from "@/lib/env-validation";

// At the top of the file
if (process.env.NODE_ENV !== "production") {
  validateAuthEnv();
}
```

## Testing the Migration

### 1. Local Testing

```bash
# Start development server
npm run dev

# Test authentication flows
# 1. Visit http://localhost:3000/auth/login
# 2. Test credentials login
# 3. Test OAuth providers
# 4. Test protected routes
# 5. Test role-based access
```

### 2. Run Test Suite

```bash
# Run all tests
npm test

# Run specific test suites
npm test auth
npm test middleware
npm test edge-compatibility
```

### 3. Edge Runtime Validation

```bash
# Build for production
npm run build

# Check for edge runtime errors
# Look for warnings about incompatible imports
```

### 4. Manual Testing Checklist

- [ ] Credentials login works
- [ ] Google OAuth works (if configured)
- [ ] GitHub OAuth works (if configured)
- [ ] Azure AD OAuth works (if configured)
- [ ] Email verification is enforced for credentials users
- [ ] OAuth users get auto-verified email
- [ ] New OAuth users get default role
- [ ] Protected routes redirect unauthenticated users
- [ ] Role-based access control works correctly
- [ ] Session persists across page refreshes
- [ ] Sign out works correctly
- [ ] Error messages are user-friendly

## Deployment

### Staging Deployment

1. Deploy to staging environment:

```bash
# Vercel
vercel --prod=false

# Or your deployment platform
```

2. Test all authentication flows in staging

3. Monitor for errors:
   - Check Vercel logs
   - Check application logs
   - Test edge runtime performance

### Production Deployment

1. Ensure all tests pass
2. Verify staging works correctly
3. Deploy to production:

```bash
# Vercel
vercel --prod

# Or your deployment platform
```

4. Monitor production:
   - Watch for authentication errors
   - Monitor edge runtime performance
   - Check user feedback

## Rollback Plan

If issues occur, you can rollback:

### Quick Rollback

```bash
# Revert to previous deployment
vercel rollback

# Or restore from backup branch
git checkout backup-pre-auth-migration
git push origin main --force
```

### Database Rollback

```bash
# Restore database if needed
psql your_database < backup_YYYYMMDD.sql
```

## Common Migration Issues

### Issue 1: Edge Runtime Errors

**Symptom**: Middleware fails with "Module not found" or "Cannot use X in edge runtime"

**Solution**: Ensure `auth.config.ts` has no database imports. Move all database operations to `auth.ts`.

### Issue 2: Sessions Not Persisting

**Symptom**: Users logged out on page refresh

**Solution**: Check `NEXTAUTH_SECRET` is set and consistent across deployments.

### Issue 3: OAuth Redirects Failing

**Symptom**: OAuth providers redirect to error page

**Solution**:

- Verify OAuth credentials in environment variables
- Check redirect URIs in provider console match your domain
- Ensure `NEXTAUTH_URL` is set correctly

### Issue 4: Role-Based Access Not Working

**Symptom**: Users can access routes they shouldn't

**Solution**:

- Verify JWT callback is refreshing user data
- Check session callback is adding role to session
- Ensure middleware is checking the correct role field

### Issue 5: Database Queries in Middleware

**Symptom**: Edge runtime errors about database access

**Solution**: Remove all database queries from middleware. Use only session data from JWT token.

## Post-Migration Tasks

### 1. Monitor Performance

- Check middleware response times
- Monitor database query performance
- Watch for edge runtime timeouts

### 2. Update Documentation

- Document any custom changes
- Update team onboarding docs
- Create runbooks for common issues

### 3. User Communication

- Notify users of any changes
- Provide support for login issues
- Collect feedback

### 4. Cleanup

- Remove old authentication code
- Delete backup branches (after verification period)
- Archive old documentation

## Getting Help

### Resources

- [Auth.js Documentation](https://authjs.dev/)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Architecture Documentation](./ARCHITECTURE.md)

### Support Channels

- GitHub Issues: [Your repo issues]
- Team Chat: [Your team chat]
- Email: [Support email]

## Verification Checklist

After migration, verify:

- [ ] All authentication flows work
- [ ] No edge runtime errors in production
- [ ] Session management works correctly
- [ ] Role-based access control functions properly
- [ ] Error handling provides good user experience
- [ ] Performance meets requirements
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] Team is trained on new system
- [ ] Monitoring is in place

## Success Criteria

Migration is successful when:

1. ✅ All authentication flows work in production
2. ✅ No edge runtime errors
3. ✅ Performance is equal or better than before
4. ✅ All tests pass
5. ✅ No user-reported issues for 1 week
6. ✅ Team is comfortable with new system

## Timeline

| Phase                     | Duration  | Status |
| ------------------------- | --------- | ------ |
| Preparation               | 30 min    | ⬜     |
| Code Updates              | 1-2 hours | ⬜     |
| Testing                   | 1 hour    | ⬜     |
| Staging Deployment        | 30 min    | ⬜     |
| Monitoring                | 1 day     | ⬜     |
| Production Deployment     | 30 min    | ⬜     |
| Post-Migration Monitoring | 1 week    | ⬜     |

---

**Last Updated**: [Current Date]
**Version**: 1.0.0
