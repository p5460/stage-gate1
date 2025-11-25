import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/data/user";
import { LoginSchema } from "@/schemas";
import authConfig from "@/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
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
        // Allow OAuth without email verification
        if (account?.provider !== "credentials") {
          // Check if OAuth user exists and assign default role if needed
          const existingUser = await getUserByEmail(user.email!);
          if (existingUser && !existingUser.role) {
            await db.user.update({
              where: { id: existingUser.id },
              data: { role: "USER" }, // Default role for OAuth users
            });
          }
          return true;
        }

        const existingUser = await getUserByEmail(user.email!);

        // Prevent sign in without email verification
        if (!existingUser?.emailVerified) return false;

        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return false;
      }
    },
    async session({ token, session }) {
      // Reuse base session callback from auth.config.ts
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
      if (!token.sub) return token;

      try {
        const existingUser = await db.user.findUnique({
          where: { email: token.email! },
          include: {
            accounts: true,
          },
        });

        if (!existingUser) return token;

        token.name = existingUser.name;
        token.email = existingUser.email;
        token.role = existingUser.role;
        token.isOAuth = !!existingUser.accounts?.length;

        return token;
      } catch (error) {
        console.error("JWT callback error:", error);
        // Return token without additional data if database query fails
        return token;
      }
    },
  },
  providers: [
    ...authConfig.providers,
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;

          const user = await getUserByEmail(email);
          if (!user || !user.password) return null;

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
        }

        return null;
      },
    }),
  ],
});
