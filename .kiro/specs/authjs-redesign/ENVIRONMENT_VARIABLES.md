# Environment Variables Guide

## Overview

This document describes all environment variables required for the authentication system.

## Required Variables

### Core Authentication

#### NEXTAUTH_URL

**Description**: The canonical URL of your application

**Required**: Yes

**Format**: Full URL including protocol

**Examples**:

```bash
# Development
NEXTAUTH_URL=http://localhost:3000

# Production
NEXTAUTH_URL=https://your-domain.com

# Staging
NEXTAUTH_URL=https://staging.your-domain.com
```

**Notes**:

- Must match the domain where your app is deployed
- Used for OAuth redirect URIs
- Must include protocol (http:// or https://)
- No trailing slash

---

#### NEXTAUTH_SECRET

**Description**: Secret key used to encrypt JWT tokens and session data

**Required**: Yes

**Format**: Random string (minimum 32 characters recommended)

**Generate**:

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Using online generator
# Visit: https://generate-secret.vercel.app/32
```

**Example**:

```bash
NEXTAUTH_SECRET=your-secret-key-here-minimum-32-characters
```

**Security Notes**:

- ⚠️ Never commit this to version control
- ⚠️ Use different secrets for different environments
- ⚠️ Rotate periodically (will invalidate existing sessions)
- ⚠️ Keep this secret secure

---

### Database

#### DATABASE_URL

**Description**: Connection string for your database

**Required**: Yes

**Format**: Database-specific connection string

**PostgreSQL**:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/database?schema=public"

# With connection pooling
DATABASE_URL="postgresql://user:password@localhost:5432/database?schema=public&connection_limit=10&pool_timeout=20"

# With SSL
DATABASE_URL="postgresql://user:password@localhost:5432/database?schema=public&sslmode=require"
```

**MySQL**:

```bash
DATABASE_URL="mysql://user:password@localhost:3306/database"

# With SSL
DATABASE_URL="mysql://user:password@localhost:3306/database?ssl=true"
```

**Notes**:

- URL-encode special characters in password
- Use connection pooling for better performance
- Enable SSL in production

---

## OAuth Providers

### Google OAuth

#### GOOGLE_CLIENT_ID

**Description**: Google OAuth client ID

**Required**: Only if using Google authentication

**Format**: String ending in `.apps.googleusercontent.com`

**Example**:

```bash
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

**How to Get**:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth client ID
5. Choose "Web application"
6. Add authorized redirect URI: `https://your-domain.com/api/auth/callback/google`
7. Copy the Client ID

---

#### GOOGLE_CLIENT_SECRET

**Description**: Google OAuth client secret

**Required**: Only if using Google authentication (must be paired with GOOGLE_CLIENT_ID)

**Format**: Random string

**Example**:

```bash
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
```

**How to Get**:

- Same process as GOOGLE_CLIENT_ID
- Copy the Client Secret from the same credentials page

**Security Notes**:

- ⚠️ Never commit this to version control
- ⚠️ Keep this secret secure

---

### GitHub OAuth

#### GITHUB_CLIENT_ID

**Description**: GitHub OAuth client ID

**Required**: Only if using GitHub authentication

**Format**: 20-character hexadecimal string

**Example**:

```bash
GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8
```

**How to Get**:

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in application details:
   - Application name: Your app name
   - Homepage URL: `https://your-domain.com`
   - Authorization callback URL: `https://your-domain.com/api/auth/callback/github`
4. Click "Register application"
5. Copy the Client ID

---

#### GITHUB_CLIENT_SECRET

**Description**: GitHub OAuth client secret

**Required**: Only if using GitHub authentication (must be paired with GITHUB_CLIENT_ID)

**Format**: 40-character hexadecimal string

**Example**:

```bash
GITHUB_CLIENT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
```

**How to Get**:

- Same process as GITHUB_CLIENT_ID
- Click "Generate a new client secret"
- Copy the secret immediately (it won't be shown again)

**Security Notes**:

- ⚠️ Never commit this to version control
- ⚠️ Keep this secret secure
- ⚠️ Regenerate if compromised

---

### Azure AD OAuth

#### AZURE_AD_CLIENT_ID

**Description**: Azure AD application (client) ID

**Required**: Only if using Azure AD authentication

**Format**: UUID (GUID)

**Example**:

```bash
AZURE_AD_CLIENT_ID=12345678-1234-1234-1234-123456789abc
```

**How to Get**:

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to Azure Active Directory
3. Go to App registrations → New registration
4. Fill in application details:
   - Name: Your app name
   - Supported account types: Choose appropriate option
   - Redirect URI: `https://your-domain.com/api/auth/callback/azure-ad`
5. Click "Register"
6. Copy the "Application (client) ID"

---

#### AZURE_AD_CLIENT_SECRET

**Description**: Azure AD client secret

**Required**: Only if using Azure AD authentication (must be paired with AZURE_AD_CLIENT_ID)

**Format**: Random string

**Example**:

```bash
AZURE_AD_CLIENT_SECRET=abc123~DEF456_ghi789.JKL012
```

**How to Get**:

1. In your Azure AD app registration
2. Go to Certificates & secrets
3. Click "New client secret"
4. Add description and choose expiration
5. Click "Add"
6. Copy the secret value immediately (it won't be shown again)

**Security Notes**:

- ⚠️ Never commit this to version control
- ⚠️ Keep this secret secure
- ⚠️ Note the expiration date and rotate before it expires

---

#### AZURE_AD_TENANT_ID

**Description**: Azure AD tenant (directory) ID

**Required**: Only if using Azure AD authentication (must be paired with AZURE_AD_CLIENT_ID)

**Format**: UUID (GUID)

**Example**:

```bash
AZURE_AD_TENANT_ID=87654321-4321-4321-4321-cba987654321
```

**How to Get**:

1. In Azure Portal
2. Navigate to Azure Active Directory
3. Go to Overview
4. Copy the "Tenant ID" (also called "Directory ID")

**Notes**:

- Use `common` for multi-tenant apps
- Use `organizations` for any organizational account
- Use `consumers` for personal Microsoft accounts only
- Use specific tenant ID for single-tenant apps

---

## Optional Variables

### Email Configuration

If you're using email verification or password reset:

#### EMAIL_SERVER_HOST

**Description**: SMTP server hostname

**Example**:

```bash
EMAIL_SERVER_HOST=smtp.gmail.com
```

---

#### EMAIL_SERVER_PORT

**Description**: SMTP server port

**Example**:

```bash
EMAIL_SERVER_PORT=587
```

---

#### EMAIL_SERVER_USER

**Description**: SMTP username

**Example**:

```bash
EMAIL_SERVER_USER=your-email@gmail.com
```

---

#### EMAIL_SERVER_PASSWORD

**Description**: SMTP password or app password

**Example**:

```bash
EMAIL_SERVER_PASSWORD=your-app-password
```

**Security Notes**:

- ⚠️ Never commit this to version control
- Use app-specific passwords when available

---

#### EMAIL_FROM

**Description**: Email address to send from

**Example**:

```bash
EMAIL_FROM=noreply@your-domain.com
```

---

## Environment-Specific Configuration

### Development (.env.local)

```bash
# Core
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret-key-change-in-production

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/myapp_dev?schema=public"

# OAuth (optional for development)
GOOGLE_CLIENT_ID=your-dev-google-client-id
GOOGLE_CLIENT_SECRET=your-dev-google-client-secret

GITHUB_CLIENT_ID=your-dev-github-client-id
GITHUB_CLIENT_SECRET=your-dev-github-client-secret

AZURE_AD_CLIENT_ID=your-dev-azure-client-id
AZURE_AD_CLIENT_SECRET=your-dev-azure-client-secret
AZURE_AD_TENANT_ID=your-dev-azure-tenant-id
```

---

### Staging

```bash
# Core
NEXTAUTH_URL=https://staging.your-domain.com
NEXTAUTH_SECRET=staging-secret-key-different-from-production

# Database
DATABASE_URL="postgresql://user:password@staging-db.example.com:5432/myapp_staging?schema=public&sslmode=require"

# OAuth
GOOGLE_CLIENT_ID=your-staging-google-client-id
GOOGLE_CLIENT_SECRET=your-staging-google-client-secret

GITHUB_CLIENT_ID=your-staging-github-client-id
GITHUB_CLIENT_SECRET=your-staging-github-client-secret

AZURE_AD_CLIENT_ID=your-staging-azure-client-id
AZURE_AD_CLIENT_SECRET=your-staging-azure-client-secret
AZURE_AD_TENANT_ID=your-staging-azure-tenant-id
```

---

### Production

```bash
# Core
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=production-secret-key-very-secure

# Database
DATABASE_URL="postgresql://user:password@prod-db.example.com:5432/myapp_prod?schema=public&sslmode=require&connection_limit=10"

# OAuth
GOOGLE_CLIENT_ID=your-prod-google-client-id
GOOGLE_CLIENT_SECRET=your-prod-google-client-secret

GITHUB_CLIENT_ID=your-prod-github-client-id
GITHUB_CLIENT_SECRET=your-prod-github-client-secret

AZURE_AD_CLIENT_ID=your-prod-azure-client-id
AZURE_AD_CLIENT_SECRET=your-prod-azure-client-secret
AZURE_AD_TENANT_ID=your-prod-azure-tenant-id
```

---

## Setting Environment Variables

### Local Development

Create `.env.local` file in project root:

```bash
# .env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
DATABASE_URL="postgresql://..."
# ... other variables
```

**Notes**:

- `.env.local` is gitignored by default
- Never commit this file
- Copy `.env.example` as a template

---

### Vercel

#### Via Dashboard

1. Go to your project in Vercel dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable:
   - Key: Variable name (e.g., `NEXTAUTH_SECRET`)
   - Value: Variable value
   - Environment: Select Production, Preview, and/or Development

#### Via CLI

```bash
# Add variable
vercel env add NEXTAUTH_SECRET

# List variables
vercel env ls

# Pull variables to local
vercel env pull .env.local
```

---

### Other Platforms

#### Netlify

```bash
# Via CLI
netlify env:set NEXTAUTH_SECRET "your-secret-key"

# Via dashboard
# Settings → Build & deploy → Environment → Environment variables
```

#### Railway

```bash
# Via CLI
railway variables set NEXTAUTH_SECRET="your-secret-key"

# Via dashboard
# Project → Variables
```

#### Docker

```bash
# Via docker-compose.yml
environment:
  - NEXTAUTH_URL=http://localhost:3000
  - NEXTAUTH_SECRET=your-secret-key

# Via .env file
docker-compose --env-file .env.production up
```

---

## Validation

### Automatic Validation

The system includes automatic validation in `lib/env-validation.ts`:

```typescript
import { validateAuthEnv } from "@/lib/env-validation";

// Call during initialization
validateAuthEnv();
```

This will log warnings for:

- Missing required variables
- Incomplete OAuth configurations
- Mismatched variable pairs

---

### Manual Validation

```bash
# Check if variables are set
node -e "
const required = ['NEXTAUTH_URL', 'NEXTAUTH_SECRET', 'DATABASE_URL'];
const missing = required.filter(v => !process.env[v]);
if (missing.length) {
  console.error('Missing:', missing);
  process.exit(1);
}
console.log('✓ All required variables set');
"
```

---

## Security Best Practices

### Do's

✅ Use strong, random secrets (minimum 32 characters)
✅ Use different secrets for different environments
✅ Rotate secrets periodically
✅ Use environment-specific OAuth credentials
✅ Enable SSL for database connections in production
✅ Use connection pooling for better performance
✅ Keep secrets in secure secret management systems

### Don'ts

❌ Never commit secrets to version control
❌ Never share secrets in plain text (email, chat, etc.)
❌ Never use the same secret across environments
❌ Never log secret values
❌ Never expose secrets in client-side code
❌ Never use weak or predictable secrets

---

## Troubleshooting

### Missing Variables

**Symptom**: Application fails to start or authentication doesn't work

**Solution**: Check all required variables are set

```bash
# List all environment variables
printenv | grep -E "NEXTAUTH|DATABASE|GOOGLE|GITHUB|AZURE"
```

---

### Wrong NEXTAUTH_URL

**Symptom**: OAuth redirects fail or session issues

**Solution**: Ensure NEXTAUTH_URL matches your domain exactly

```bash
# Should match your actual domain
NEXTAUTH_URL=https://your-actual-domain.com  # ✅ Correct
NEXTAUTH_URL=https://your-actual-domain.com/ # ❌ Wrong (trailing slash)
NEXTAUTH_URL=http://your-actual-domain.com   # ❌ Wrong (http in production)
```

---

### OAuth Redirect URI Mismatch

**Symptom**: OAuth providers show "redirect_uri_mismatch" error

**Solution**: Ensure redirect URIs in provider console match your NEXTAUTH_URL

```bash
# Your NEXTAUTH_URL
NEXTAUTH_URL=https://your-domain.com

# Redirect URIs in provider console should be:
# Google: https://your-domain.com/api/auth/callback/google
# GitHub: https://your-domain.com/api/auth/callback/github
# Azure: https://your-domain.com/api/auth/callback/azure-ad
```

---

## Example .env.example

Create this file in your project root as a template:

```bash
# .env.example
# Copy this file to .env.local and fill in your values

# Core Authentication (Required)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-secret-key-here

# Database (Required)
DATABASE_URL="postgresql://user:password@localhost:5432/database?schema=public"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# GitHub OAuth (Optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Azure AD OAuth (Optional)
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_TENANT_ID=

# Email (Optional)
EMAIL_SERVER_HOST=
EMAIL_SERVER_PORT=
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_FROM=
```

---

**Last Updated**: [Current Date]
**Version**: 1.0.0
