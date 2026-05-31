import { PrismaClient } from './generated/prisma-client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const dbUrl = process.env.DATABASE_URL || 'file:./pos.db';

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
