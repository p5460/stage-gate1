/**
 * Authentication Flow Verification Tests
 *
 * This test suite verifies the authentication configuration and flows
 * for the Vercel Edge Middleware fix.
 *
 * Requirements tested: 2.1, 2.2, 2.4, 2.5
 */

import { describe, it, expect } from "@jest/globals";

describe("Authentication Configuration Verification", () => {
  describe("auth.config.ts - Edge Runtime Compatibility", () => {
    it("should not import Node.js-specific modules", async () => {
      const authConfigContent = await import("fs").then((fs) =>
        fs.promises.readFile("./auth.config.ts", "utf-8")
      );

      // Verify no bcryptjs import
      expect(authConfigContent).not.toContain("bcryptjs");
      expect(authConfigContent).not.toContain("bcrypt");

      // Verify no Prisma imports
      expect(authConfigContent).not.toContain("@prisma/client");
      expect(authConfigContent).not.toContain("getUserByEmail");

      // Verify no database queries
      expect(authConfigContent).not.toContain("db.user");
      expect(authConfigContent).not.toContain("prisma");
    });

    it("should include OAuth providers only", async () => {
      const authConfigContent = await import("fs").then((fs) =>
        fs.promises.readFile("./auth.config.ts", "utf-8")
      );

      // Verify OAuth providers present
      expect(authConfigContent).toContain("Google");
      expect(authConfigContent).toContain("GitHub");
      expect(authConfigContent).toContain("AzureAD");

      // Verify no Credentials provider
      expect(authConfigContent).not.toContain("Credentials");
    });

    it("should have session callback that reads from token only", async () => {
      const authConfigContent = await import("fs").then((fs) =>
        fs.promises.readFile("./auth.config.ts", "utf-8")
      );

      // Verify session callback exists
      expect(authConfigContent).toContain("async session");
      expect(authConfigContent).toContain("token");
      expect(authConfigContent).toContain("session");

      // Verify no database queries in session callback
      expect(authConfigContent).not.toContain("await db");
      expect(authConfigContent).not.toContain("findUnique");
    });

    it("should have JWT callback that passes through token", async () => {
      const authConfigContent = await import("fs").then((fs) =>
        fs.promises.readFile("./auth.config.ts", "utf-8")
      );

      // Verify JWT callback exists
      expect(authConfigContent).toContain("async jwt");

      // Verify it returns token without modifications
      expect(authConfigContent).toContain("return token");
    });
  });

  describe("auth.ts - Node.js Runtime Configuration", () => {
    it("should import base config from auth.config.ts", async () => {
      const authContent = await import("fs").then((fs) =>
        fs.promises.readFile("./auth.ts", "utf-8")
      );

      expect(authContent).toContain("import authConfig from");
      expect(authContent).toContain("@/auth.config");
    });

    it("should include Credentials provider", async () => {
      const authContent = await import("fs").then((fs) =>
        fs.promises.readFile("./auth.ts", "utf-8")
      );

      expect(authContent).toContain("Credentials");
      expect(authContent).toContain("authorize");
    });

    it("should import bcryptjs for password validation", async () => {
      const authContent = await import("fs").then((fs) =>
        fs.promises.readFile("./auth.ts", "utf-8")
      );

      expect(authContent).toContain("bcrypt");
      expect(authContent).toContain("compare");
    });

    it("should import getUserByEmail for database access", async () => {
      const authContent = await import("fs").then((fs) =>
        fs.promises.readFile("./auth.ts", "utf-8")
      );

      expect(authContent).toContain("getUserByEmail");
    });

    it("should have JWT callback with database queries", async () => {
      const authContent = await import("fs").then((fs) =>
        fs.promises.readFile("./auth.ts", "utf-8")
      );

      // Verify JWT callback with DB access
      expect(authContent).toContain("async jwt");
      expect(authContent).toContain("db.user.findUnique");
    });

    it("should have signIn callback with email verification", async () => {
      const authContent = await import("fs").then((fs) =>
        fs.promises.readFile("./auth.ts", "utf-8")
      );

      expect(authContent).toContain("async signIn");
      expect(authContent).toContain("emailVerified");
    });

    it("should spread authConfig into NextAuth configuration", async () => {
      const authContent = await import("fs").then((fs) =>
        fs.promises.readFile("./auth.ts", "utf-8")
      );

      expect(authContent).toContain("...authConfig");
    });
  });

  describe("middleware.ts - Edge Runtime Compatibility", () => {
    it("should import only from auth.config.ts", async () => {
      const middlewareContent = await import("fs").then((fs) =>
        fs.promises.readFile("./middleware.ts", "utf-8")
      );

      // Verify imports from auth.config
      expect(middlewareContent).toContain("import authConfig from");
      expect(middlewareContent).toContain("@/auth.config");

      // Verify no direct imports of Node.js modules
      expect(middlewareContent).not.toContain("bcryptjs");
      expect(middlewareContent).not.toContain("@prisma/client");
    });

    it("should have role-based access control logic", async () => {
      const middlewareContent = await import("fs").then((fs) =>
        fs.promises.readFile("./middleware.ts", "utf-8")
      );

      // Verify role checks exist
      expect(middlewareContent).toContain("userRole");
      expect(middlewareContent).toContain("req.auth.user.role");

      // Verify admin route protection
      expect(middlewareContent).toContain("/admin");
      expect(middlewareContent).toContain("ADMIN");
      expect(middlewareContent).toContain("GATEKEEPER");
    });

    it("should preserve callback URLs in redirects", async () => {
      const middlewareContent = await import("fs").then((fs) =>
        fs.promises.readFile("./middleware.ts", "utf-8")
      );

      expect(middlewareContent).toContain("callbackUrl");
      expect(middlewareContent).toContain("encodeURIComponent");
    });
  });

  describe("Environment Configuration", () => {
    it("should have OAuth provider credentials configured", () => {
      // Check for OAuth environment variables
      const hasGoogleConfig =
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
      const hasGitHubConfig =
        process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET;

      // At least one OAuth provider should be configured
      expect(hasGoogleConfig || hasGitHubConfig).toBe(true);
    });

    it("should have NextAuth secret configured", () => {
      expect(
        process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
      ).toBeDefined();
    });

    it("should have NextAuth URL configured", () => {
      expect(process.env.NEXTAUTH_URL).toBeDefined();
    });
  });
});

describe("Authentication Flow Structure", () => {
  describe("JWT Token Structure", () => {
    it("should include user ID in token", async () => {
      const authContent = await import("fs").then((fs) =>
        fs.promises.readFile("./auth.ts", "utf-8")
      );

      // Verify token includes sub (user ID)
      expect(authContent).toContain("token.sub");
    });

    it("should include role in token", async () => {
      const authContent = await import("fs").then((fs) =>
        fs.promises.readFile("./auth.ts", "utf-8")
      );

      expect(authContent).toContain("token.role");
    });

    it("should include isOAuth flag in token", async () => {
      const authContent = await import("fs").then((fs) =>
        fs.promises.readFile("./auth.ts", "utf-8")
      );

      expect(authContent).toContain("token.isOAuth");
    });
  });

  describe("Session Structure", () => {
    it("should populate session from token", async () => {
      const authConfigContent = await import("fs").then((fs) =>
        fs.promises.readFile("./auth.config.ts", "utf-8")
      );

      // Verify session gets data from token
      expect(authConfigContent).toContain("session.user.id = token.sub");
      expect(authConfigContent).toContain("session.user.role = token.role");
      expect(authConfigContent).toContain("session.user.isOAuth");
    });
  });

  describe("Provider Configuration", () => {
    it("should have OAuth providers in auth.config.ts", async () => {
      const authConfigContent = await import("fs").then((fs) =>
        fs.promises.readFile("./auth.config.ts", "utf-8")
      );

      expect(authConfigContent).toContain("providers: [");
      expect(authConfigContent).toContain("Google({");
      expect(authConfigContent).toContain("GitHub({");
    });

    it("should extend providers in auth.ts", async () => {
      const authContent = await import("fs").then((fs) =>
        fs.promises.readFile("./auth.ts", "utf-8")
      );

      expect(authContent).toContain("...authConfig.providers");
      expect(authContent).toContain("Credentials({");
    });
  });
});

console.log("✅ Authentication configuration verification tests defined");
console.log("📝 Run these tests with: npm test auth-verification.test.ts");
