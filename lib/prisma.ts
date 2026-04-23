import { PrismaClient } from '@prisma/client';

// singleton pattern — ป้องกัน PrismaClient หลาย instance ใน Next.js dev mode (hot reload)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
