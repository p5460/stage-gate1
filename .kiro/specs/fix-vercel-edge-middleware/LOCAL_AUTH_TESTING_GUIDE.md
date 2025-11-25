# Local Authentication Testing Guide

## Prerequisites

Before testing, ensure:

1. ✅ Database is running and accessible
2. ✅ Environment variables are configured (.env.local)
3. ✅ `npm install` has been run
4. ✅ `prisma generate` has been run

## Starting the Development Server

```bash
npm run dev
```

The application should start on `http://localhost:3000`

## Test Scenarios

### 1. Credentials (Email/Password) Login Flow

**Test Steps:**

1. Navigate to `http://localhost:3000/auth/login`
2. Enter valid email and password credentials
3. Click "Sign In"
4. Verify redirect to `/dashboard`
5. Check that user role is displayed correctly
6. Verify session persists on page refresh

**Expected Results:**

- ✅ Successful login with valid credentials
- ✅ Redirect to dashboard after login
- ✅ User role visible in UI
- ✅ Session persists across page refreshes

**Test Invalid Credentials:**

1. Enter invalid email or password
2. Verify error message is displayed
3. Verify no redirect occurs

### 2. Google OAuth Login Flow

**Test Steps:**

1. Navigate to `http://localhost:3000/auth/login`
2. Click "Sign in with Google" button
3. Complete Google OAuth flow in popup/redirect
4. Verify redirect back to application
5. Check that user is logged in
6. Verify role assignment for OAuth user

**Expected Results:**

- ✅ Google OAuth popup/redirect opens
- ✅ Successful authentication with Google
- ✅ Redirect to dashboard after OAuth
- ✅ User role assigned (default: USER)
- ✅ Session persists

### 3. GitHub OAuth Login Flow

**Test Steps:**

1. Navigate to `http://localhost:3000/auth/login`
2. Click "Sign in with GitHub" button
3. Complete GitHub OAuth flow
4. Verify redirect back to application
5. Check that user is logged in
6. Verify role assignment for OAuth user

**Expected Results:**

- ✅ GitHub OAuth flow completes
- ✅ Successful authentication
- ✅ Redirect to dashboard
- ✅ User role assigned
- ✅ Session persists

### 4. Azure AD OAuth Login Flow

**Test Steps:**

1. Navigate to `http://localhost:3000/auth/login`
2. Click "Sign in with Azure AD" button
3. Complete Azure AD OAuth flow
4. Verify redirect back to application
5. Check that user is logged in
6. Verify role assignment for OAuth user

**Expected Results:**

- ✅ Azure AD OAuth flow completes
- ✅ Successful authentication
- ✅ Redirect to dashboard
- ✅ User role assigned
- ✅ Session persists

### 5. Role-Based Access Control Testing

**Test Admin Routes (Requires ADMIN or GATEKEEPER role):**

1. Log in as a user with ADMIN role
2. Navigate to `/admin`
3. Verify access is granted
4. Log out and log in as USER role
5. Try to access `/admin`
6. Verify redirect to `/dashboard`

**Test Gatekeeper Routes (Requires ADMIN, GATEKEEPER, or REVIEWER role):**

1. Log in as GATEKEEPER
2. Navigate to `/reviews`
3. Verify access is granted
4. Log out and log in as USER
5. Try to access `/reviews`
6. Verify redirect to `/dashboard`

**Test Project Management Routes (Requires ADMIN, PROJECT_LEAD, or GATEKEEPER):**

1. Log in as PROJECT_LEAD
2. Navigate to `/projects/create`
3. Verify access is granted
4. Log out and log in as USER
5. Try to access `/projects/create`
6. Verify redirect to `/dashboard`

**Expected Results:**

- ✅ Users with correct roles can access protected routes
- ✅ Users without correct roles are redirected
- ✅ Redirects preserve callback URLs
- ✅ No errors in browser console

### 6. Session Persistence Testing

**Test Steps:**

1. Log in with any method
2. Navigate to different pages
3. Refresh the browser
4. Close and reopen the browser tab
5. Verify session is maintained

**Expected Results:**

- ✅ Session persists across page navigation
- ✅ Session persists on browser refresh
- ✅ Session persists when reopening tab (if not expired)

### 7. Logout Functionality

**Test Steps:**

1. Log in with any method
2. Click logout button
3. Verify redirect to login page
4. Try to access protected route
5. Verify redirect to login with callback URL

**Expected Results:**

- ✅ Logout clears session
- ✅ Redirect to login page
- ✅ Cannot access protected routes after logout
- ✅ Callback URL preserved for post-login redirect

## Middleware Testing

### Test Public Routes

1. Without logging in, access `/`
2. Verify no redirect occurs
3. Access `/auth/new-verification`
4. Verify no redirect occurs

### Test Auth Routes

1. Log in to the application
2. Try to access `/auth/login`
3. Verify redirect to `/dashboard`
4. Try to access `/auth/register`
5. Verify redirect to `/dashboard`

### Test Protected Routes

1. Without logging in, access `/dashboard`
2. Verify redirect to `/auth/login?callbackUrl=/dashboard`
3. Log in
4. Verify redirect back to `/dashboard`

## Browser Console Checks

During all tests, monitor the browser console for:

- ❌ No JavaScript errors
- ❌ No authentication errors
- ❌ No middleware errors
- ❌ No network request failures

## Database Verification

After OAuth logins, verify in the database:

1. User record created with correct email
2. Account record created linking to OAuth provider
3. Role assigned (default USER for OAuth)
4. emailVerified set to current timestamp

## Common Issues to Watch For

1. **Session not persisting**: Check NEXTAUTH_SECRET is set
2. **OAuth redirect fails**: Verify OAuth provider credentials
3. **Role-based access not working**: Check JWT token contains role
4. **Middleware redirect loop**: Check route configuration in routes.ts
5. **CORS errors**: Verify NEXTAUTH_URL matches your local URL

## Test Results Template

```markdown
## Test Results - [Date]

### Credentials Login

- [ ] Valid credentials login: PASS/FAIL
- [ ] Invalid credentials rejected: PASS/FAIL
- [ ] Session persists: PASS/FAIL

### OAuth Flows

- [ ] Google OAuth: PASS/FAIL
- [ ] GitHub OAuth: PASS/FAIL
- [ ] Azure AD OAuth: PASS/FAIL

### Role-Based Access

- [ ] Admin routes protected: PASS/FAIL
- [ ] Gatekeeper routes protected: PASS/FAIL
- [ ] Project management routes protected: PASS/FAIL

### Middleware

- [ ] Public routes accessible: PASS/FAIL
- [ ] Auth routes redirect when logged in: PASS/FAIL
- [ ] Protected routes redirect when not logged in: PASS/FAIL
- [ ] Callback URLs preserved: PASS/FAIL

### Session Management

- [ ] Session persists on refresh: PASS/FAIL
- [ ] Logout clears session: PASS/FAIL

### Notes:

[Add any observations or issues encountered]
```

## Next Steps After Local Testing

Once local testing is complete and all tests pass:

1. Document any issues found
2. Fix any bugs discovered
3. Proceed with Vercel deployment (Task 7)
4. Repeat tests in production environment
