f# Implementation Plan

- [x] 1. Refactor auth.config.ts for edge compatibility
  - Extract edge-compatible configuration from current auth.ts
  - Remove all database-related code and imports
  - Configure OAuth providers (Google, GitHub, Azure AD) with environment variables
  - Set up custom pages configuration (signIn, error)
  - Remove session and JWT callbacks (move to auth.ts)
  - Ensure no Node.js-specific imports remain
  - _Requirements: 1.1, 1.3, 1.5, 10.1_

- [x] 1.1 Write property test for OAuth provider configuration
  - **Property 22: Required environment variables are present**
  - **Validates: Requirements 9.4**

- [x] 2. Update auth.ts with Node.js-specific configuration
  - Import and spread auth.config.ts configuration
  - Add Prisma adapter configuration
  - Configure JWT session strategy
  - Implement linkAccount event handler for email verification
  - Move signIn callback with email verification logic
  - Move session callback with user data enrichment
  - Move JWT callback with database queries
  - Add Credentials provider with bcrypt password validation
  - _Requirements: 1.1, 1.4, 2.1, 2.3, 2.4, 2.5, 4.1, 4.3, 8.1, 9.1, 10.2_

- [x] 2.1 Write property test for credentials authentication
  - **Property 1: Credentials authentication validates against stored data**
  - **Validates: Requirements 2.1**

- [x] 2.2 Write property test for OAuth account creation
  - **Property 2: OAuth authentication creates verified accounts**
  - **Validates: Requirements 2.3**

- [x] 2.3 Write property test for default role assignment
  - **Property 3: OAuth users receive default roles**
  - **Validates: Requirements 2.4**

- [x] 2.4 Write property test for unverified user rejection
  - **Property 4: Unverified credentials users are denied access**
  - **Validates: Requirements 2.5**

- [x] 2.5 Write property test for password hashing
  - **Property 21: Passwords use bcrypt hashing**
  - **Validates: Requirements 9.1, 9.2**

- [x] 3. Update middleware.ts for improved edge compatibility
  - Import auth from updated configuration
  - Simplify authentication check logic
  - Implement role-based access control for admin routes
  - Implement role-based access control for review routes
  - Implement role-based access control for project routes
  - Implement role-based access control for report routes
  - Ensure all redirects use proper URL construction
  - Add redirect for authenticated users on auth routes
  - Verify no database imports or queries
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.5, 6.1, 6.2, 6.3, 6.4, 10.3_

- [x] 3.1 Write property test for role-based access control
  - **Property 5: Role-based access control enforces route permissions**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

- [x] 3.2 Write property test for unauthorized redirects
  - **Property 6: Unauthorized access redirects to dashboard**
  - **Validates: Requirements 3.5**

- [x] 3.3 Write property test for middleware JWT usage
  - **Property 13: Middleware uses JWT data without database queries**
  - **Validates: Requirements 6.3**

- [x] 3.4 Write property test for URL construction
  - **Property 14: Middleware redirects use proper URL construction**
  - **Validates: Requirements 6.4**

- [x] 3.5 Write property test for authenticated user redirects
  - **Property 12: Authenticated users redirect from auth routes**
  - **Validates: Requirements 5.5**

- [x] 4. Enhance session callback for complete user data
  - Ensure session includes user ID from token.sub
  - Ensure session includes user role
  - Ensure session includes user name and email
  - Ensure session includes isOAuth status
  - Add error handling for missing token data
  - _Requirements: 4.2, 8.5_

- [x] 4.1 Write property test for session data completeness
  - **Property 7: Sessions contain complete user data**

  - **Validates: Requirements 4.2**

- [x] 4.2 Write property test for role support
  - **Property 20: All role types are supported**
  - **Validates: Requirements 8.5**

- [x] 5. Enhance JWT callback for data freshness
  - Handle initial sign-in (user present) to set role and OAuth status
  - Implement database query for subsequent requests to refresh user data
  - Include accounts relationship in user query
  - Update token with fresh name, email, role, and OAuth status
  - Add try-catch for database errors with graceful fallback
  - Log errors with sufficient context
  - _Requirements: 4.3, 4.5, 7.1, 7.4, 8.2_

- [x] 5.1 Write property test for JWT refresh
  - **Property 8: JWT tokens refresh user data in Node.js runtime**
  - **Validates: Requirements 4.3**

- [x] 5.2 Write property test for role change reflection
  - **Property 9: Role changes reflect in next session**
  - **Validates: Requirements 4.5**

- [x] 5.3 Write property test for user relationship queries
  - **Property 18: User queries include required relationships**
  - **Validates: Requirements 8.2**

- [x] 5.4 Write property test for error handling in callbacks
  - **Property 17: Database errors in callbacks are handled gracefully**
  - **Validates: Requirements 7.4**

- [x] 5.5 Write property test for error logging
  - **Property 15: Authentication errors are logged**
  - **Validates: Requirements 7.1**

- [x] 6. Improve signIn callback error handling
  - Add try-catch around OAuth user role assignment
  - Add try-catch around email verification check
  - Log all errors with context
  - Return appropriate boolean values for access control
  - Ensure OAuth users always get email verified
  - _Requirements: 2.3, 2.4, 2.5, 7.1, 8.3_

- [x] 6.1 Write property test for email verification field usage
  - **Property 19: Email verification uses correct field**
  - **Validates: Requirements 8.3**

- [x] 7. Enhance Credentials provider validation
  - Use Zod schema for input validation
  - Query user by email with error handling
  - Verify user exists and has password
  - Use bcrypt.compare for password validation
  - Return user object on success, null on failure
  - Ensure no sensitive data in error messages
  - _Requirements: 2.1, 7.2, 9.1, 9.2_

- [x] 7.1 Write property test for invalid credentials handling
  - **Property 16: Invalid credentials return user-friendly errors**
  - **Validates: Requirements 7.2**

- [x] 8. Add environment variable validation
  - Create validation function for required OAuth variables
  - Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
  - Check GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET
  - Check AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, and AZURE_AD_TENANT_ID
  - Log warnings for missing variables
  - Provide clear error messages
  - _Requirements: 9.4_

- [x] 8.1 Write unit tests for environment variable validation
  - Test validation with all variables present
  - Test validation with missing variables
  - Test error messages are clear
  - _Requirements: 9.4_

- [x] 9. Update TypeScript types for session and JWT
  - Extend NextAuth session type to include custom fields
  - Add user ID, role, isOAuth to session user type
  - Extend JWT type to include role and isOAuth
  - Ensure type safety across all callbacks
  - Update next-auth.d.ts if needed
  - _Requirements: 4.2, 8.5_

- [x] 9.1 Write unit tests for TypeScript type definitions
  - Test session type includes all required fields
  - Test JWT type includes custom fields
  - Test type compatibility with callbacks
  - _Requirements: 4.2_

- [x] 10. Add comprehensive error handling
  - Add error boundaries for authentication errors
  - Implement error logging utility
  - Create user-friendly error messages
  - Add error page enhancements for OAuth failures
  - Implement retry logic for transient errors
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 10.1 Write unit tests for error handling
  - Test error logging includes context
  - Test user-friendly error messages
  - Test error page redirects
  - Test graceful degradation
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Test edge runtime compatibility
  - Verify auth.config.ts has no Node.js imports
  - Test middleware execution in local edge runtime
  - Verify no database queries in middleware
  - Test all redirect scenarios
  - Validate URL construction
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 10.1_

- [x] 12.1 Write unit tests for edge compatibility
  - Test auth.config.ts imports are edge-compatible
  - Test middleware has no database imports
  - Test middleware completes quickly
  - _Requirements: 6.1, 6.2, 10.1_

- [x] 13. Integration testing for authentication flows
  - Test complete credentials authentication flow
  - Test complete Google OAuth flow (mocked)
  - Test complete GitHub OAuth flow (mocked)
  - Test complete Azure AD OAuth flow (mocked)
  - Test email verification requirement
  - Test role assignment for new users
  - Test session persistence across requests
  - Test sign out flow
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.4_

- [x] 13.1 Write integration tests for auth flows
  - Test credentials flow end-to-end
  - Test OAuth flows end-to-end
  - Test session persistence
  - Test sign out
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.4_

- [x] 14. Integration testing for RBAC
  - Test admin route access with different roles
  - Test review route access with different roles
  - Test project route access with different roles
  - Test report route access with different roles
  - Test unauthorized access redirects
  - Test authenticated user redirects from auth routes
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.5_

- [x] 14.1 Write integration tests for RBAC
  - Test all route types with all role types
  - Test redirects for unauthorized access
  - Test redirects for authenticated users on auth routes
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.5_

- [x] 15. Performance testing and optimization
  - Measure middleware response times
  - Optimize database queries in callbacks
  - Add database query indexes if needed
  - Test session refresh performance
  - Verify edge runtime timeout compliance
  - _Requirements: 6.5_

- [x] 15.1 Write performance tests
  - Test middleware response times
  - Test database query performance
  - Test session refresh times
  - _Requirements: 6.5_

- [x] 16. Documentation and migration guide
  - Document new authentication architecture
  - Create migration guide for existing deployments
  - Document environment variable requirements
  - Create troubleshooting guide
  - Document RBAC configuration
  - Add code comments for complex logic
  - _Requirements: All_

- [x] 16.1 Review documentation completeness
  - Verify all features are documented
  - Verify migration guide is clear
  - Verify troubleshooting guide covers common issues
  - _Requirements: All_

- [x] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
