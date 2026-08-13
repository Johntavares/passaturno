import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const SUPABASE_URL_DEFAULT = "postgresql://postgres:gCHK.!cqi2gt%40E4@db.acwfzbmhkamxhdlfhaij.supabase.co:5432/postgres";

const rawUrl = process.env.DATABASE_URL || '';
// Se a URL contiver 'neon.tech' (estourada por cota) ou estiver vazia, redireciona AUTOMATICAMENTE para o Supabase!
const activeUrl = (rawUrl.includes('neon.tech') || !rawUrl) ? SUPABASE_URL_DEFAULT : rawUrl;
const isNeon = activeUrl.includes('neon.tech');

export const prisma =
  globalForPrisma.prisma ||
  (isNeon
    ? new PrismaClient({ adapter: new PrismaNeon({ connectionString: activeUrl }), log: ['error'] })
    : new PrismaClient({
        datasources: {
          db: {
            url: activeUrl,
          },
        },
        log: ['error'],
      }));

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;


