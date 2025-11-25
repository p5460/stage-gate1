# Design Document: Fix \_\_dirname Edge Runtime Error

## Overview

This design addresses the persistent `ReferenceError: __dirname is not defined` error occurring in Vercel's Edge Runtime. The error manifests in production despite previous attempts to make the authentication configuration Edge Runtime compatible. The root cause is that `__dirname` (a Node.js global) is being referenced somewhere in the middleware's dependency chain, but Edge Runtime does not provide Node.js globals.

The solution involves:

1. Identifying the exact source of `__dirname` usage through dependency analysis
2. Removing or conditionally executing code that uses Node.js globals
3. Explicitly configuring Edge Runtime compatibility
4. Implementing proper runtime boundaries between Edge and Node.js code

## Architecture

### Current Architecture (Problematic)

```
middleware.ts (Edge Runtime)
    ↓ imports
auth.config.ts
    ↓ imports at module level
validateOAuthEnvironmentVariables() from lib/env-validation.ts
    ↓ potentially triggers
Some dependency using __dirname ❌
```

### Root Cause Analysis

The error `ReferenceError: __dirname is not defined` can occur in several scenarios:

1. **Direct Usage**: Application code directly references `__dirname`
2. **Prisma Client**: Prisma's generated client may use `__dirname` for binary resolution
3. **NextAuth.js**: NextAuth.js internals may use Node.js globals
4. **Module-Level Execution**: Code executing at module import time (not function call time)
5. **Third-Party Dependencies**: Dependencies imported by auth.config.ts using Node.js APIs

### Proposed Architecture (Solution)

```
middleware.ts (Edge Runtime)
    ↓ imports
auth.config.ts (minimal, no module-level execution)
    - OAuth providers only
    - No function calls at module level
    - No imports that trigger Node.js code
    - Explicit runtime: 'edge' export

auth.ts (Node.js Runtime)
    ↓ imports
Full dependencies (Prisma, bcrypt, etc.)
    - All database operations
    - All Node.js-specific code
    - Environment validation
```

## Components and Interfaces

### 1. Diagnostic Script

**Purpose**: Identify the exact source of `__dirname` usage

**Implementation**:

```typescript
// scripts/analyze-edge-compatibility.ts
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

function searchForNodeGlobals(
  dir: string,
  globals: string[] = ["__dirname", "__filename", "process.cwd()"]
): void {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (
      stat.isDirectory() &&
      !file.startsWith(".") &&
      file !== "node_modules"
    ) {
      searchForNodeGlobals(filePath, globals);
    } else if (file.endsWith(".ts") || file.endsWith(".js")) {
      const content = readFileSync(filePath, "utf-8");

      for (const global of globals) {
        if (content.includes(global)) {
          console.log(`Found ${global} in: ${filePath}`);
          // Print surrounding context
          const lines = content.split("\n");
          lines.forEach((line, index) => {
            if (line.includes(global)) {
              console.log(`  Line ${index + 1}: ${line.trim()}`);
            }
          });
        }
      }
    }
  }
}

// Run analysis
searchForNodeGlobals("./");
```

### 2. Updated auth.config.ts

**Purpose**: Provide absolutely minimal Edge-compatible configuration

**Key Changes**:

- Remove module-level function calls
- Remove all imports that might trigger Node.js code
- Add explicit runtime export
- Defer all validation to runtime (not module load time)

**Implementation**:

```typescript
import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import AzureAD from "next-auth/providers/azure-ad";

/**
 * Edge-Compatible Authentication Configuration
 *
 * CRITICAL: This file must have ZERO module-level side effects
 * - No function calls at module level
 * - No imports that use Node.js globals
 * - No Prisma imports
 * - No file system operations
 */

export const runtime = "edge"; // Explicit Edge Runtime declaration

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

### 3. Updated middleware.ts

**Purpose**: Explicitly declare Edge Runtime and minimize imports

**Key Changes**:

- Add explicit runtime export
- Ensure no conditional imports
- Add runtime validation comments

**Implementation**:

```typescript
export const runtime = "edge"; // Explicit Edge Runtime declaration

import NextAuth from "next-auth";
import authConfig from "./auth.config";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "./routes";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  // ... existing middleware logic
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

### 4. Prisma Edge Configuration

**Purpose**: Configure Prisma to work with Edge Runtime where needed

**Implementation**:

Update `prisma/schema.prisma`:

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
  previewFeatures = ["driverAdapters"] // Enable edge compatibility
}
```

Create `lib/db-edge.ts` for Edge Runtime (if needed):

```typescript
// This file should NOT be imported by middleware
// Only use in API routes that need edge compatibility

import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

export const dbEdge = new PrismaClient().$extends(withAccelerate());
```

### 5. Next.js Configuration

**Purpose**: Explicitly configure Edge Runtime handling

**Implementation**:

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Ensure proper Edge Runtime handling
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
  // Explicitly mark middleware as edge
  webpack: (config, { isServer, nextRuntime }) => {
    if (isServer && nextRuntime === "edge") {
      // Ensure no Node.js-specific modules are bundled for edge
      config.resolve.alias = {
        ...config.resolve.alias,
        // Prevent accidental imports
        "@prisma/client": false,
        bcryptjs: false,
      };
    }
    return config;
  },
};

export default nextConfig;
```

## Data Models

No data model changes required. This is purely a runtime compatibility fix.

## Error Handling

### Edge Runtime Error Detection

**Strategy**: Catch and log Edge Runtime incompatibilities early

1. **Build-Time Validation**:
   - Use Next.js build process to detect Edge Runtime issues
   - Fail build if incompatible modules are detected
   - Provide clear error messages with fix suggestions

2. **Runtime Error Handling**:
   - Wrap middleware in try-catch for graceful degradation
   - Log errors to monitoring service
   - Return appropriate HTTP responses

3. **Development Warnings**:
   - Warn developers when importing Node.js-specific modules
   - Provide lint rules for Edge Runtime compatibility
   - Add comments marking Edge Runtime boundaries

### Fallback Strategies

1. **Graceful Degradation**: If middleware fails, allow request through (fail open for availability)
2. **Error Logging**: Log all Edge Runtime errors for debugging
3. **Monitoring**: Set up alerts for Edge Runtime errors in production

## Testing Strategy

### Unit Tests

1. **Edge Runtime Compatibility Tests**
   - Test that auth.config.ts can be imported in Edge Runtime
   - Verify no Node.js globals are referenced
   - Test middleware execution in simulated Edge environment

2. **Module Import Tests**
   - Test that middleware imports don't trigger Node.js code
   - Verify auth.config.ts has no side effects
   - Test that environment variables are accessible

### Integration Tests

1. **Local Edge Runtime Tests**
   - Use Vercel CLI to test Edge Runtime locally
   - Verify middleware executes without errors
   - Test authentication flows in Edge environment

2. **Build Tests**
   - Test that Next.js build completes without Edge warnings
   - Verify middleware bundle size and dependencies
   - Check for Node.js-specific modules in Edge bundle

### Deployment Tests

1. **Vercel Preview Deployments**
   - Deploy to preview environment first
   - Test all authentication flows
   - Monitor for Edge Runtime errors
   - Verify middleware execution times

2. **Production Smoke Tests**
   - Test authentication after production deployment
   - Monitor error logs for \_\_dirname errors
   - Verify middleware performance metrics

## Implementation Phases

### Phase 1: Diagnosis (Immediate)

1. Run diagnostic script to find \_\_dirname usage
2. Analyze middleware dependency chain
3. Identify exact source of Node.js global usage
4. Document findings

### Phase 2: Minimal Fix (Quick Win)

1. Remove module-level function calls from auth.config.ts
2. Add explicit runtime exports
3. Test locally with Vercel CLI
4. Deploy to preview environment

### Phase 3: Comprehensive Fix (If Needed)

1. Update Prisma configuration for Edge compatibility
2. Modify Next.js config to prevent Node.js imports
3. Add webpack configuration for Edge Runtime
4. Implement proper runtime boundaries

### Phase 4: Validation and Deployment

1. Run all tests (unit, integration, edge)
2. Deploy to Vercel preview
3. Verify no Edge Runtime errors
4. Deploy to production
5. Monitor for 24 hours

## Security Considerations

### Environment Variables

- **Edge Runtime Access**: Ensure environment variables are accessible in Edge Runtime
- **Secret Management**: Verify OAuth secrets are not exposed in Edge bundles
- **Token Security**: Maintain JWT signing security in Edge environment

### Authentication Security

- **Session Validation**: Ensure session validation works correctly in Edge Runtime
- **CSRF Protection**: Verify NextAuth.js CSRF protection works in Edge
- **OAuth Security**: Maintain OAuth security best practices

## Performance Considerations

### Edge Runtime Benefits

- **Reduced Latency**: Middleware runs closer to users
- **Faster Cold Starts**: Edge Runtime has faster cold start times
- **Global Distribution**: Automatic global distribution

### Optimization Strategies

- **Minimal Imports**: Keep middleware imports minimal
- **No Database Queries**: Avoid database queries in middleware
- **Token-Based Auth**: Use JWT tokens for fast authentication checks
- **Bundle Size**: Monitor and minimize middleware bundle size

## Rollback Plan

### Rollback Triggers

- Deployment fails with Edge Runtime errors
- Authentication breaks in production
- Middleware execution time exceeds 50ms
- User-facing errors increase

### Rollback Steps

1. Revert to previous Git commit
2. Redeploy previous working version
3. Verify authentication functionality
4. Investigate and fix issues
5. Retry deployment

## Monitoring and Maintenance

### Deployment Monitoring

- Monitor Vercel deployment logs for Edge Runtime errors
- Track middleware execution times
- Alert on \_\_dirname or similar errors
- Monitor authentication success rates

### Runtime Monitoring

- Track Edge Runtime error rates
- Monitor middleware performance
- Alert on authentication failures
- Track OAuth provider response times

### Maintenance Tasks

- Regular Edge Runtime compatibility audits
- Update dependencies with Edge Runtime support
- Monitor Next.js Edge Runtime changes
- Review and update documentation

## Dependencies

### Required Packages

- `next`: Current version (with Edge Runtime support)
- `next-auth`: ^5.x (Edge Runtime compatible)
- `@prisma/client`: Current version
- `@auth/prisma-adapter`: Current version

### Optional Packages (for Edge)

- `@prisma/client/edge`: For Edge Runtime database access
- `@prisma/extension-accelerate`: For Prisma Accelerate (Edge-compatible)

## Success Criteria

1. ✅ Vercel deployment completes without Edge Runtime errors
2. ✅ No `__dirname` or similar errors in production logs
3. ✅ All authentication methods work correctly
4. ✅ Middleware execution time remains under 50ms
5. ✅ Role-based access control functions properly
6. ✅ Local Edge Runtime tests pass
7. ✅ Build process completes without warnings
8. ✅ Production monitoring shows no Edge Runtime issues

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

Property 1: Edge Runtime Compatibility
_For any_ middleware execution in Edge Runtime, the middleware should complete without referencing Node.js globals like `__dirname`, `__filename`, or `process.cwd()`
**Validates: Requirements 1.1, 2.1, 2.2**

Property 2: Module Import Safety
_For any_ module imported by middleware.ts, the module should not execute code at module-level that uses Node.js-specific APIs
**Validates: Requirements 2.2, 4.1, 4.4**

Property 3: Runtime Boundary Enforcement
_For any_ code path from middleware.ts, the code path should not reach Prisma Client or bcryptjs imports
**Validates: Requirements 4.2, 4.3**

Property 4: Build-Time Validation
_For any_ Next.js build, the build process should detect and report Edge Runtime incompatibilities before deployment
**Validates: Requirements 5.1, 5.3**

Property 5: Production Error Elimination
_For any_ request to the deployed application, the middleware should execute without throwing `__dirname` reference errors
**Validates: Requirements 6.1, 6.3, 6.4**
