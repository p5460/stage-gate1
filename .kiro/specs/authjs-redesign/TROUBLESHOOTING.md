# Troubleshooting Guide

## Overview

This guide helps you diagnose and resolve common issues with the Auth.js authentication system.

## Quick Diagnostics

### Check System Health

```bash
# 1. Verify environment variables
node -e "console.log(process.env.NEXTAUTH_URL, process.env.NEXTAUTH_SECRET ? '✓' : '✗')"

# 2. Check database connection
npx prisma db pull

# 3. Test build
npm run build

# 4. Check for edge runtime issues
npm run build 2>&1 | grep -i "edge"
```

## Common Issues

### 1. Edge Runtime Errors

#### Symptom

```
Error: Module not found: Can't resolve '@prisma/client'
Error: The edge runtime does not support Node.js 'fs' module
```

#### Cause

Database or Node.js-specific imports in edge-compatible code (middleware or auth.config.ts).

#### Solution

**Step 1**: Verify `auth.config.ts` has no database imports

```typescript
// ❌ WRONG - Don't import database in auth.config.ts
import { db } from "@/lib/db";

// ✅ CORRECT - Only edge-compatible imports
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
```

**Step 2**: Check middleware imports

```typescript
// middleware.ts
import { auth } from "@/auth"; // ✅ This is OK
// The auth export uses auth.config.ts in edge runtime
```

**Step 3**: Move database operations to `auth.ts`

```typescript
// auth.ts - Node.js runtime only
import { db } from "@/lib/db"; // ✅ OK here
import { PrismaAdapter } from "@auth/prisma-adapter"; // ✅ OK here
```

#### Verification

```bash
# Build and check for errors
npm run build

# Should see no edge runtime errors
```

---

### 2. Sessions Not Persisting

#### Symptom

- User logged out on page refresh
- Session data missing
- Constant redirects to login

#### Cause

Missing or incorrect `NEXTAUTH_SECRET` or `NEXTAUTH_URL`.

#### Solution

**Step 1**: Check environment variables

```bash
# .env.local
NEXTAUTH_URL=http://localhost:3000  # Development
NEXTAUTH_SECRET=your-secret-key-here
```

**Step 2**: Generate a strong secret

```bash
# Generate new secret
openssl rand -base64 32

# Or use
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Step 3**: Verify in production

```bash
# Vercel
vercel env ls

# Check NEXTAUTH_SECRET is set
```

**Step 4**: Clear cookies and test

```javascript
// In browser console
document.cookie.split(";").forEach((c) => {
  document.cookie =
    c.trim().split("=")[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
});
```

#### Verification

1. Log in
2. Refresh page
3. Should remain logged in

---

### 3. OAuth Provider Failures

#### Symptom

- Redirect to error page after OAuth
- "Configuration error" message
- OAuth button doesn't work

#### Cause

Missing or incorrect OAuth credentials, or wrong redirect URI.

#### Solution

**Step 1**: Verify environment variables

```bash
# Google
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# GitHub
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret

# Azure AD
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id
```

**Step 2**: Check redirect URIs in provider console

**Google Console** (https://console.cloud.google.com/):

- Authorized redirect URIs: `https://your-domain.com/api/auth/callback/google`
- For local: `http://localhost:3000/api/auth/callback/google`

**GitHub Settings** (https://github.com/settings/developers):

- Authorization callback URL: `https://your-domain.com/api/auth/callback/github`
- For local: `http://localhost:3000/api/auth/callback/github`

**Azure Portal** (https://portal.azure.com/):

- Redirect URI: `https://your-domain.com/api/auth/callback/azure-ad`
- For local: `http://localhost:3000/api/auth/callback/azure-ad`

**Step 3**: Test OAuth flow

```bash
# Enable debug mode
# In auth.ts
export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true, // Add this
  // ... rest of config
});
```

**Step 4**: Check error page

Visit `/auth/error?error=Configuration` to see specific error details.

#### Verification

1. Click OAuth provider button
2. Authenticate with provider
3. Should redirect back and log in successfully

---

### 4. Email Verification Not Working

#### Symptom

- Credentials users can't log in
- "Email not verified" error
- OAuth users have issues

#### Cause

Incorrect email verification field or logic.

#### Solution

**Step 1**: Check database schema

```prisma
model User {
  id            String    @id @default(cuid())
  email         String?   @unique
  emailVerified DateTime? // ✅ Must be DateTime? (nullable)
  // ...
}
```

**Step 2**: Verify signIn callback logic

```typescript
// auth.ts
async signIn({ user, account }) {
  // OAuth providers auto-verify email
  if (account?.provider !== "credentials") {
    return true; // ✅ OAuth users always allowed
  }

  // Credentials require email verification
  const existingUser = await getUserByEmail(user.email!);
  if (!existingUser?.emailVerified) return false; // ✅ Check emailVerified

  return true;
}
```

**Step 3**: Check linkAccount event

```typescript
// auth.ts
events: {
  async linkAccount({ user }) {
    await db.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() }, // ✅ Set on OAuth link
    });
  },
}
```

**Step 4**: Manually verify a user for testing

```bash
# Using Prisma Studio
npx prisma studio

# Or SQL
psql your_database -c "UPDATE \"User\" SET \"emailVerified\" = NOW() WHERE email = 'test@example.com';"
```

#### Verification

1. Create credentials user
2. Verify email (or manually set emailVerified)
3. Should be able to log in

---

### 5. Role-Based Access Control Not Working

#### Symptom

- Users can access routes they shouldn't
- Redirects not working
- Role not showing in session

#### Cause

Role not being added to JWT token or session, or middleware logic incorrect.

#### Solution

**Step 1**: Verify JWT callback adds role

```typescript
// auth.ts
async jwt({ token, user, account }) {
  // Initial sign in
  if (user) {
    token.role = user.role; // ✅ Add role to token
    token.isOAuth = !!account;
  }

  // Subsequent requests - refresh user data
  if (!user && token.email) {
    const dbUser = await db.user.findUnique({
      where: { email: token.email },
      include: { accounts: true },
    });

    if (dbUser) {
      token.role = dbUser.role; // ✅ Refresh role
      // ... other fields
    }
  }

  return token;
}
```

**Step 2**: Verify session callback adds role

```typescript
// auth.ts
async session({ token, session }) {
  if (token.role && session.user) {
    session.user.role = token.role; // ✅ Add role to session
  }
  // ... other fields
  return session;
}
```

**Step 3**: Check TypeScript types

```typescript
// next-auth.d.ts
declare module "next-auth" {
  interface Session {
    user: {
      role: UserRole; // ✅ Must include role
      // ... other fields
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole; // ✅ Must include role
  }
}
```

**Step 4**: Verify middleware logic

```typescript
// middleware.ts
const userRole = req.auth?.user?.role; // ✅ Get role from session

if (nextUrl.pathname.startsWith("/admin")) {
  if (userRole !== "ADMIN" && userRole !== "GATEKEEPER") {
    return Response.redirect(new URL("/dashboard", nextUrl));
  }
}
```

**Step 5**: Test role in browser

```javascript
// In browser console (on protected page)
fetch("/api/auth/session")
  .then((r) => r.json())
  .then((session) => console.log("Role:", session?.user?.role));
```

#### Verification

1. Log in as user with specific role
2. Try accessing routes for that role (should work)
3. Try accessing routes for other roles (should redirect)

---

### 6. Database Connection Errors

#### Symptom

```
Error: Can't reach database server
PrismaClientInitializationError
```

#### Cause

Incorrect `DATABASE_URL` or database not running.

#### Solution

**Step 1**: Check DATABASE_URL format

```bash
# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/database?schema=public"

# MySQL
DATABASE_URL="mysql://user:password@localhost:3306/database"
```

**Step 2**: Test database connection

```bash
# Using Prisma
npx prisma db pull

# Using psql (PostgreSQL)
psql $DATABASE_URL -c "SELECT 1;"

# Using mysql (MySQL)
mysql -h localhost -u user -p database -e "SELECT 1;"
```

**Step 3**: Check database is running

```bash
# PostgreSQL
pg_isready

# MySQL
mysqladmin ping

# Docker
docker ps | grep postgres
docker ps | grep mysql
```

**Step 4**: Verify connection pooling

```typescript
// lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

#### Verification

```bash
# Should connect successfully
npx prisma studio
```

---

### 7. Password Comparison Failing

#### Symptom

- Valid credentials rejected
- "Invalid credentials" error
- Can't log in with correct password

#### Cause

Incorrect bcrypt usage or password not hashed.

#### Solution

**Step 1**: Verify password is hashed in database

```bash
# Check password format (should start with $2a$ or $2b$)
npx prisma studio
# Look at User table, password field should be hashed
```

**Step 2**: Check Credentials provider logic

```typescript
// auth.ts
Credentials({
  async authorize(credentials) {
    const validatedFields = LoginSchema.safeParse(credentials);

    if (validatedFields.success) {
      const { email, password } = validatedFields.data;

      const user = await getUserByEmail(email);
      if (!user || !user.password) return null; // ✅ Check user exists

      const passwordsMatch = await bcrypt.compare(password, user.password); // ✅ Use bcrypt.compare

      if (passwordsMatch) return user;
    }

    return null;
  },
});
```

**Step 3**: Verify bcrypt is installed

```bash
npm list bcryptjs
# or
npm list bcrypt
```

**Step 4**: Test password hashing

```javascript
// Test script
const bcrypt = require("bcryptjs");

async function test() {
  const password = "test123";
  const hash = await bcrypt.hash(password, 10);
  console.log("Hash:", hash);

  const match = await bcrypt.compare(password, hash);
  console.log("Match:", match); // Should be true
}

test();
```

**Step 5**: Reset password for testing

```bash
# Generate hash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('newpassword', 10).then(console.log)"

# Update in database
npx prisma studio
# Or SQL: UPDATE "User" SET password = 'hash' WHERE email = 'test@example.com';
```

#### Verification

1. Try logging in with known password
2. Should authenticate successfully

---

### 8. Middleware Infinite Redirects

#### Symptom

- Browser shows "Too many redirects"
- Page keeps reloading
- Can't access any pages

#### Cause

Redirect loop in middleware logic.

#### Solution

**Step 1**: Check redirect logic

```typescript
// middleware.ts
export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // ✅ Allow API auth routes first
  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  if (isApiAuthRoute) return; // Don't redirect API routes

  // ✅ Handle auth routes
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return; // Allow unauthenticated access to auth routes
  }

  // ✅ Handle public routes
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  if (!isLoggedIn && !isPublicRoute) {
    return Response.redirect(new URL("/auth/login", nextUrl));
  }

  return; // ✅ Always return at the end
});
```

**Step 2**: Verify route arrays

```typescript
// routes.ts
export const publicRoutes = ["/", "/auth/new-verification"];

export const authRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/error",
  "/auth/reset",
  "/auth/new-password",
];

export const apiAuthPrefix = "/api/auth";

export const DEFAULT_LOGIN_REDIRECT = "/dashboard";
```

**Step 3**: Check matcher config

```typescript
// middleware.ts
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

**Step 4**: Debug redirects

```typescript
// Add logging
export default auth((req) => {
  console.log("Path:", req.nextUrl.pathname);
  console.log("Logged in:", !!req.auth);
  // ... rest of logic
});
```

#### Verification

1. Clear browser cache and cookies
2. Visit homepage
3. Should not see redirect loop

---

### 9. TypeScript Type Errors

#### Symptom

```
Property 'role' does not exist on type 'User'
Property 'isOAuth' does not exist on type 'Session'
```

#### Cause

Missing or incorrect TypeScript type declarations.

#### Solution

**Step 1**: Create or update `next-auth.d.ts`

```typescript
// next-auth.d.ts (in project root)
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

**Step 2**: Restart TypeScript server

In VS Code: `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"

**Step 3**: Check tsconfig.json includes types

```json
{
  "compilerOptions": {
    "types": ["next-auth"]
  },
  "include": ["next-auth.d.ts", "**/*.ts", "**/*.tsx"]
}
```

#### Verification

```bash
# Should have no type errors
npx tsc --noEmit
```

---

### 10. Performance Issues

#### Symptom

- Slow page loads
- Middleware timeouts
- Database query slowness

#### Cause

Inefficient queries, missing indexes, or heavy middleware logic.

#### Solution

**Step 1**: Check middleware performance

```typescript
// middleware.ts
export default auth((req) => {
  const start = Date.now();

  // ... middleware logic

  const duration = Date.now() - start;
  if (duration > 50) {
    console.warn("Slow middleware:", duration, "ms");
  }

  return result;
});
```

**Step 2**: Optimize database queries

```typescript
// ❌ SLOW - Fetches all fields and relationships
const user = await db.user.findUnique({
  where: { email },
  include: {
    accounts: true,
    sessions: true,
    // ... many relationships
  },
});

// ✅ FAST - Only fetch what you need
const user = await db.user.findUnique({
  where: { email },
  select: {
    id: true,
    email: true,
    role: true,
    emailVerified: true,
    accounts: {
      select: { provider: true },
    },
  },
});
```

**Step 3**: Add database indexes

```prisma
// schema.prisma
model User {
  id            String    @id @default(cuid())
  email         String?   @unique // ✅ Already indexed
  emailVerified DateTime?

  @@index([email]) // ✅ Explicit index
}
```

```bash
# Apply migration
npx prisma migrate dev --name add_indexes
```

**Step 4**: Enable query logging

```typescript
// lib/db.ts
export const db = new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "stdout", level: "error" },
  ],
});

db.$on("query", (e) => {
  console.log("Query:", e.query);
  console.log("Duration:", e.duration, "ms");
});
```

**Step 5**: Use connection pooling

```bash
# DATABASE_URL with connection pooling
DATABASE_URL="postgresql://user:password@localhost:5432/database?schema=public&connection_limit=10&pool_timeout=20"
```

#### Verification

```bash
# Run performance tests
npm test -- performance.test.ts
```

---

## Debugging Tools

### 1. Enable Debug Mode

```typescript
// auth.ts
export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: process.env.NODE_ENV === "development",
  // ... rest of config
});
```

### 2. Check Session Data

```javascript
// In browser console
fetch("/api/auth/session")
  .then((r) => r.json())
  .then(console.log);
```

### 3. Check JWT Token

```javascript
// In browser console
document.cookie.split(";").find((c) => c.includes("next-auth.session-token"));
```

### 4. Test Database Connection

```bash
npx prisma studio
```

### 5. Check Environment Variables

```bash
# Development
cat .env.local | grep -v "^#" | grep -v "^$"

# Production (Vercel)
vercel env ls
```

### 6. View Logs

```bash
# Vercel
vercel logs

# Local
npm run dev
```

## Getting Help

### Before Asking for Help

1. Check this troubleshooting guide
2. Review error messages carefully
3. Check browser console for errors
4. Check server logs
5. Try the quick diagnostics at the top

### Information to Provide

When asking for help, include:

- Error message (full text)
- Steps to reproduce
- Environment (local/staging/production)
- Browser and version
- Node.js version
- Relevant code snippets
- What you've already tried

### Resources

- [Auth.js Documentation](https://authjs.dev/)
- [Architecture Documentation](./ARCHITECTURE.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

---

**Last Updated**: [Current Date]
**Version**: 1.0.0
