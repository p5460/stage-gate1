# Authentication Flow Testing Report

**Test Date:** November 19, 2025
**Server URL:** http://localhost:3001
**Test Status:** In Progress

## Test Environment Setup

- ✅ Development server running on port 3001
- ✅ Database seeded with test users
- ✅ OAuth providers configured (Google, GitHub, Azure AD)

## Test Users Available

From seed data:

- **Admin:** admin@csir.co.za / password123 (Role: ADMIN)
- **Project Lead 1:** sarah.johnson@csir.co.za / password123 (Role: PROJECT_LEAD)
- **Project Lead 2:** mike.brown@csir.co.za / password123 (Role: PROJECT_LEAD)
- **Researcher:** linda.williams@csir.co.za / password123 (Role: RESEARCHER)

## Test Cases

### 1. Credentials (Email/Password) Login Flow

**Requirement:** 2.1, 2.4

#### Test 1.1: Admin User Login

- [ ] Navigate to http://localhost:3001/auth/login
- [ ] Enter email: admin@csir.co.za
- [ ] Enter password: password123
- [ ] Click "Sign In"
- [ ] Expected: Redirect to /dashboard
- [ ] Expected: User role displayed as ADMIN
- [ ] Expected: Session persists on page refresh

**Result:**

#### Test 1.2: Project Lead Login

- [ ] Navigate to http://localhost:3001/auth/login
- [ ] Enter email: sarah.johnson@csir.co.za
- [ ] Enter password: password123
- [ ] Click "Sign In"
- [ ] Expected: Redirect to /dashboard
- [ ] Expected: User role displayed as PROJECT_LEAD
- [ ] Expected: Session persists on page refresh

**Result:**

#### Test 1.3: Invalid Credentials

- [ ] Navigate to http://localhost:3001/auth/login
- [ ] Enter email: admin@csir.co.za
- [ ] Enter password: wrongpassword
- [ ] Click "Sign In"
- [ ] Expected: Error message displayed
- [ ] Expected: User remains on login page

**Result:**

#### Test 1.4: Unverified Email

- [ ] Create test user without email verification
- [ ] Attempt login
- [ ] Expected: Login blocked with appropriate message

**Result:**

### 2. Google OAuth Login Flow

**Requirement:** 2.2, 2.4

#### Test 2.1: Google OAuth Sign In

- [ ] Navigate to http://localhost:3001/auth/login
- [ ] Click "Google" button
- [ ] Expected: Redirect to Google OAuth consent screen
- [ ] Complete Google authentication
- [ ] Expected: Redirect back to application
- [ ] Expected: User logged in successfully
- [ ] Expected: Default role assigned (USER)
- [ ] Expected: Session persists on page refresh

**Result:**

**Note:** Google OAuth requires actual Google account credentials. Testing in browser.

### 3. GitHub OAuth Login Flow

**Requirement:** 2.2, 2.4

#### Test 3.1: GitHub OAuth Sign In

- [ ] Navigate to http://localhost:3001/auth/login
- [ ] Click "GitHub" button
- [ ] Expected: Redirect to GitHub OAuth authorization page
- [ ] Complete GitHub authentication
- [ ] Expected: Redirect back to application
- [ ] Expected: User logged in successfully
- [ ] Expected: Default role assigned (USER)
- [ ] Expected: Session persists on page refresh

**Result:**

**Note:** GitHub OAuth requires actual GitHub account. Testing in browser.

### 4. Azure AD OAuth Login Flow

**Requirement:** 2.2, 2.4

#### Test 4.1: Azure AD OAuth Sign In

- [ ] Navigate to http://localhost:3001/auth/login
- [ ] Click "Microsoft" button
- [ ] Expected: Redirect to Microsoft login page
- [ ] Complete Microsoft authentication
- [ ] Expected: Redirect back to application
- [ ] Expected: User logged in successfully
- [ ] Expected: Default role assigned (USER)
- [ ] Expected: Session persists on page refresh

**Result:**

**Note:** Azure AD OAuth requires configured Azure AD tenant. May not be fully configured in test environment.

### 5. Role Assignment Verification

**Requirement:** 2.4, 2.5

#### Test 5.1: Credentials Login Role Assignment

- [ ] Login with admin@csir.co.za
- [ ] Check session data includes role: ADMIN
- [ ] Verify JWT token contains role information
- [ ] Logout and login with sarah.johnson@csir.co.za
- [ ] Check session data includes role: PROJECT_LEAD

**Result:**

#### Test 5.2: OAuth Login Role Assignment

- [ ] Login with Google OAuth (new user)
- [ ] Expected: Default role USER assigned
- [ ] Verify role persists in session
- [ ] Verify JWT token contains role information

**Result:**

### 6. Session Persistence

**Requirement:** 2.5

#### Test 6.1: Page Refresh Persistence

- [ ] Login with any method
- [ ] Navigate to /dashboard
- [ ] Refresh page (F5)
- [ ] Expected: User remains logged in
- [ ] Expected: No redirect to login page
- [ ] Expected: User data still available

**Result:**

#### Test 6.2: Navigation Persistence

- [ ] Login with any method
- [ ] Navigate to /projects
- [ ] Navigate to /reports
- [ ] Navigate to /dashboard
- [ ] Expected: User remains logged in throughout
- [ ] Expected: Session data consistent

**Result:**

#### Test 6.3: Browser Tab Persistence

- [ ] Login in one tab
- [ ] Open new tab to same application
- [ ] Expected: User logged in in new tab
- [ ] Expected: Session shared across tabs

**Result:**

### 7. Logout Functionality

**Requirement:** 2.5

#### Test 7.1: Logout from Dashboard

- [ ] Login with any method
- [ ] Navigate to /dashboard
- [ ] Click logout button/link
- [ ] Expected: User logged out
- [ ] Expected: Redirect to home or login page
- [ ] Expected: Session cleared
- [ ] Expected: Cannot access protected routes

**Result:**

#### Test 7.2: Logout Session Cleanup

- [ ] Login with credentials
- [ ] Logout
- [ ] Attempt to access /dashboard directly
- [ ] Expected: Redirect to login page
- [ ] Expected: No session data available

**Result:**

### 8. Callback URL Preservation

**Requirement:** 2.5

#### Test 8.1: Protected Route Redirect

- [ ] Logout if logged in
- [ ] Navigate directly to http://localhost:3001/projects
- [ ] Expected: Redirect to login with callbackUrl parameter
- [ ] Login with credentials
- [ ] Expected: Redirect back to /projects after login

**Result:**

#### Test 8.2: Deep Link Preservation

- [ ] Logout if logged in
- [ ] Navigate to http://localhost:3001/admin/users
- [ ] Expected: Redirect to login with callbackUrl
- [ ] Login with admin credentials
- [ ] Expected: Redirect back to /admin/users

**Result:**

## Summary

### Passed Tests

-

### Failed Tests

-

### Blocked Tests

- Azure AD OAuth (requires tenant configuration)

### Issues Found

-

### Recommendations

-

## Next Steps

1. Complete manual testing in browser
2. Document any issues found
3. Verify Edge Runtime compatibility
4. Proceed to task 6: Validate Edge Runtime compatibility
