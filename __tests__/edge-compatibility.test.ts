/**
 * Edge Runtime Compatibility Tests
 *
 * These tests verify that auth.config.ts and middleware.ts are compatible
 * with Vercel Edge Runtime by ensuring:
 * 1. No Node.js-specific imports in auth.config.ts
 * 2. No database imports in middleware.ts
 * 3. Middleware completes quickly (performance)
 *
 * Requirements: 6.1, 6.2, 10.1
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Edge Runtime Compatibility", () => {
  describe("auth.config.ts edge compatibility", () => {
    it("should not import Node.js-specific modules", () => {
      const authConfigPath = path.join(process.cwd(), "auth.config.ts");
      const content = fs.readFileSync(authConfigPath, "utf-8");

      // List of Node.js-specific imports that are not edge-compatible
      const nodeSpecificImports = [
        "fs",
        "path",
        "crypto",
        "stream",
        "buffer",
        "util",
        "os",
        "child_process",
        "cluster",
        "dgram",
        "dns",
        "http",
        "https",
        "net",
        "tls",
        "zlib",
        "bcryptjs",
        "bcrypt",
        "@prisma/client",
        "prisma",
        "@auth/prisma-adapter",
      ];

      // Check for Node.js-specific imports
      const foundNodeImports = nodeSpecificImports.filter((module) => {
        const importRegex = new RegExp(
          `import\\s+.*?from\\s+['"]${module}['"]`,
          "g"
        );
        const requireRegex = new RegExp(`require\\(['"]${module}['"]\\)`, "g");
        return importRegex.test(content) || requireRegex.test(content);
      });

      expect(foundNodeImports).toEqual([]);
      expect(foundNodeImports.length).toBe(0);
    });

    it("should not import database-related modules", () => {
      const authConfigPath = path.join(process.cwd(), "auth.config.ts");
      const content = fs.readFileSync(authConfigPath, "utf-8");

      // Database-related imports that should not be in auth.config.ts
      const databaseImports = [
        "@/lib/db",
        "./lib/db",
        "@/data/user",
        "./data/user",
        "@prisma/client",
        "@auth/prisma-adapter",
      ];

      const foundDbImports = databaseImports.filter((module) => {
        const importRegex = new RegExp(
          `import\\s+.*?from\\s+['"]${module}['"]`,
          "g"
        );
        return importRegex.test(content);
      });

      expect(foundDbImports).toEqual([]);
    });

    it("should only import edge-compatible modules", () => {
      const authConfigPath = path.join(process.cwd(), "auth.config.ts");
      const content = fs.readFileSync(authConfigPath, "utf-8");

      // Extract all import statements
      const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
      const imports: string[] = [];
      let match;

      while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }

      // List of allowed edge-compatible imports
      const allowedImports = [
        "next-auth",
        "next-auth/providers/github",
        "next-auth/providers/google",
        "next-auth/providers/azure-ad",
        "@/lib/env-validation",
        "./lib/env-validation",
      ];

      // Check that all imports are in the allowed list
      const disallowedImports = imports.filter(
        (imp) =>
          !allowedImports.some((allowed) => imp.startsWith(allowed)) &&
          !imp.startsWith("next-auth")
      );

      expect(disallowedImports).toEqual([]);
    });

    it("should not contain database queries", () => {
      const authConfigPath = path.join(process.cwd(), "auth.config.ts");
      const content = fs.readFileSync(authConfigPath, "utf-8");

      // Check for database query patterns
      const dbQueryPatterns = [
        /db\./g,
        /prisma\./g,
        /\.findUnique/g,
        /\.findMany/g,
        /\.create/g,
        /\.update/g,
        /\.delete/g,
        /\.upsert/g,
      ];

      const foundQueries = dbQueryPatterns.filter((pattern) =>
        pattern.test(content)
      );

      expect(foundQueries.length).toBe(0);
    });

    it("should export a valid NextAuthConfig object", () => {
      const authConfigPath = path.join(process.cwd(), "auth.config.ts");
      const content = fs.readFileSync(authConfigPath, "utf-8");

      // Check for proper export
      expect(content).toMatch(/export\s+default/);
      expect(content).toMatch(/satisfies\s+NextAuthConfig/);
    });
  });

  describe("middleware.ts edge compatibility", () => {
    it("should not import database modules", () => {
      const middlewarePath = path.join(process.cwd(), "middleware.ts");
      const content = fs.readFileSync(middlewarePath, "utf-8");

      // Database-related imports that should not be in middleware
      const databaseImports = [
        "@/lib/db",
        "./lib/db",
        "@/data/user",
        "./data/user",
        "@prisma/client",
        "prisma",
      ];

      const foundDbImports = databaseImports.filter((module) => {
        const importRegex = new RegExp(
          `import\\s+.*?from\\s+['"]${module}['"]`,
          "g"
        );
        return importRegex.test(content);
      });

      expect(foundDbImports).toEqual([]);
    });

    it("should not import Node.js-specific modules", () => {
      const middlewarePath = path.join(process.cwd(), "middleware.ts");
      const content = fs.readFileSync(middlewarePath, "utf-8");

      // Node.js-specific imports
      const nodeSpecificImports = [
        "fs",
        "path",
        "crypto",
        "bcryptjs",
        "bcrypt",
      ];

      const foundNodeImports = nodeSpecificImports.filter((module) => {
        const importRegex = new RegExp(
          `import\\s+.*?from\\s+['"]${module}['"]`,
          "g"
        );
        return importRegex.test(content);
      });

      expect(foundNodeImports).toEqual([]);
    });

    it("should not contain database queries", () => {
      const middlewarePath = path.join(process.cwd(), "middleware.ts");
      const content = fs.readFileSync(middlewarePath, "utf-8");

      // Check for database query patterns
      const dbQueryPatterns = [
        /db\./g,
        /prisma\./g,
        /\.findUnique/g,
        /\.findMany/g,
        /\.create/g,
        /\.update/g,
        /\.delete/g,
      ];

      const foundQueries = dbQueryPatterns.filter((pattern) =>
        pattern.test(content)
      );

      expect(foundQueries.length).toBe(0);
    });

    it("should import auth from auth.config.ts (edge-compatible)", () => {
      const middlewarePath = path.join(process.cwd(), "middleware.ts");
      const content = fs.readFileSync(middlewarePath, "utf-8");

      // Middleware should import from auth.config, not auth.ts
      expect(content).toMatch(/from\s+['"]@\/auth\.config['"]/);
    });

    it("should use proper URL construction for redirects", () => {
      const middlewarePath = path.join(process.cwd(), "middleware.ts");
      const content = fs.readFileSync(middlewarePath, "utf-8");

      // Check for proper URL construction using new URL()
      const urlConstructorPattern = /new\s+URL\(/g;
      const matches = content.match(urlConstructorPattern);

      // Should have multiple URL constructions for redirects
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThan(0);
    });

    it("should have proper matcher configuration", () => {
      const middlewarePath = path.join(process.cwd(), "middleware.ts");
      const content = fs.readFileSync(middlewarePath, "utf-8");

      // Check for matcher export
      expect(content).toMatch(/export\s+const\s+config/);
      expect(content).toMatch(/matcher:/);
    });
  });

  describe("middleware performance", () => {
    it("should have minimal logic for fast execution", () => {
      const middlewarePath = path.join(process.cwd(), "middleware.ts");
      const content = fs.readFileSync(middlewarePath, "utf-8");

      // Count the number of lines in the middleware function
      // (excluding comments and empty lines)
      const lines = content
        .split("\n")
        .filter(
          (line) =>
            line.trim() !== "" &&
            !line.trim().startsWith("//") &&
            !line.trim().startsWith("/*") &&
            !line.trim().startsWith("*")
        );

      // Middleware should be concise (less than 200 lines for fast execution)
      expect(lines.length).toBeLessThan(200);
    });

    it("should not have complex computations", () => {
      const middlewarePath = path.join(process.cwd(), "middleware.ts");
      const content = fs.readFileSync(middlewarePath, "utf-8");

      // Check for patterns that indicate complex computations
      const complexPatterns = [
        /for\s*\(/g, // for loops
        /while\s*\(/g, // while loops
        /\.map\(/g, // array operations
        /\.filter\(/g,
        /\.reduce\(/g,
        /await\s+(?!.*Response\.redirect)/g, // async operations (except redirects)
      ];

      // Count complex patterns (should be minimal)
      const complexityCount = complexPatterns.reduce((count, pattern) => {
        const matches = content.match(pattern);
        return count + (matches ? matches.length : 0);
      }, 0);

      // Should have minimal complexity (less than 5 complex operations)
      expect(complexityCount).toBeLessThan(5);
    });

    it("should only use synchronous operations from JWT token", () => {
      const middlewarePath = path.join(process.cwd(), "middleware.ts");
      const content = fs.readFileSync(middlewarePath, "utf-8");

      // Extract the middleware function body
      const middlewareFunctionMatch = content.match(
        /export\s+default\s+auth\(\(req\)\s*=>\s*\{([\s\S]*?)\}\);/
      );

      if (middlewareFunctionMatch) {
        const functionBody = middlewareFunctionMatch[1];

        // Should not have await statements (except for Response.redirect which is sync)
        const awaitPattern = /await\s+(?!Response\.redirect)/g;
        const awaitMatches = functionBody.match(awaitPattern);

        expect(awaitMatches).toBeNull();
      }
    });
  });

  describe("env-validation.ts edge compatibility", () => {
    it("should not import Node.js-specific modules", () => {
      const envValidationPath = path.join(
        process.cwd(),
        "lib/env-validation.ts"
      );
      const content = fs.readFileSync(envValidationPath, "utf-8");

      // Node.js-specific imports that are not edge-compatible
      const nodeSpecificImports = [
        "fs",
        "path",
        "crypto",
        "bcryptjs",
        "bcrypt",
        "@prisma/client",
      ];

      const foundNodeImports = nodeSpecificImports.filter((module) => {
        const importRegex = new RegExp(
          `import\\s+.*?from\\s+['"]${module}['"]`,
          "g"
        );
        return importRegex.test(content);
      });

      expect(foundNodeImports).toEqual([]);
    });

    it("should only use edge-compatible APIs", () => {
      const envValidationPath = path.join(
        process.cwd(),
        "lib/env-validation.ts"
      );
      const content = fs.readFileSync(envValidationPath, "utf-8");

      // Check that it only uses process.env and console (edge-compatible)
      // Should not use file system, crypto, or other Node.js APIs
      const edgeIncompatibleAPIs = [/fs\./g, /require\(/g, /module\.exports/g];

      const foundIncompatibleAPIs = edgeIncompatibleAPIs.filter((pattern) =>
        pattern.test(content)
      );

      expect(foundIncompatibleAPIs.length).toBe(0);
    });
  });

  describe("overall edge runtime validation", () => {
    it("should have proper separation between edge and Node.js code", () => {
      const authConfigPath = path.join(process.cwd(), "auth.config.ts");
      const authPath = path.join(process.cwd(), "auth.ts");
      const middlewarePath = path.join(process.cwd(), "middleware.ts");

      const authConfigContent = fs.readFileSync(authConfigPath, "utf-8");
      const authContent = fs.readFileSync(authPath, "utf-8");
      const middlewareContent = fs.readFileSync(middlewarePath, "utf-8");

      // auth.config.ts should not have Prisma imports (check actual imports, not comments)
      expect(authConfigContent).not.toMatch(/import.*from.*["'].*prisma/i);
      expect(authConfigContent).not.toMatch(/import.*PrismaAdapter/);

      // auth.ts should have Prisma (Node.js runtime)
      expect(authContent).toMatch(/prisma/i);
      expect(authContent).toMatch(/PrismaAdapter/);

      // middleware should import from auth.config, not auth.ts
      expect(middlewareContent).toMatch(/from\s+['"]@\/auth\.config['"]/);
      expect(middlewareContent).not.toMatch(/from\s+['"]@\/auth['"]/);
    });

    it("should have edge-compatible comment documentation", () => {
      const authConfigPath = path.join(process.cwd(), "auth.config.ts");
      const content = fs.readFileSync(authConfigPath, "utf-8");

      // Should have documentation indicating edge compatibility
      expect(content).toMatch(/edge/i);
    });
  });
});
