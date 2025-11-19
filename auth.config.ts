import type { NextAuthConfig } from "next-auth";

export default {
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role as
          | "ADMIN"
          | "USER"
          | "GATEKEEPER"
          | "PROJECT_LEAD"
          | "RESEARCHER"
          | "REVIEWER"
          | "CUSTOM";
      }

      if (session.user) {
        session.user.name = token.name;
        session.user.email = token.email!;
        session.user.isOAuth = token.isOAuth as boolean;
      }

      return session;
    },
    async jwt({ token }) {
      // Pass through token without database queries for Edge Runtime compatibility
      return token;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
