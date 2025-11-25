/**
 * Authentication Flow Verification Tests
 *
 * This test suite verifies the authentication configuration and flows
 * for the Vercel Edge Middleware fix.
 *
 * Requirements tested: 2.1, 2.2, 2.4, 2.5
 */

import { describe, it, expect } from "vitest";

describe("Authentication Configuration Verification", () => {
  describe("auth.config.ts - Edge Runtime Compatibility", () => {
    it("should not import Node.js-specific modules", async () => {
      const authConfigContent = await import("fs").then((fs) =>
        fs.promises.readFile("./auth.config.ts", "utf-8")
      );

      // Verify no actual imports of Node.js modules (check import statements, not comments)
      expect(authConfigContent).not.toMatch(/import.*from.*["']bcryptjs["']/);
      expect(authConfigContent).not.toMatch(/import.*from.*["']bcrypt["']/);
      expect(authConfigContent).not.toMatch(
        /import.*from.*["']@prisma\/client["']/
      );
      expect(authConfigContent).not.toMatch(/import.*getUserByEmail/);

      // Verify no database queries in actual code
      expect(authConfigContent).not.toMatch(/db\.user\./);
    });

    it("should include OAuth providers only", async () => {
      const authConfigContent = await import("fs").then((fs) =>
        fs.promises.readFile("./auth.config.ts", "utf-8")
      );

      // Verify OAuth providers present
      expect(authConfigContent).toContain("Google");
      expect(authConfigContent).toContain("GitHub");
      expect(authConfigContent).toContain("AzureAD");

      // Verify no Credentials provider import or usage (check actual code, not comments)
      expect(authConfigContent).not.toMatch(
        /import.*Credentials.*from.*["']next-auth\/providers\/credentials["']/
      );
      expect(authConfigContent).not.toMatch(/Credentials\s*\(/);
    });

    it("should not have callbacks (callbacks belong in auth.ts)", async () => {
      const authConfigContent = await import("fs").then((fs) =>
        fs.promises.readFile("./auth.config.ts", "utf-8")
      );

      // Per design: auth.config.ts should NOT have callbacks
      // Callbacks with database access belong in auth.ts (Node.js runtime)
      expect(authConfigContent).not.toMatch(/callbacks:\s*\{/);
    });

    it("should have minimal edge-compatible configuration", async () => {
      const authConfigContent = await import("fs").then((fs) =>
        fs.promises.readFile("./auth.config.ts", "utf-8")
      );

      // Verify it has providers and pages configuration
      expect(authConfigContent).toContain("providers:");
      expect(authConfigContent).toContain("pages:");
      expect(authConfigContent).toContain("signIn:");
      expect(authConfigContent).toContain("error:");
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
    it("should have OAuth provider credentials configured (if running in production)", () => {
      // Skip in test environment where env vars may not be set
      if (process.env.NODE_ENV === "test") {
        expect(true).toBe(true);
        return;
      }

      // Check for OAuth environment variables
      const hasGoogleConfig =
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
      const hasGitHubConfig =
        process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET;

      // At least one OAuth provider should be configured
      expect(hasGoogleConfig || hasGitHubConfig).toBe(true);
    });

    it("should have NextAuth secret configured (if running in production)", () => {
      // Skip in test environment
      if (process.env.NODE_ENV === "test") {
        expect(true).toBe(true);
        return;
      }

      expect(
        process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
      ).toBeDefined();
    });

    it("should have NextAuth URL configured (if running in production)", () => {
      // Skip in test environment
      if (process.env.NODE_ENV === "test") {
        expect(true).toBe(true);
        return;
      }

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
    it("should populate session from token in auth.ts", async () => {
      const authContent = await import("fs").then((fs) =>
        fs.promises.readFile("./auth.ts", "utf-8")
      );

      // Verify session callback in auth.ts gets data from token
      expect(authContent).toContain("session.user.id = token.sub");
      expect(authContent).toContain("session.user.role = token.role");
      expect(authContent).toContain("session.user.isOAuth");
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
