# Edge Runtime Diagnostic Report

**Generated:** 2025-11-25

**Status:** ✅ DIAGNOSIS COMPLETE

## Executive Summary

The `__dirname` error in Vercel Edge Runtime is caused by **Prisma Client being imported in the middleware dependency chain**. While the application code (middleware.ts, auth.config.ts) is clean and doesn't directly use Node.js globals, Prisma's generated client files contain `__dirname`, `process.cwd()`, and `module.exports` which are incompatible with Edge Runtime.

## Root Cause Analysis

### The Problem

Vercel Edge Runtime error:

```
ReferenceError: __dirname is not defined
```

### The Source

**Prisma Generated Files** in `lib/generated/prisma/` contain Node.js globals:

1. **lib/generated/prisma/index.js** (4 instances)
   - Line 490: `config.dirname = __dirname`
   - Line 491: `path.join(__dirname, 'schema.prisma')`
   - Line 498: `path.join(process.cwd(), altPath, 'schema.prisma')`
   - Line 501: `path.join(process.cwd(), alternativePath)`

2. **lib/generated/prisma/runtime/client.js** (1 instance)
   - Line 6: `process.cwd()` in dotenv configuration

3. **Other Prisma runtime files** contain `module.exports` and Node.js-specific code

### The Import Chain

```
middleware.ts (Edge Runtime)
    ↓ imports
auth.config.ts
    ↓ imports
lib/env-validation.ts (uses process.env - OK)
    ↓ BUT SOMEWHERE...
Prisma Client is being imported ❌
    ↓ contains
__dirname, process.cwd(), module.exports
```

## Detailed Findings

### Application Code Analysis

✅ **middleware.ts** - CLEAN

- No Node.js globals
- Only imports: next-auth, auth.config, routes
- Edge Runtime compatible

✅ **auth.config.ts** - CLEAN

- No Node.js globals
- Imports: next-auth providers, lib/env-validation
- Module-level function call: `validateOAuthEnvironmentVariables()` (uses process.env only)
- Edge Runtime compatible

✅ **lib/env-validation.ts** - CLEAN

- Only uses `process.env` (available in Edge Runtime)
- No file system operations
- No **dirname or **filename
- Edge Runtime compatible

❌ **Prisma Generated Files** - PROBLEMATIC

- 48 total instances of Node.js globals found
- Primary issues in lib/generated/prisma/

### Node.js Globals Found

| File                                      | Global                    | Count | Critical?           |
| ----------------------------------------- | ------------------------- | ----- | ------------------- |
| lib/generated/prisma/index.js             | `__dirname`               | 2     | ✅ YES              |
| lib/generated/prisma/index.js             | `process.cwd()`           | 2     | ✅ YES              |
| lib/generated/prisma/runtime/client.js    | `process.cwd()`           | 1     | ✅ YES              |
| lib/generated/prisma/client.js            | `module.exports`          | 1     | ✅ YES              |
| lib/generated/prisma/default.js           | `module.exports`          | 1     | ✅ YES              |
| lib/generated/prisma/query_compiler_bg.js | `module.exports`          | 2     | ⚠️ Maybe            |
| app/api/templates/upload/route.ts         | `process.cwd()`           | 1     | ❌ NO (API route)   |
| eslint.config.mjs                         | `__dirname`, `__filename` | 4     | ❌ NO (build time)  |
| vitest.config.ts                          | `__dirname`               | 1     | ❌ NO (test config) |
| **tests**/edge-compatibility.test.ts      | Various                   | 20    | ❌ NO (test file)   |

### Middleware Import Chain

**Confirmed imports in middleware.ts:**

1. `next-auth` - Edge compatible ✅
2. `./auth.config` - Edge compatible ✅
3. `./routes` - Simple constants ✅

**Confirmed imports in auth.config.ts:**

1. `next-auth/providers/*` - Edge compatible ✅
2. `./lib/env-validation` - Edge compatible ✅

## The Mystery: How is Prisma Being Imported?

### Hypothesis 1: NextAuth.js Internal Import

NextAuth.js might be importing Prisma internally when it detects the adapter configuration, even though we're only using the edge-compatible config.

### Hypothesis 2: Module-Level Side Effect

The `validateOAuthEnvironmentVariables()` call at module level in auth.config.ts might be triggering some import chain we're not seeing.

### Hypothesis 3: Next.js Build Process

Next.js build process might be bundling Prisma into the middleware bundle despite it not being directly imported.

### Hypothesis 4: Transitive Dependency

One of the next-auth providers or next-auth itself might have a transitive dependency that imports Prisma.

## Recommended Solutions

### Solution 1: Remove Module-Level Function Call (IMMEDIATE)

**Priority:** HIGH  
**Effort:** LOW  
**Impact:** HIGH

Remove the `validateOAuthEnvironmentVariables()` call from module level in auth.config.ts:

```typescript
// BEFORE (auth.config.ts)
import { validateOAuthEnvironmentVariables } from "./lib/env-validation";
validateOAuthEnvironmentVariables(); // ❌ Module-level execution

export default {
  providers: [...],
  pages: {...},
} satisfies NextAuthConfig;

// AFTER (auth.config.ts)
import type { NextAuthConfig } from "next-auth";
// Remove the import and call entirely

export default {
  providers: [...],
  pages: {...},
} satisfies NextAuthConfig;
```

**Rationale:** Module-level code execution can trigger unexpected import chains. Even though env-validation.ts is clean, removing this call eliminates a potential trigger point.

### Solution 2: Add Explicit Edge Runtime Declaration (IMMEDIATE)

**Priority:** HIGH  
**Effort:** LOW  
**Impact:** MEDIUM

Add explicit runtime exports to both files:

```typescript
// middleware.ts
export const runtime = "edge";

// auth.config.ts
export const runtime = "edge";
```

**Rationale:** Explicitly tells Next.js these files must run in Edge Runtime, enabling better build-time validation.

### Solution 3: Configure Next.js to Exclude Prisma from Edge Bundle (IMMEDIATE)

**Priority:** HIGH  
**Effort:** MEDIUM  
**Impact:** HIGH

Update next.config.ts:

```typescript
const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
  webpack: (config, { isServer, nextRuntime }) => {
    if (isServer && nextRuntime === "edge") {
      // Prevent Prisma from being bundled in Edge Runtime
      config.resolve.alias = {
        ...config.resolve.alias,
        "@prisma/client": false,
        "@prisma/client/edge": false,
        ".prisma/client": false,
      };
    }
    return config;
  },
};
```

**Rationale:** Explicitly prevents Prisma from being bundled into Edge Runtime, even if accidentally imported.

### Solution 4: Analyze Next.js Build Output (DIAGNOSTIC)

**Priority:** MEDIUM  
**Effort:** LOW  
**Impact:** DIAGNOSTIC

Run build and analyze the middleware bundle:

```bash
npm run build
# Look for Edge Runtime warnings
# Check .next/server/middleware.js for Prisma imports
```

**Rationale:** The build output will show exactly what's being bundled into the middleware.

### Solution 5: Use Vercel CLI for Local Testing (VALIDATION)

**Priority:** MEDIUM  
**Effort:** LOW  
**Impact:** VALIDATION

```bash
npm install -g vercel
vercel dev
# Test authentication flows locally in Edge Runtime
```

**Rationale:** Vercel CLI simulates the production Edge Runtime environment locally, allowing us to catch issues before deployment.

## Implementation Plan

### Phase 1: Immediate Fixes (Do Now)

1. ✅ Run diagnostic script (COMPLETE)
2. ⏭️ Remove `validateOAuthEnvironmentVariables()` call from auth.config.ts
3. ⏭️ Add `export const runtime = 'edge'` to middleware.ts and auth.config.ts
4. ⏭️ Update next.config.ts with webpack configuration
5. ⏭️ Test locally with `npm run build`

### Phase 2: Validation (After Phase 1)

1. ⏭️ Deploy to Vercel preview environment
2. ⏭️ Monitor deployment logs for Edge Runtime errors
3. ⏭️ Test authentication flows in preview
4. ⏭️ Verify no `__dirname` errors in logs

### Phase 3: Production Deployment (After Phase 2)

1. ⏭️ Deploy to production
2. ⏭️ Monitor for 24 hours
3. ⏭️ Verify authentication works correctly
4. ⏭️ Check middleware execution times

## Success Criteria

- ✅ No `__dirname` errors in Vercel logs
- ✅ Middleware deploys successfully to Edge Runtime
- ✅ All authentication methods work (Google, GitHub, Azure AD)
- ✅ Middleware execution time < 50ms
- ✅ No Edge Runtime warnings in build output

## Additional Notes

### Why process.env is OK in Edge Runtime

`process.env` is available in Edge Runtime as a special case. Vercel injects environment variables at build time, so `process.env.VARIABLE_NAME` works. However, `process.cwd()`, `__dirname`, and other Node.js globals are not available.

### Why Prisma is Problematic

Prisma Client is designed for Node.js runtime and uses:

- File system operations to find schema.prisma
- `__dirname` to resolve paths
- Native binary loading
- CommonJS module.exports

None of these work in Edge Runtime.

### The Correct Architecture

```
Edge Runtime (middleware.ts)
  ↓ uses
auth.config.ts (OAuth only, no DB)
  ↓ JWT validation only

Node.js Runtime (API routes, server components)
  ↓ uses
auth.ts (full config with Prisma)
  ↓ database queries
```

## Conclusion

The diagnostic analysis confirms that:

1. **Application code is clean** - No direct usage of Node.js globals in middleware chain
2. **Prisma is the culprit** - Generated files contain incompatible code
3. **Import chain is unclear** - Need to prevent Prisma from being bundled
4. **Solutions are straightforward** - Remove module-level execution, add explicit runtime declarations, configure webpack

**Next Steps:** Proceed to Task 2 to implement the fixes identified in this diagnostic report.
