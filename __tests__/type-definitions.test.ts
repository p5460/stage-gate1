import { describe, it, expect } from "vitest";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { UserRole } from "@prisma/client";

/**
 * Unit tests for TypeScript type definitions
 * Requirements: 4.2
 *
 * These tests verify that the TypeScript type definitions for Session and JWT
 * include all required custom fields and maintain type safety across callbacks.
 */

describe("TypeScript Type Definitions", () => {
  describe("Session Type", () => {
    it("should include all required fields in session user type", () => {
      // Create a mock session object that matches our extended type
      const mockSession: Session = {
        user: {
          id: "test-user-id",
          name: "Test User",
          email: "test@example.com",
          role: "USER" as UserRole,
          isOAuth: false,
          isTwoFactorEnabled: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      // Verify all required fields are present
      expect(mockSession.user.id).toBeDefined();
      expect(mockSession.user.name).toBeDefined();
      expect(mockSession.user.email).toBeDefined();
      expect(mockSession.user.role).toBeDefined();
      expect(mockSession.user.isOAuth).toBeDefined();

      // Verify field types
      expect(typeof mockSession.user.id).toBe("string");
      expect(typeof mockSession.user.name).toBe("string");
      expect(typeof mockSession.user.email).toBe("string");
      expect(typeof mockSession.user.role).toBe("string");
      expect(typeof mockSession.user.isOAuth).toBe("boolean");
    });

    it("should support all UserRole enum values", () => {
      const roles: UserRole[] = [
        "ADMIN",
        "USER",
        "GATEKEEPER",
        "PROJECT_LEAD",
        "RESEARCHER",
        "REVIEWER",
        "CUSTOM",
      ];

      roles.forEach((role) => {
        const mockSession: Session = {
          user: {
            id: "test-user-id",
            name: "Test User",
            email: "test@example.com",
            role: role,
            isOAuth: false,
            isTwoFactorEnabled: false,
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };

        expect(mockSession.user.role).toBe(role);
      });
    });

    it("should support OAuth and credentials users", () => {
      // OAuth user
      const oauthSession: Session = {
        user: {
          id: "oauth-user-id",
          name: "OAuth User",
          email: "oauth@example.com",
          role: "USER" as UserRole,
          isOAuth: true,
          isTwoFactorEnabled: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      expect(oauthSession.user.isOAuth).toBe(true);

      // Credentials user
      const credentialsSession: Session = {
        user: {
          id: "credentials-user-id",
          name: "Credentials User",
          email: "credentials@example.com",
          role: "USER" as UserRole,
          isOAuth: false,
          isTwoFactorEnabled: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      expect(credentialsSession.user.isOAuth).toBe(false);
    });

    it("should include optional custom role fields", () => {
      const mockSession: Session = {
        user: {
          id: "test-user-id",
          name: "Test User",
          email: "test@example.com",
          role: "CUSTOM" as UserRole,
          customRoleId: "custom-role-123",
          customRole: {
            id: "custom-role-123",
            name: "Custom Role",
            description: "A custom role",
            color: "#FF5733",
            permissions: [
              {
                permission: {
                  key: "read:projects",
                  name: "Read Projects",
                  description: "Can read projects",
                  category: "projects",
                },
              },
            ],
          },
          isOAuth: false,
          isTwoFactorEnabled: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      expect(mockSession.user.customRoleId).toBe("custom-role-123");
      expect(mockSession.user.customRole).toBeDefined();
      expect(mockSession.user.customRole?.name).toBe("Custom Role");
      expect(mockSession.user.customRole?.permissions).toHaveLength(1);
    });
  });

  describe("JWT Type", () => {
    it("should include custom fields in JWT type", () => {
      // Create a mock JWT token that matches our extended type
      const mockToken: JWT = {
        sub: "test-user-id",
        name: "Test User",
        email: "test@example.com",
        role: "USER" as UserRole,
        isOAuth: false,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      };

      // Verify custom fields are present
      expect(mockToken.role).toBeDefined();
      expect(mockToken.isOAuth).toBeDefined();

      // Verify field types
      expect(typeof mockToken.role).toBe("string");
      expect(typeof mockToken.isOAuth).toBe("boolean");
    });

    it("should support all UserRole enum values in JWT", () => {
      const roles: UserRole[] = [
        "ADMIN",
        "USER",
        "GATEKEEPER",
        "PROJECT_LEAD",
        "RESEARCHER",
        "REVIEWER",
        "CUSTOM",
      ];

      roles.forEach((role) => {
        const mockToken: JWT = {
          sub: "test-user-id",
          name: "Test User",
          email: "test@example.com",
          role: role,
          isOAuth: false,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
        };

        expect(mockToken.role).toBe(role);
      });
    });

    it("should support optional role and isOAuth fields", () => {
      // JWT without custom fields (initial state)
      const minimalToken: JWT = {
        sub: "test-user-id",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      };

      expect(minimalToken.role).toBeUndefined();
      expect(minimalToken.isOAuth).toBeUndefined();

      // JWT with custom fields (after enrichment)
      const enrichedToken: JWT = {
        ...minimalToken,
        role: "USER" as UserRole,
        isOAuth: true,
      };

      expect(enrichedToken.role).toBe("USER");
      expect(enrichedToken.isOAuth).toBe(true);
    });
  });

  describe("Type Compatibility with Callbacks", () => {
    it("should allow session callback to access token fields", () => {
      // Simulate session callback behavior
      const token: JWT = {
        sub: "test-user-id",
        name: "Test User",
        email: "test@example.com",
        role: "ADMIN" as UserRole,
        isOAuth: true,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      };

      const session: Session = {
        user: {
          id: token.sub!,
          name: token.name!,
          email: token.email!,
          role: token.role!,
          isOAuth: token.isOAuth!,
          isTwoFactorEnabled: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      // Verify session was properly enriched from token
      expect(session.user.id).toBe(token.sub);
      expect(session.user.name).toBe(token.name);
      expect(session.user.email).toBe(token.email);
      expect(session.user.role).toBe(token.role);
      expect(session.user.isOAuth).toBe(token.isOAuth);
    });

    it("should allow JWT callback to set custom fields", () => {
      // Simulate JWT callback behavior
      const initialToken: JWT = {
        sub: "test-user-id",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      };

      // Enrich token with user data
      const enrichedToken: JWT = {
        ...initialToken,
        name: "Test User",
        email: "test@example.com",
        role: "PROJECT_LEAD" as UserRole,
        isOAuth: false,
      };

      expect(enrichedToken.role).toBe("PROJECT_LEAD");
      expect(enrichedToken.isOAuth).toBe(false);
    });

    it("should maintain type safety when updating token fields", () => {
      const token: JWT = {
        sub: "test-user-id",
        name: "Test User",
        email: "test@example.com",
        role: "USER" as UserRole,
        isOAuth: false,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      };

      // Update role (simulating role change)
      const updatedToken: JWT = {
        ...token,
        role: "GATEKEEPER" as UserRole,
      };

      expect(updatedToken.role).toBe("GATEKEEPER");
      expect(updatedToken.isOAuth).toBe(false); // Other fields preserved
    });

    it("should handle missing optional fields gracefully", () => {
      const token: JWT = {
        sub: "test-user-id",
        name: "Test User",
        email: "test@example.com",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
        // role and isOAuth are optional and not set
      };

      // Should be able to create session with default values
      const session: Session = {
        user: {
          id: token.sub!,
          name: token.name!,
          email: token.email!,
          role: (token.role || "USER") as UserRole,
          isOAuth: token.isOAuth || false,
          isTwoFactorEnabled: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      expect(session.user.role).toBe("USER");
      expect(session.user.isOAuth).toBe(false);
    });
  });
});
