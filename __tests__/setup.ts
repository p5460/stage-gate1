import { vi, beforeAll, afterAll, afterEach } from "vitest";

// Mock Prisma Client
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    account: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    verificationToken: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    passwordResetToken: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    twoFactorToken: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    twoFactorConfirmation: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    project: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    gateReview: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    comment: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    redFlag: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    customRole: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    cluster: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock email service
vi.mock("@/lib/mail", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  sendTwoFactorTokenEmail: vi.fn().mockResolvedValue(undefined),
}));

// Mock SharePoint service
vi.mock("@/lib/sharepoint", () => ({
  uploadToSharePoint: vi
    .fn()
    .mockResolvedValue({ success: true, url: "https://sharepoint.test/file" }),
  deleteFromSharePoint: vi.fn().mockResolvedValue({ success: true }),
}));

// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = "file:./test.db";
  process.env.NEXTAUTH_SECRET = "test-secret";
  process.env.NEXTAUTH_URL = "http://localhost:3000";
});

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Global test teardown
afterAll(() => {
  vi.restoreAllMocks();
});
