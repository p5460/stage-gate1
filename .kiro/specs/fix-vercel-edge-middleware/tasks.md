# Implementation Plan

- [x] 1. Refactor auth.config.ts for Edge Runtime compatibility
  - Create Edge-compatible version of auth.config.ts that removes all Node.js-specific imports
  - Remove bcryptjs import from auth.config.ts
  - Remove getUserByEmail import (Prisma) from auth.config.ts
  - Remove Credentials provider from auth.config.ts
  - Keep only OAuth providers (Google, GitHub, Azure AD) in auth.config.ts
  - Simplify JWT callback to pass-through token without database queries
  - Update session callback to read only from token parameter
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2_

- [x] 2. Update auth.ts to include Credentials provider
  - Import base authConfig from auth.config.ts
  - Spread authConfig into NextAuth configuration
  - Add Credentials provider with bcryptjs validation to auth.ts
  - Keep getUserByEmail import in auth.ts only
  - Implement full JWT callback with database queries in auth.ts
  - Populate JWT token with user role, name, email, and isOAuth flag
  - Ensure signIn callback performs email verification checks
  - Reuse base session callback from auth.config.ts
  - _Requirements: 2.1, 2.4, 2.5, 4.3, 4.4_

- [x] 3. Verify middleware.ts Edge Runtime compatibility
  - Confirm middleware.ts imports only from auth.config.ts
  - Verify no direct imports of Node.js-specific modules
  - Test that middleware uses req.auth.user.role from JWT token
  - Ensure authentication redirects preserve callback URLs
  - Validate route matching logic works with Edge Runtime
  - _Requirements: 1.1, 1.3, 2.3, 3.1, 3.5_

- [x] 4. Restore and test role-based access control
  - Uncomment role-based access control logic in middleware.ts
  - Test admin route restrictions (ADMIN, GATEKEEPER roles)
  - Test gatekeeper route restrictions (ADMIN, GATEKEEPER, REVIEWER roles)
  - Test project management route restrictions (ADMIN, PROJECT_LEAD, GATEKEEPER roles)
  - Test reports route access for multiple roles
  - Verify redirects work correctly for unauthorized access
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [-] 5. Test authentication flows locally
  - Test credentials (email/password) login flow
  - Test Google OAuth login flow
  - Test GitHub OAuth login flow
  - Test Azure AD OAuth login flow
  - Verify role assignment works for all authentication methods
  - Test session persistence across page refreshes
  - Verify logout functionality works correctly
  - _Requirements: 2.1, 2.2, 2.4, 2.5_

- [x] 6. Validate Edge Runtime compatibility
  - Run Next.js build locally and check for Edge Runtime warnings
  - Use Vercel CLI to test Edge Runtime locally
  - Verify no bcryptjs or Prisma imports in middleware bundle
  - Check middleware bundle size and dependencies
  - Test middleware execution in local Edge Runtime environment
  - _Requirements: 1.1, 1.2, 1.4, 4.5_

- [-] 7. Deploy to Vercel and verify
  - Push changes to Git repository
  - Trigger Vercel deployment
  - Monitor build logs for Edge Function errors
  - Verify deployment completes successfully
  - Test authentication in production environment
  - Verify role-based access control works in production
  - Monitor for any Edge Runtime errors in production logs
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8. Fix NextAuth v5 middleware Edge Runtime configuration
  - Update middleware.ts to use NextAuth v5 Edge-compatible pattern
  - Ensure middleware only imports Edge-compatible modules
  - Add runtime: 'edge' export to auth.config.ts if needed
  - Verify middleware.ts uses proper NextAuth v5 middleware wrapper
  - Test that Vercel build no longer flags unsupported module references
  - Confirm middleware bundle only includes Edge-compatible code
  - _Requirements: 1.1, 1.2, 1.3, 4.2, 5.1_
