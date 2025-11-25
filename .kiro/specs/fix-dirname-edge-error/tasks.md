# Implementation Plan

- [x] 1. Diagnose \_\_dirname usage in dependency chain
  - Create diagnostic script to search for Node.js globals (**dirname, **filename, process.cwd())
  - Run script on entire codebase to identify all usages
  - Analyze middleware.ts import chain to trace dependency path
  - Document exact file and line number where \_\_dirname is referenced
  - Identify if issue is in application code or third-party dependencies
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Remove module-level side effects from auth.config.ts
  - Remove validateOAuthEnvironmentVariables() call from module level
  - Ensure no function calls execute at module import time
  - Verify auth.config.ts only exports configuration object
  - Add explicit `export const runtime = 'edge'` declaration
  - Test that importing auth.config.ts has no side effects
  - _Requirements: 2.2, 2.3, 4.1, 4.4_

- [x] 3. Add explicit Edge Runtime configuration
  - Add `export const runtime = 'edge'` to middleware.ts
  - Add `export const runtime = 'edge'` to auth.config.ts
  - Update Next.js config to mark middleware as Edge Runtime
  - Configure webpack to prevent Node.js imports in Edge bundles
  - Add serverComponentsExternalPackages configuration
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 4. Update Prisma configuration for Edge compatibility
  - Add previewFeatures = ["driverAdapters"] to Prisma schema if needed
  - Ensure Prisma Client is not imported by middleware or auth.config.ts
  - Verify auth.ts (Node.js runtime) is the only file importing Prisma
  - Test that middleware bundle does not include Prisma Client
  - _Requirements: 3.3, 4.2_

- [x] 5. Test Edge Runtime compatibility locally
  - Install and configure Vercel CLI
  - Run `vercel dev` to test Edge Runtime locally
  - Test middleware execution in local Edge environment
  - Verify no \_\_dirname errors occur locally
  - Test all authentication flows in local Edge Runtime
  - _Requirements: 5.1, 5.2_

- [x] 6. Build and validate Edge bundle
  - Run `npm run build` to build production bundle
  - Analyze middleware bundle for Node.js-specific imports
  - Verify no Edge Runtime warnings in build output
  - Check middleware bundle size (should be minimal)
  - Confirm no Prisma or bcryptjs in Edge bundle
  - _Requirements: 5.1, 5.3_

- [-] 7. Deploy to Vercel preview environment
  - Push changes to Git repository
  - Create preview deployment on Vercel
  - Monitor deployment logs for Edge Runtime errors
  - Verify deployment completes successfully
  - Test authentication in preview environment
  - _Requirements: 6.1, 6.2_

- [ ] 8. Validate production deployment
  - Monitor Vercel logs for \_\_dirname errors
  - Test all authentication methods (credentials, Google, GitHub, Azure AD)
  - Verify role-based access control works correctly
  - Check middleware execution times (should be < 50ms)
  - Confirm no 500 errors in production
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 9. Set up monitoring and alerts
  - Configure monitoring for Edge Runtime errors
  - Set up alerts for \_\_dirname reference errors
  - Monitor middleware execution times
  - Track authentication success/failure rates
  - Document monitoring setup for future reference
  - _Requirements: 6.4_
