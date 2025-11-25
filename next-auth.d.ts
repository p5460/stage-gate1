import { UserRole } from "@prisma/client";
import { type DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

export type ExtendedUser = DefaultSession["user"] & {
  id: string;
  role: UserRole;
  customRoleId?: string;
  customRole?: {
    id: string;
    name: string;
    description?: string;
    color?: string;
    permissions: Array<{
      permission: {
        key: string;
        name: string;
        description?: string;
        category: string;
      };
    }>;
  };
  isTwoFactorEnabled: boolean;
  isOAuth: boolean;
};

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }

  interface User {
    role: UserRole;
    emailVerified?: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    isOAuth?: boolean;
  }
}
