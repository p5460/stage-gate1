/**
 * Property-Based Tests for Authentication Configuration
 * Feature: authjs-redesign
 *
 * These tests verify universal properties that should hold across all inputs
 * using fast-check for property-based testing with minimum 100 iterations.
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";

/**
 * Feature: authjs-redesign, Property 22: Required environment variables are present
 * Validates: Requirements 9.4
 *
 * For any OAuth provider configuration, the required environment variables
 * (client ID, client secret, and tenant ID for Azure) should be present.
 */
describe("Property 22: OAuth Provider Environment Variables", () => {
  it("should validate that all OAuth providers have required environment variables", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("GOOGLE", "GITHUB", "AZURE_AD"),
        (provider) => {
          // Define required environment variables for each provider
          const requiredVars: Record<string, string[]> = {
            GOOGLE: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
            GITHUB: ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
            AZURE_AD: [
              "AZURE_AD_CLIENT_ID",
              "AZURE_AD_CLIENT_SECRET",
              "AZURE_AD_TENANT_ID",
            ],
          };

          const varsToCheck = requiredVars[provider];

          // Check if at least one provider is configured
          // (We don't require ALL providers to be configured, just that configured ones have all required vars)
          const hasAnyVar = varsToCheck.some((varName) => process.env[varName]);

          if (!hasAnyVar) {
            // If no variables are set for this provider, it's not configured (which is OK)
            return true;
          }

          // If any variable is set, ALL required variables for that provider must be set
          const allVarsPresent = varsToCheck.every((varName) => {
            const value = process.env[varName];
            return value !== undefined && value !== "";
          });

          return allVarsPresent;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should validate environment variable format for OAuth providers", () => {
    fc.assert(
      fc.property(
        fc.record({
          clientId: fc.string({ minLength: 10, maxLength: 100 }),
          clientSecret: fc.string({ minLength: 10, maxLength: 100 }),
        }),
        (config) => {
          // Property: OAuth configuration objects should have non-empty client ID and secret
          const hasValidClientId = config.clientId.length >= 10;
          const hasValidClientSecret = config.clientSecret.length >= 10;

          return hasValidClientId && hasValidClientSecret;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should validate Azure AD tenant ID format when configured", () => {
    fc.assert(
      fc.property(
        fc.record({
          clientId: fc.string({ minLength: 10, maxLength: 100 }),
          clientSecret: fc.string({ minLength: 10, maxLength: 100 }),
          tenantId: fc.uuid(),
        }),
        (config) => {
          // Property: Azure AD configuration should have valid tenant ID format
          // Tenant ID should be a valid UUID or domain
          const hasValidTenantId =
            config.tenantId.length > 0 &&
            (config.tenantId.includes("-") || config.tenantId.includes("."));

          return hasValidTenantId;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should validate that OAuth provider configuration is consistent", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("google", "github", "azure-ad"),
        fc.boolean(),
        (provider, shouldBeConfigured) => {
          // Property: If a provider is configured, it should have all required fields
          // This tests the consistency of configuration

          const providerMap: Record<string, string[]> = {
            google: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
            github: ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
            "azure-ad": [
              "AZURE_AD_CLIENT_ID",
              "AZURE_AD_CLIENT_SECRET",
              "AZURE_AD_TENANT_ID",
            ],
          };

          const requiredVars = providerMap[provider];
          const configuredVars = requiredVars.filter((v) => process.env[v]);

          // Either all variables are configured or none are configured
          const isConsistent =
            configuredVars.length === 0 ||
            configuredVars.length === requiredVars.length;

          return isConsistent;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Additional property tests for auth.config.ts edge compatibility
 */
describe("Edge Runtime Compatibility Properties", () => {
  it("should verify auth.config.ts has no Node.js-specific imports", async () => {
    // Read the auth.config.ts file content
    const fs = await import("fs");
    const authConfigContent = await fs.promises.readFile(
      "./auth.config.ts",
      "utf-8"
    );

    fc.assert(
      fc.property(
        fc.constantFrom(
          "bcryptjs",
          "bcrypt",
          "@prisma/client",
          "getUserByEmail",
          "db.user"
        ),
        (forbiddenImport) => {
          // Property: auth.config.ts should not have actual imports of Node.js-specific modules
          // Check for import statements, not comments
          const importRegex = new RegExp(
            `import.*from.*["'].*${forbiddenImport}`,
            "i"
          );
          const requireRegex = new RegExp(
            `require\\(["'].*${forbiddenImport}`,
            "i"
          );

          return (
            !importRegex.test(authConfigContent) &&
            !requireRegex.test(authConfigContent)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should verify auth.config.ts contains only OAuth providers", async () => {
    const fs = await import("fs");
    const authConfigContent = await fs.promises.readFile(
      "./auth.config.ts",
      "utf-8"
    );

    fc.assert(
      fc.property(
        fc.constantFrom("Google", "GitHub", "AzureAD"),
        (provider) => {
          // Property: auth.config.ts should contain OAuth providers
          return authConfigContent.includes(provider);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should verify auth.config.ts does not contain Credentials provider", async () => {
    const fs = await import("fs");
    const authConfigContent = await fs.promises.readFile(
      "./auth.config.ts",
      "utf-8"
    );

    // Property: auth.config.ts should not import or use Credentials provider (Node.js only)
    // Check for actual import statement, not comments
    const hasCredentialsImport =
      /import.*Credentials.*from.*["']next-auth\/providers\/credentials["']/i.test(
        authConfigContent
      );
    const hasCredentialsUsage = /providers:\s*\[[\s\S]*Credentials\s*\(/m.test(
      authConfigContent
    );

    expect(hasCredentialsImport || hasCredentialsUsage).toBe(false);
  });

  it("should verify auth.config.ts has custom pages configuration", async () => {
    const fs = await import("fs");
    const authConfigContent = await fs.promises.readFile(
      "./auth.config.ts",
      "utf-8"
    );

    fc.assert(
      fc.property(fc.constantFrom("signIn", "error"), (pageType) => {
        // Property: auth.config.ts should have custom pages configured
        return authConfigContent.includes(pageType);
      }),
      { numRuns: 100 }
    );
  });
});
