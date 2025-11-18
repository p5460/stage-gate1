import { UserRole } from "@prisma/client";
import { type DefaultSession } from "next-auth";

export type ExtendedUser = DefaultSession["user"] & {
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
}
