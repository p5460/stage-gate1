import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  validateOAuthEnvironmentVariables,
  validateOAuthEnvironmentVariablesStrict,
  getRequiredOAuthVariables,
  isProviderConfigured,
} from "@/lib/env-validation";

describe("Environment Variable Validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe("validateOAuthEnvironmentVariables", () => {
    it("should return valid when all variables are present", () => {
      // Set all required environment variables
      process.env.GOOGLE_CLIENT_ID = "test-google-id";
      process.env.GOOGLE_CLIENT_SECRET = "test-google-secret";
      process.env.GITHUB_CLIENT_ID = "test-github-id";
      process.env.GITHUB_CLIENT_SECRET = "test-github-secret";
      process.env.AZURE_AD_CLIENT_ID = "test-azure-id";
      process.env.AZURE_AD_CLIENT_SECRET = "test-azure-secret";
      process.env.AZURE_AD_TENANT_ID = "test-tenant-id";

      const result = validateOAuthEnvironmentVariables();

      expect(result.isValid).toBe(true);
      expect(result.missingVariables).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it("should detect missing Google variables", () => {
      // Set only GitHub and Azure AD variables
      process.env.GITHUB_CLIENT_ID = "test-github-id";
      process.env.GITHUB_CLIENT_SECRET = "test-github-secret";
      process.env.AZURE_AD_CLIENT_ID = "test-azure-id";
      process.env.AZURE_AD_CLIENT_SECRET = "test-azure-secret";
      process.env.AZURE_AD_TENANT_ID = "test-tenant-id";

      const result = validateOAuthEnvironmentVariables();

      expect(result.isValid).toBe(false);
      expect(result.missingVariables).toContain("GOOGLE_CLIENT_ID");
      expect(result.missingVariables).toContain("GOOGLE_CLIENT_SECRET");
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("Google");
    });

    it("should detect missing GitHub variables", () => {
      // Set only Google and Azure AD variables
      process.env.GOOGLE_CLIENT_ID = "test-google-id";
      process.env.GOOGLE_CLIENT_SECRET = "test-google-secret";
      process.env.AZURE_AD_CLIENT_ID = "test-azure-id";
      process.env.AZURE_AD_CLIENT_SECRET = "test-azure-secret";
      process.env.AZURE_AD_TENANT_ID = "test-tenant-id";

      const result = validateOAuthEnvironmentVariables();

      expect(result.isValid).toBe(false);
      expect(result.missingVariables).toContain("GITHUB_CLIENT_ID");
      expect(result.missingVariables).toContain("GITHUB_CLIENT_SECRET");
      expect(result.warnings.some((w) => w.includes("GitHub"))).toBe(true);
    });

    it("should detect missing Azure AD variables", () => {
      // Set only Google and GitHub variables
      process.env.GOOGLE_CLIENT_ID = "test-google-id";
      process.env.GOOGLE_CLIENT_SECRET = "test-google-secret";
      process.env.GITHUB_CLIENT_ID = "test-github-id";
      process.env.GITHUB_CLIENT_SECRET = "test-github-secret";

      const result = validateOAuthEnvironmentVariables();

      expect(result.isValid).toBe(false);
      expect(result.missingVariables).toContain("AZURE_AD_CLIENT_ID");
      expect(result.missingVariables).toContain("AZURE_AD_CLIENT_SECRET");
      expect(result.missingVariables).toContain("AZURE_AD_TENANT_ID");
      expect(result.warnings.some((w) => w.includes("Azure AD"))).toBe(true);
    });

    it("should detect all missing variables when none are set", () => {
      // Clear all OAuth-related environment variables
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;
      delete process.env.GITHUB_CLIENT_ID;
      delete process.env.GITHUB_CLIENT_SECRET;
      delete process.env.AZURE_AD_CLIENT_ID;
      delete process.env.AZURE_AD_CLIENT_SECRET;
      delete process.env.AZURE_AD_TENANT_ID;

      const result = validateOAuthEnvironmentVariables();

      expect(result.isValid).toBe(false);
      expect(result.missingVariables).toHaveLength(7);
      expect(result.warnings).toHaveLength(3); // One warning per provider
    });

    it("should provide clear error messages for missing variables", () => {
      // Clear Google variables only
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;
      process.env.GITHUB_CLIENT_ID = "test-github-id";
      process.env.GITHUB_CLIENT_SECRET = "test-github-secret";
      process.env.AZURE_AD_CLIENT_ID = "test-azure-id";
      process.env.AZURE_AD_CLIENT_SECRET = "test-azure-secret";
      process.env.AZURE_AD_TENANT_ID = "test-tenant-id";

      const result = validateOAuthEnvironmentVariables();

      expect(result.warnings[0]).toContain("Google");
      expect(result.warnings[0]).toContain("GOOGLE_CLIENT_ID");
      expect(result.warnings[0]).toContain("GOOGLE_CLIENT_SECRET");
      expect(result.warnings[0]).toContain(
        "missing required environment variables"
      );
    });
  });

  describe("validateOAuthEnvironmentVariablesStrict", () => {
    it("should not throw when all variables are present", () => {
      process.env.GOOGLE_CLIENT_ID = "test-google-id";
      process.env.GOOGLE_CLIENT_SECRET = "test-google-secret";
      process.env.GITHUB_CLIENT_ID = "test-github-id";
      process.env.GITHUB_CLIENT_SECRET = "test-github-secret";
      process.env.AZURE_AD_CLIENT_ID = "test-azure-id";
      process.env.AZURE_AD_CLIENT_SECRET = "test-azure-secret";
      process.env.AZURE_AD_TENANT_ID = "test-tenant-id";

      expect(() => validateOAuthEnvironmentVariablesStrict()).not.toThrow();
    });

    it("should throw when variables are missing", () => {
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;

      expect(() => validateOAuthEnvironmentVariablesStrict()).toThrow();
    });

    it("should throw with clear error message", () => {
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;

      expect(() => validateOAuthEnvironmentVariablesStrict()).toThrow(
        /Missing required OAuth environment variables/
      );
      expect(() => validateOAuthEnvironmentVariablesStrict()).toThrow(/Google/);
      expect(() => validateOAuthEnvironmentVariablesStrict()).toThrow(
        /GOOGLE_CLIENT_ID/
      );
    });
  });

  describe("getRequiredOAuthVariables", () => {
    it("should return all required OAuth variables", () => {
      const variables = getRequiredOAuthVariables();

      expect(variables).toContain("GOOGLE_CLIENT_ID");
      expect(variables).toContain("GOOGLE_CLIENT_SECRET");
      expect(variables).toContain("GITHUB_CLIENT_ID");
      expect(variables).toContain("GITHUB_CLIENT_SECRET");
      expect(variables).toContain("AZURE_AD_CLIENT_ID");
      expect(variables).toContain("AZURE_AD_CLIENT_SECRET");
      expect(variables).toContain("AZURE_AD_TENANT_ID");
      expect(variables).toHaveLength(7);
    });
  });

  describe("isProviderConfigured", () => {
    it("should return true when Google is fully configured", () => {
      process.env.GOOGLE_CLIENT_ID = "test-google-id";
      process.env.GOOGLE_CLIENT_SECRET = "test-google-secret";

      expect(isProviderConfigured("google")).toBe(true);
    });

    it("should return false when Google is missing variables", () => {
      delete process.env.GOOGLE_CLIENT_ID;
      process.env.GOOGLE_CLIENT_SECRET = "test-google-secret";

      expect(isProviderConfigured("google")).toBe(false);
    });

    it("should return true when GitHub is fully configured", () => {
      process.env.GITHUB_CLIENT_ID = "test-github-id";
      process.env.GITHUB_CLIENT_SECRET = "test-github-secret";

      expect(isProviderConfigured("github")).toBe(true);
    });

    it("should return false when GitHub is missing variables", () => {
      process.env.GITHUB_CLIENT_ID = "test-github-id";
      delete process.env.GITHUB_CLIENT_SECRET;

      expect(isProviderConfigured("github")).toBe(false);
    });

    it("should return true when Azure AD is fully configured", () => {
      process.env.AZURE_AD_CLIENT_ID = "test-azure-id";
      process.env.AZURE_AD_CLIENT_SECRET = "test-azure-secret";
      process.env.AZURE_AD_TENANT_ID = "test-tenant-id";

      expect(isProviderConfigured("azure-ad")).toBe(true);
    });

    it("should return false when Azure AD is missing variables", () => {
      process.env.AZURE_AD_CLIENT_ID = "test-azure-id";
      process.env.AZURE_AD_CLIENT_SECRET = "test-azure-secret";
      delete process.env.AZURE_AD_TENANT_ID;

      expect(isProviderConfigured("azure-ad")).toBe(false);
    });
  });
});
