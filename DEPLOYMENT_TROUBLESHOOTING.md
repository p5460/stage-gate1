# Deployment Troubleshooting Guide

## Current Issue: 500 Internal Server Error

Your application has been successfully deployed to Vercel, but it's returning a 500 error. Here's how to diagnose and fix it:

## Step 1: Check Vercel Deployment Logs

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Click on your project
3. Click on the latest deployment
4. Check the "Runtime Logs" tab for error messages

## Step 2: Verify Environment Variables

Make sure ALL these environment variables are set in Vercel:

### Required Variables:

```
DATABASE_URL=your_database_connection_string
AUTH_SECRET=your_auth_secret_key
NEXTAUTH_URL=https://your-domain.vercel.app
```

### OAuth Providers (at least one required):

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

AZURE_AD_CLIENT_ID=your_azure_client_id
AZURE_AD_CLIENT_SECRET=your_azure_client_secret
AZURE_AD_TENANT_ID=your_azure_tenant_id
```

### How to Add Environment Variables in Vercel:

1. Go to your project in Vercel dashboard
2. Click "Settings" tab
3. Click "Environment Variables" in the sidebar
4. Add each variable with its value
5. Make sure to select "Production", "Preview", and "Development" for each
6. Click "Save"
7. Redeploy your application

## Step 3: Check Database Connection

Your DATABASE_URL must be accessible from Vercel's servers:

- If using **Vercel Postgres**: Use the connection string from Vercel
- If using **external database**: Ensure it allows connections from Vercel IPs
- If using **PlanetScale/Neon**: Use the connection string with SSL enabled

## Step 4: Verify Auth Configuration

1. Make sure `NEXTAUTH_URL` matches your Vercel domain exactly
2. Update OAuth redirect URIs in provider consoles:
   - Google: https://your-domain.vercel.app/api/auth/callback/google
   - GitHub: https://your-domain.vercel.app/api/auth/callback/github
   - Azure AD: https://your-domain.vercel.app/api/auth/callback/azure-ad

## Step 5: Common Fixes

### Fix 1: Regenerate Prisma Client

If you see Prisma-related errors, add this to your build command:

```bash
prisma generate && next build
```

In Vercel:

1. Go to Settings > General
2. Find "Build & Development Settings"
3. Override build command: `prisma generate && npm run build`

### Fix 2: Check for Missing Dependencies

Make sure all dependencies are in package.json and installed

### Fix 3: Database Migration

Run Prisma migrations on your production database:

```bash
npx prisma migrate deploy
```

## Step 6: Test Locally with Production Build

Test the production build locally:

```bash
npm run build
npm start
```

If it works locally but not on Vercel, it's likely an environment variable issue.

## Step 7: Enable Vercel Logs

To see detailed error messages:

1. Go to your Vercel project
2. Click on "Settings"
3. Click on "Functions"
4. Enable "Detailed Logs"

## Quick Checklist

- [ ] All environment variables are set in Vercel
- [ ] DATABASE_URL is correct and accessible
- [ ] AUTH_SECRET is set (generate with: `openssl rand -base64 32`)
- [ ] NEXTAUTH_URL matches your Vercel domain
- [ ] At least one OAuth provider is configured
- [ ] OAuth redirect URIs are updated in provider consoles
- [ ] Database is accessible from Vercel
- [ ] Prisma migrations have been run on production database

## Next Steps

1. Check the Vercel Runtime Logs for the specific error
2. Share the error message if you need help debugging
3. Verify all environment variables are set correctly
4. Ensure your database is accessible from Vercel

## Common Error Messages and Solutions

### "PrismaClientInitializationError"

- **Cause**: Database connection failed
- **Fix**: Check DATABASE_URL and database accessibility

### "Invalid `prisma.user.findUnique()` invocation"

- **Cause**: Database schema doesn't match Prisma schema
- **Fix**: Run `npx prisma migrate deploy` on production database

### "NEXTAUTH_URL environment variable is not set"

- **Cause**: Missing NEXTAUTH_URL
- **Fix**: Add NEXTAUTH_URL to Vercel environment variables

### "OAuth provider error"

- **Cause**: OAuth credentials missing or redirect URI mismatch
- **Fix**: Verify OAuth environment variables and update redirect URIs

## Need More Help?

Check the Vercel Runtime Logs for the specific error message and we can troubleshoot from there.
