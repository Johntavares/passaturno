import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const databaseUrl = process.env.DATABASE_URL || '';
const isNeon = databaseUrl.includes('neon.tech');

export const prisma =
  globalForPrisma.prisma ||
  (isNeon
    ? new PrismaClient({ adapter: new PrismaNeon({ connectionString: databaseUrl }), log: ['error'] })
    : new PrismaClient({ log: ['error'] }));

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

