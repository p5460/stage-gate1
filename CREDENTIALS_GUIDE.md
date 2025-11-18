# CSIR Stage-Gate Platform - Credentials Guide

## Test User Credentials

All test users use the password: **`password123`**

### Administrator

- **Email**: admin@csir.co.za
- **Role**: ADMIN
- **Access**: Full system access, user management, analytics, budget management

### Gatekeepers

- **Email**: gatekeeper1@csir.co.za
- **Role**: GATEKEEPER
- **Access**: Review management, user management, project oversight

- **Email**: gatekeeper2@csir.co.za
- **Role**: GATEKEEPER
- **Access**: Review management, user management, project oversight

### Reviewers

- **Email**: reviewer1@csir.co.za
- **Role**: REVIEWER
- **Access**: Conduct reviews, view assigned projects

- **Email**: reviewer2@csir.co.za
- **Role**: REVIEWER
- **Access**: Conduct reviews, view assigned projects

- **Email**: reviewer3@csir.co.za
- **Role**: REVIEWER
- **Access**: Conduct reviews, view assigned projects

- **Email**: reviewer4@csir.co.za
- **Role**: REVIEWER
- **Access**: Conduct reviews, view assigned projects

### Project Leads

- **Email**: lead1@csir.co.za
- **Role**: PROJECT_LEAD
- **Access**: Manage own projects, submit for reviews

- **Email**: lead2@csir.co.za
- **Role**: PROJECT_LEAD
- **Access**: Manage own projects, submit for reviews

## Environment Variables

### Required Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/stagegate"

# NextAuth Configuration
AUTH_SECRET="your-secret-key-here"
# Generate with: openssl rand -base64 32

NEXTAUTH_URL="http://localhost:3000"

# Email Service (Resend)
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="noreply@yourdomain.com"

# Optional: Email Testing
# Use Resend test mode or configure SMTP
```

### Generating AUTH_SECRET

Run this command to generate a secure secret:

```bash
# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# On Linux/Mac
openssl rand -base64 32
```

## Database Setup

### PostgreSQL Credentials

1. **Install PostgreSQL** (if not already installed)
2. **Create Database**:

   ```sql
   CREATE DATABASE stagegate;
   CREATE USER stagegate_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE stagegate TO stagegate_user;
   ```

3. **Update DATABASE_URL** in `.env`:
   ```
   DATABASE_URL="postgresql://stagegate_user:your_password@localhost:5432/stagegate"
   ```

### Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with test data (includes cleanup of existing test data)
npm run db:seed-full
```

**Note**: The seed script automatically cleans up existing test data before seeding, so you can run it multiple times safely.

## Email Service Setup (Resend)

### Getting Resend API Key

1. **Sign up** at [resend.com](https://resend.com)
2. **Create API Key** in dashboard
3. **Add to .env**:
   ```
   RESEND_API_KEY="re_your_api_key_here"
   EMAIL_FROM="noreply@yourdomain.com"
   ```

### Email Testing

For development, Resend provides:

- Test mode for free
- Email logs in dashboard
- No domain verification needed for testing

## Quick Start

### 1. Clone and Install

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy and edit .env file
cp .env.example .env  # If example exists
# Or create new .env with required variables
```

### 3. Setup Database

```bash
npx prisma generate
npx prisma db push
npm run db:seed-full
```

### 4. Start Development Server

```bash
npm run dev
```

### 5. Login

Navigate to `http://localhost:3000` and login with any test credentials above.

## Security Notes

### Production Deployment

⚠️ **Important**: Before deploying to production:

1. **Change all default passwords**
2. **Generate new AUTH_SECRET**
3. **Use strong database passwords**
4. **Configure proper email domain**
5. **Enable HTTPS**
6. **Set secure NEXTAUTH_URL**
7. **Review and update CORS settings**

### Password Requirements

For production users:

- Minimum 8 characters
- Mix of uppercase and lowercase
- Include numbers and special characters
- Regular password rotation policy

## Troubleshooting

### Cannot Login

- Verify database is running
- Check DATABASE_URL is correct
- Ensure seed data was loaded: `npm run db:seed-full`
- Clear browser cache/cookies

### Email Not Sending

- Verify RESEND_API_KEY is valid
- Check EMAIL_FROM is configured
- Review Resend dashboard for logs
- Ensure email service is not in test mode (for production)

### Database Connection Issues

- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists
- Verify user permissions

## Additional Resources

- **Prisma Studio**: `npm run db:studio` - Visual database browser
- **Database Migrations**: `npm run db:migrate` - Apply schema changes
- **Seed Data**: `npm run db:seed` - Add test data

## Support

For issues or questions:

1. Check error logs in console
2. Review Prisma Studio for data issues
3. Verify all environment variables are set
4. Ensure all dependencies are installed

---

**Last Updated**: November 2025
**Version**: 1.0.0
