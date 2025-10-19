// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Guard against multiple instances during development
const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

const prisma = 
  globalForPrisma.prisma ??
  new PrismaClient({
    // Optional: Add logging for better debugging in development
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
