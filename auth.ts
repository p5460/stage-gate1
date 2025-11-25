/**
 * NextAuth v4 Configuration
 *
 * This file contains the complete NextAuth configuration for the application.
 * NextAuth v4 is stable and has proven Edge Runtime compatibility.
 */

import NextAuth, { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "@/lib/db";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import AzureADProvider from "next-auth/providers/azure-ad";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/data/user";
import { LoginSchema } from "@/schemas";
import {
  logAuthError,
  AuthErrorType,
  retryOnTransientError,
} from "@/lib/auth-error-logger";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const validatedFields = LoginSchema.safeParse(credentials);

          if (!validatedFields.success) {
            logAuthError({
              type: AuthErrorType.CREDENTIALS_INVALID,
              message: "Invalid credentials format",
            });
            return null;
          }

          const { email, password } = validatedFields.data;

          const user = await retryOnTransientError(
            () => getUserByEmail(email),
            2,
            500
          );

          if (!user || !user.password) {
            logAuthError({
              type: AuthErrorType.CREDENTIALS_INVALID,
              message: "User not found or no password set",
              email,
            });
            return null;
          }

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              emailVerified: user.emailVerified,
            };
          }

          logAuthError({
            type: AuthErrorType.CREDENTIALS_INVALID,
            message: "Password mismatch",
            email,
          });
          return null;
        } catch (error) {
          logAuthError({
            type: AuthErrorType.CREDENTIALS_INVALID,
            message: "Error during credentials authorization",
            error,
          });
          return null;
        }
      },
    }),
  ],
  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      try {
        if (account?.provider !== "credentials") {
          try {
            const existingUser = await retryOnTransientError(
              () => getUserByEmail(user.email!),
              2,
              500
            );

            if (existingUser) {
              const updates: any = {};

              if (!existingUser.emailVerified) {
                updates.emailVerified = new Date();
              }

              if (!existingUser.role) {
                updates.role = "USER";
              }

              if (Object.keys(updates).length > 0) {
                await retryOnTransientError(
                  () =>
                    db.user.update({
                      where: { id: existingUser.id },
                      data: updates,
                    }),
                  2,
                  500
                );
              }
            }
          } catch (error) {
            logAuthError({
              type: AuthErrorType.ROLE_ASSIGNMENT_FAILED,
              message: "Failed to assign role to OAuth user",
              error,
              email: user.email ?? undefined,
              provider: account?.provider,
            });
          }
          return true;
        }

        try {
          const existingUser = await retryOnTransientError(
            () => getUserByEmail(user.email!),
            2,
            500
          );

          if (!existingUser?.emailVerified) {
            logAuthError({
              type: AuthErrorType.EMAIL_NOT_VERIFIED,
              message:
                "Credentials user attempted sign-in without email verification",
              email: user.email ?? undefined,
            });
            return false;
          }

          return true;
        } catch (error) {
          logAuthError({
            type: AuthErrorType.DATABASE_ERROR,
            message: "Failed to verify user email during sign-in",
            error,
            email: user.email ?? undefined,
          });
          return false;
        }
      } catch (error) {
        logAuthError({
          type: AuthErrorType.SIGNIN_FAILED,
          message: "Unexpected error in signIn callback",
          error,
          email: user.email ?? undefined,
          provider: account?.provider,
        });
        return false;
      }
    },
    async session({ session, token }) {
      try {
        if (token.sub && session.user) {
          session.user.id = token.sub;
        }
        if (token.role && session.user) {
          session.user.role = token.role as any;
        }
        if (token.name && session.user) {
          session.user.name = token.name;
        }
        if (token.email && session.user) {
          session.user.email = token.email;
        }
        if (typeof token.isOAuth === "boolean" && session.user) {
          session.user.isOAuth = token.isOAuth;
        }
        return session;
      } catch (error) {
        logAuthError({
          type: AuthErrorType.SESSION_ERROR,
          message: "Unexpected error in session callback",
          error,
          userId: token.sub as string | undefined,
          email: token.email as string | undefined,
        });
        return session;
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role;
        token.isOAuth = !!account;
      }

      if (!user && token.sub) {
        try {
          const existingUser = await retryOnTransientError(
            async () =>
              await db.user.findUnique({
                where: { id: token.sub },
                include: {
                  accounts: true,
                },
              }),
            2,
            500
          );

          if (existingUser) {
            token.name = existingUser.name;
            token.email = existingUser.email;
            token.role = existingUser.role;
            token.isOAuth = existingUser.accounts.length > 0;
          }
        } catch (error) {
          logAuthError({
            type: AuthErrorType.JWT_ERROR,
            message: "Failed to refresh user data in JWT callback",
            error,
            userId: token.sub,
          });
        }
      }

      return token;
    },
  },
};

export default NextAuth(authOptions);

// Export helper for server components
export { auth } from "@/lib/auth-helpers";
