import { PrismaClient } from "@prisma/client";

// Extended Prisma client type to include all models
export type ExtendedPrismaClient = PrismaClient & {
  notificationPreference: PrismaClient["user"]; // This ensures the type exists
};

// Type-safe wrapper for the database client
export const typedDb = globalThis.prisma as ExtendedPrismaClient;
