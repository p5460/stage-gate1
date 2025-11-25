import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  logAuthError,
  AuthErrorType,
  getUserFriendlyErrorMessage,
  isTransientError,
  retryOnTransientError,
} from "@/lib/auth-error-logger";

describe("Authentication Error Handling", () => {
  beforeEach(() => {
    // Clear console mocks before each test
    vi.clearAllMocks();
  });

  describe("logAuthError", () => {
    it("should log error with context", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      logAuthError({
        type: AuthErrorType.SIGNIN_FAILED,
        message: "Test error message",
        email: "test@example.com",
        userId: "user123",
      });

      expect(consoleSpy).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleSpy.mock.calls[0][1]);

      expect(loggedData.type).toBe(AuthErrorType.SIGNIN_FAILED);
      expect(loggedData.message).toBe("Test error message");
      expect(loggedData.email).toBe("test@example.com");
      expect(loggedData.userId).toBe("user123");
      expect(loggedData.timestamp).toBeDefined();

      consoleSpy.mockRestore();
    });

    it("should include error details when error is provided", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const testError = new Error("Database connection failed");

      logAuthError({
        type: AuthErrorType.DATABASE_ERROR,
        message: "Failed to connect",
        error: testError,
      });

      expect(consoleSpy).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleSpy.mock.calls[0][1]);

      expect(loggedData.errorDetails).toBeDefined();
      expect(loggedData.errorDetails.name).toBe("Error");
      expect(loggedData.errorDetails.message).toBe(
        "Database connection failed"
      );
      expect(loggedData.errorDetails.stack).toBeDefined();

      consoleSpy.mockRestore();
    });

    it("should include provider information when provided", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      logAuthError({
        type: AuthErrorType.OAUTH_FAILED,
        message: "OAuth failed",
        provider: "google",
        email: "user@example.com",
      });

      expect(consoleSpy).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleSpy.mock.calls[0][1]);

      expect(loggedData.provider).toBe("google");

      consoleSpy.mockRestore();
    });

    it("should include route information when provided", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      logAuthError({
        type: AuthErrorType.MIDDLEWARE_ERROR,
        message: "Middleware error",
        route: "/admin/users",
      });

      expect(consoleSpy).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleSpy.mock.calls[0][1]);

      expect(loggedData.route).toBe("/admin/users");

      consoleSpy.mockRestore();
    });
  });

  describe("getUserFriendlyErrorMessage", () => {
    it("should return user-friendly message for SIGNIN_FAILED", () => {
      const message = getUserFriendlyErrorMessage(AuthErrorType.SIGNIN_FAILED);

      expect(message).toBe(
        "Unable to sign in. Please check your credentials and try again."
      );
      expect(message).not.toContain("error");
      expect(message).not.toContain("exception");
    });

    it("should return user-friendly message for OAUTH_FAILED", () => {
      const message = getUserFriendlyErrorMessage(AuthErrorType.OAUTH_FAILED);

      expect(message).toBe(
        "Authentication with the provider failed. Please try again or use a different method."
      );
      expect(message).not.toContain("stack");
      expect(message).not.toContain("trace");
    });

    it("should return user-friendly message for DATABASE_ERROR", () => {
      const message = getUserFriendlyErrorMessage(AuthErrorType.DATABASE_ERROR);

      expect(message).toBe(
        "A temporary error occurred. Please try again in a moment."
      );
      expect(message).not.toContain("database");
      expect(message).not.toContain("query");
    });

    it("should return user-friendly message for SESSION_ERROR", () => {
      const message = getUserFriendlyErrorMessage(AuthErrorType.SESSION_ERROR);

      expect(message).toBe(
        "Your session could not be created. Please try signing in again."
      );
    });

    it("should return user-friendly message for JWT_ERROR", () => {
      const message = getUserFriendlyErrorMessage(AuthErrorType.JWT_ERROR);

      expect(message).toBe("Authentication token error. Please sign in again.");
    });

    it("should return user-friendly message for CREDENTIALS_INVALID", () => {
      const message = getUserFriendlyErrorMessage(
        AuthErrorType.CREDENTIALS_INVALID
      );

      expect(message).toBe(
        "Invalid email or password. Please check your credentials and try again."
      );
    });

    it("should return user-friendly message for EMAIL_NOT_VERIFIED", () => {
      const message = getUserFriendlyErrorMessage(
        AuthErrorType.EMAIL_NOT_VERIFIED
      );

      expect(message).toBe(
        "Please verify your email address before signing in. Check your inbox for the verification link."
      );
    });

    it("should return user-friendly message for ROLE_ASSIGNMENT_FAILED", () => {
      const message = getUserFriendlyErrorMessage(
        AuthErrorType.ROLE_ASSIGNMENT_FAILED
      );

      expect(message).toBe(
        "Your account was created but there was an issue setting up permissions. Please contact support."
      );
    });

    it("should return user-friendly message for MIDDLEWARE_ERROR", () => {
      const message = getUserFriendlyErrorMessage(
        AuthErrorType.MIDDLEWARE_ERROR
      );

      expect(message).toBe(
        "An error occurred while processing your request. Please try again."
      );
    });

    it("should return user-friendly message for CALLBACK_ERROR", () => {
      const message = getUserFriendlyErrorMessage(AuthErrorType.CALLBACK_ERROR);

      expect(message).toBe(
        "An authentication error occurred. Please try signing in again."
      );
    });

    it("should append details when provided", () => {
      const message = getUserFriendlyErrorMessage(
        AuthErrorType.SIGNIN_FAILED,
        "Additional context."
      );

      expect(message).toContain("Unable to sign in");
      expect(message).toContain("Additional context.");
    });
  });

  describe("isTransientError", () => {
    it("should identify ECONNREFUSED as transient", () => {
      const error = new Error("ECONNREFUSED: Connection refused");

      expect(isTransientError(error)).toBe(true);
    });

    it("should identify ETIMEDOUT as transient", () => {
      const error = new Error("ETIMEDOUT: Operation timed out");

      expect(isTransientError(error)).toBe(true);
    });

    it("should identify ENOTFOUND as transient", () => {
      const error = new Error("ENOTFOUND: DNS lookup failed");

      expect(isTransientError(error)).toBe(true);
    });

    it("should identify network errors as transient", () => {
      const error = new Error("Network error occurred");

      expect(isTransientError(error)).toBe(true);
    });

    it("should identify timeout errors as transient", () => {
      const error = new Error("Request timeout");

      expect(isTransientError(error)).toBe(true);
    });

    it("should identify rate limit errors as transient", () => {
      const error = new Error("Rate limit exceeded");

      expect(isTransientError(error)).toBe(true);
    });

    it("should not identify validation errors as transient", () => {
      const error = new Error("Invalid email format");

      expect(isTransientError(error)).toBe(false);
    });

    it("should not identify authentication errors as transient", () => {
      const error = new Error("Invalid credentials");

      expect(isTransientError(error)).toBe(false);
    });

    it("should handle non-Error objects", () => {
      const error = "String error";

      expect(isTransientError(error)).toBe(false);
    });

    it("should handle null/undefined", () => {
      expect(isTransientError(null)).toBe(false);
      expect(isTransientError(undefined)).toBe(false);
    });
  });

  describe("retryOnTransientError", () => {
    it("should succeed on first attempt", async () => {
      const operation = vi.fn().mockResolvedValue("success");

      const result = await retryOnTransientError(operation, 3, 10);

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should retry on transient error and eventually succeed", async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error("ETIMEDOUT"))
        .mockRejectedValueOnce(new Error("ETIMEDOUT"))
        .mockResolvedValue("success");

      const result = await retryOnTransientError(operation, 3, 10);

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it("should throw non-transient errors immediately", async () => {
      const operation = vi.fn().mockRejectedValue(new Error("Invalid input"));

      await expect(retryOnTransientError(operation, 3, 10)).rejects.toThrow(
        "Invalid input"
      );
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should throw after max retries on transient error", async () => {
      const operation = vi.fn().mockRejectedValue(new Error("ETIMEDOUT"));

      await expect(retryOnTransientError(operation, 3, 10)).rejects.toThrow(
        "ETIMEDOUT"
      );
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it("should log retry attempts", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error("ETIMEDOUT"))
        .mockResolvedValue("success");

      await retryOnTransientError(operation, 3, 10);

      expect(consoleSpy).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleSpy.mock.calls[0][1]);
      expect(loggedData.message).toContain("Transient error detected");
      expect(loggedData.message).toContain("retrying");

      consoleSpy.mockRestore();
    });

    it("should use exponential backoff", async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error("ETIMEDOUT"))
        .mockRejectedValueOnce(new Error("ETIMEDOUT"))
        .mockResolvedValue("success");

      const startTime = Date.now();
      await retryOnTransientError(operation, 3, 10);
      const endTime = Date.now();

      // Should wait at least 10ms + 20ms = 30ms total
      expect(endTime - startTime).toBeGreaterThanOrEqual(20);
    });
  });

  describe("Error message clarity", () => {
    it("should not expose sensitive information in error messages", () => {
      const messages = [
        getUserFriendlyErrorMessage(AuthErrorType.DATABASE_ERROR),
        getUserFriendlyErrorMessage(AuthErrorType.JWT_ERROR),
        getUserFriendlyErrorMessage(AuthErrorType.SESSION_ERROR),
        getUserFriendlyErrorMessage(AuthErrorType.OAUTH_FAILED),
      ];

      // Check that messages don't expose actual sensitive values or implementation details
      messages.forEach((message) => {
        expect(message.toLowerCase()).not.toContain("secret");
        expect(message.toLowerCase()).not.toContain("key");
        expect(message.toLowerCase()).not.toContain("hash");
        expect(message.toLowerCase()).not.toContain("bcrypt");
        expect(message.toLowerCase()).not.toContain("jwt");
        expect(message.toLowerCase()).not.toContain("database");
        expect(message.toLowerCase()).not.toContain("query");
        expect(message.toLowerCase()).not.toContain("sql");
      });
    });

    it("should provide actionable guidance", () => {
      const messages = [
        getUserFriendlyErrorMessage(AuthErrorType.CREDENTIALS_INVALID),
        getUserFriendlyErrorMessage(AuthErrorType.EMAIL_NOT_VERIFIED),
        getUserFriendlyErrorMessage(AuthErrorType.OAUTH_FAILED),
      ];

      messages.forEach((message) => {
        expect(
          message.toLowerCase().includes("try") ||
            message.toLowerCase().includes("please") ||
            message.toLowerCase().includes("check")
        ).toBe(true);
      });
    });
  });

  describe("Graceful degradation", () => {
    it("should handle missing error context gracefully", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Should not throw even with minimal context
      expect(() => {
        logAuthError({
          type: AuthErrorType.SIGNIN_FAILED,
          message: "Error",
        });
      }).not.toThrow();

      consoleSpy.mockRestore();
    });

    it("should handle undefined error objects", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        logAuthError({
          type: AuthErrorType.DATABASE_ERROR,
          message: "Error",
          error: undefined,
        });
      }).not.toThrow();

      consoleSpy.mockRestore();
    });

    it("should handle non-standard error objects", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        logAuthError({
          type: AuthErrorType.CALLBACK_ERROR,
          message: "Error",
          error: { custom: "error object" },
        });
      }).not.toThrow();

      consoleSpy.mockRestore();
    });
  });
});
