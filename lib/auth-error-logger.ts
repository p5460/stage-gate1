/**
 * Authentication Error Logging Utility
 * Provides structured error logging for authentication-related errors
 */

export enum AuthErrorType {
  SIGNIN_FAILED = "SIGNIN_FAILED",
  OAUTH_FAILED = "OAUTH_FAILED",
  DATABASE_ERROR = "DATABASE_ERROR",
  SESSION_ERROR = "SESSION_ERROR",
  JWT_ERROR = "JWT_ERROR",
  CREDENTIALS_INVALID = "CREDENTIALS_INVALID",
  EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",
  ROLE_ASSIGNMENT_FAILED = "ROLE_ASSIGNMENT_FAILED",
  MIDDLEWARE_ERROR = "MIDDLEWARE_ERROR",
  CALLBACK_ERROR = "CALLBACK_ERROR",
}

export interface AuthErrorContext {
  type: AuthErrorType;
  message: string;
  error?: unknown;
  userId?: string;
  email?: string;
  provider?: string;
  route?: string;
  timestamp?: Date;
  [key: string]: unknown;
}

/**
 * Logs authentication errors with structured context
 */
export function logAuthError(context: AuthErrorContext): void {
  const logEntry = {
    ...context,
    timestamp: context.timestamp || new Date(),
    errorDetails:
      context.error instanceof Error
        ? {
            name: context.error.name,
            message: context.error.message,
            stack: context.error.stack,
          }
        : context.error,
  };

  // Log to console with structured format
  console.error("[AUTH ERROR]", JSON.stringify(logEntry, null, 2));

  // In production, you could send to external logging service
  // e.g., Sentry, LogRocket, DataDog, etc.
  if (process.env.NODE_ENV === "production") {
    // Example: sendToExternalLogger(logEntry);
  }
}

/**
 * Creates user-friendly error messages from error types
 */
export function getUserFriendlyErrorMessage(
  errorType: AuthErrorType,
  details?: string
): string {
  const errorMessages: Record<AuthErrorType, string> = {
    [AuthErrorType.SIGNIN_FAILED]:
      "Unable to sign in. Please check your credentials and try again.",
    [AuthErrorType.OAUTH_FAILED]:
      "Authentication with the provider failed. Please try again or use a different method.",
    [AuthErrorType.DATABASE_ERROR]:
      "A temporary error occurred. Please try again in a moment.",
    [AuthErrorType.SESSION_ERROR]:
      "Your session could not be created. Please try signing in again.",
    [AuthErrorType.JWT_ERROR]:
      "Authentication token error. Please sign in again.",
    [AuthErrorType.CREDENTIALS_INVALID]:
      "Invalid email or password. Please check your credentials and try again.",
    [AuthErrorType.EMAIL_NOT_VERIFIED]:
      "Please verify your email address before signing in. Check your inbox for the verification link.",
    [AuthErrorType.ROLE_ASSIGNMENT_FAILED]:
      "Your account was created but there was an issue setting up permissions. Please contact support.",
    [AuthErrorType.MIDDLEWARE_ERROR]:
      "An error occurred while processing your request. Please try again.",
    [AuthErrorType.CALLBACK_ERROR]:
      "An authentication error occurred. Please try signing in again.",
  };

  const baseMessage =
    errorMessages[errorType] ||
    "An unexpected error occurred. Please try again.";
  return details ? `${baseMessage} ${details}` : baseMessage;
}

/**
 * Determines if an error is transient and should be retried
 */
export function isTransientError(error: unknown): boolean {
  if (error instanceof Error) {
    const transientPatterns = [
      /ECONNREFUSED/i,
      /ETIMEDOUT/i,
      /ENOTFOUND/i,
      /network/i,
      /timeout/i,
      /temporary/i,
      /unavailable/i,
      /too many requests/i,
      /rate limit/i,
    ];

    return transientPatterns.some(
      (pattern) =>
        pattern.test(error.message) || (error.name && pattern.test(error.name))
    );
  }

  return false;
}

/**
 * Retry logic for transient errors
 */
export async function retryOnTransientError<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isTransientError(error) || attempt === maxRetries) {
        throw error;
      }

      // Log retry attempt
      logAuthError({
        type: AuthErrorType.DATABASE_ERROR,
        message: `Transient error detected, retrying (attempt ${attempt}/${maxRetries})`,
        error,
      });

      // Wait before retrying with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError;
}
