# Quick Start Guide - CSIR Stage-Gate Platform

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret for NextAuth.js
- `NEXTAUTH_URL` - Your application URL
- OAuth credentials (optional): Google, GitHub, Azure AD

### 3. Set Up Database

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the modernized landing page!

## Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Specific Test File

```bash
npm test __tests__/auth-integration.test.ts
```

## Building for Production

### Build the Application

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## Key Features

### Landing Page

- Modern design with animated backgrounds
- Feature showcase with 6 key capabilities
- Clear CTAs for sign-in and registration
- Fully responsive across all devices

### Authentication

- Email/password authentication
- OAuth (Google, GitHub, Microsoft)
- Password reset functionality
- Email verification
- Role-based access control

### Project Management

- Stage-gate project tracking
- Gate reviews with multi-reviewer support
- Document management with SharePoint integration
- Budget tracking and allocation
- Red flag management
- Comments and collaboration

### Admin Features

- User management
- Custom role creation
- Cluster management
- Analytics dashboard
- Budget allocation

## Project Structure

```
stage-gate/
├── app/                    # Next.js app directory
│   ├── (protected)/       # Protected routes
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── auth/             # Auth components
│   ├── admin/            # Admin components
│   ├── projects/         # Project components
│   └── ui/               # UI components
├── actions/              # Server actions
├── lib/                  # Utilities and helpers
├── prisma/               # Database schema and migrations
├── __tests__/            # Test files
└── .kiro/specs/          # Feature specifications
```

## Common Commands

| Command               | Description              |
| --------------------- | ------------------------ |
| `npm run dev`         | Start development server |
| `npm run build`       | Build for production     |
| `npm start`           | Start production server  |
| `npm test`            | Run test suite           |
| `npm run lint`        | Run ESLint               |
| `npx prisma studio`   | Open Prisma Studio       |
| `npx prisma generate` | Generate Prisma Client   |
| `npx prisma db push`  | Push schema to database  |

## Troubleshooting

### Tests Timing Out

- Tests are configured with 10-second timeouts
- Check `vitest.config.ts` for timeout settings
- Ensure test mocks are properly configured in `__tests__/setup.ts`

### Database Connection Issues

- Verify `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Run `npx prisma generate` to regenerate client

### OAuth Not Working

- Verify OAuth credentials in `.env`
- Check callback URLs in OAuth provider settings
- Ensure `NEXTAUTH_URL` matches your domain

### Build Errors

- Run `npm install` to ensure all dependencies are installed
- Check for TypeScript errors with `npm run type-check`
- Clear `.next` folder and rebuild

## Support

For issues or questions:

1. Check the documentation in `.kiro/specs/`
2. Review test files for usage examples
3. Check the implementation summary files

## Version

Current Version: 2.0.0
Last Updated: November 25, 2024

---

**Ready to build amazing R&D projects!** 🚀
