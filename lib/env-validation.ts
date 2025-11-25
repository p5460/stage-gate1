/**
 * Environment variable validation for OAuth providers
 * Validates that required OAuth environment variables are present
 */

interface ValidationResult {
  isValid: boolean;
  missingVariables: string[];
  warnings: string[];
}

interface OAuthProviderConfig {
  name: string;
  requiredVars: string[];
}

const OAUTH_PROVIDERS: OAuthProviderConfig[] = [
  {
    name: "Google",
    requiredVars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  },
  {
    name: "GitHub",
    requiredVars: ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
  },
  {
    name: "Azure AD",
    requiredVars: [
      "AZURE_AD_CLIENT_ID",
      "AZURE_AD_CLIENT_SECRET",
      "AZURE_AD_TENANT_ID",
    ],
  },
];

/**
 * Validates that all required OAuth environment variables are present
 * @returns ValidationResult with validation status and missing variables
 */
export function validateOAuthEnvironmentVariables(): ValidationResult {
  const missingVariables: string[] = [];
  const warnings: string[] = [];

  for (const provider of OAUTH_PROVIDERS) {
    const missingVars = provider.requiredVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      missingVariables.push(...missingVars);
      const warning = `${provider.name} OAuth provider is missing required environment variables: ${missingVars.join(", ")}`;
      warnings.push(warning);
      console.warn(`[Auth Config Warning] ${warning}`);
    }
  }

  const isValid = missingVariables.length === 0;

  if (!isValid) {
    console.warn(
      "[Auth Config Warning] Some OAuth providers are not properly configured. Authentication with these providers will not work."
    );
    console.warn(
      "[Auth Config Warning] Missing variables:",
      missingVariables.join(", ")
    );
  }

  return {
    isValid,
    missingVariables,
    warnings,
  };
}

/**
 * Validates environment variables and throws an error if critical variables are missing
 * Use this for strict validation during application startup
 */
export function validateOAuthEnvironmentVariablesStrict(): void {
  const result = validateOAuthEnvironmentVariables();

  if (!result.isValid) {
    const errorMessage = `Missing required OAuth environment variables:\n${result.warnings.join("\n")}\n\nPlease configure these variables in your .env file.`;
    throw new Error(errorMessage);
  }
}

/**
 * Gets a list of all required OAuth environment variables
 * @returns Array of required environment variable names
 */
export function getRequiredOAuthVariables(): string[] {
  return OAUTH_PROVIDERS.flatMap((provider) => provider.requiredVars);
}

/**
 * Checks if a specific OAuth provider is properly configured
 * @param providerName - Name of the provider (google, github, azure-ad)
 * @returns true if all required variables are present
 */
export function isProviderConfigured(
  providerName: "google" | "github" | "azure-ad"
): boolean {
  const providerMap: Record<string, string> = {
    google: "Google",
    github: "GitHub",
    "azure-ad": "Azure AD",
  };

  const provider = OAUTH_PROVIDERS.find(
    (p) => p.name === providerMap[providerName]
  );

  if (!provider) {
    return false;
  }

  return provider.requiredVars.every((varName) => !!process.env[varName]);
}
