import { PrismaClient } from '@prisma/client';

// GUARDA: o sistema usa APENAS o banco Supabase.
// Se o DATABASE_URL apontar para o Neon (ou qualquer outro host não-Supabase),
// o Prisma NÃO é criado e o erro fica explícito — nunca conecta no banco errado.
const dbUrl = (process.env.DATABASE_URL || '').toLowerCase();
if (dbUrl.includes('neon.tech')) {
  throw new Error(
    '[PRISMA] DATABASE_URL aponta para o banco NEON, que foi descontinuado neste projeto. ' +
    'Configure o DATABASE_URL para o Postgres do Supabase (db.xxxxxxxx.supabase.co).'
  );
}
if (!dbUrl.includes('supabase.co')) {
  console.warn(
    '[PRISMA] AVISO: DATABASE_URL não parece ser o Supabase (' +
    (process.env.DATABASE_URL || '(vazio)').replace(/:[^:@/]+@/, ':***@') +
    '). Confira as variáveis de ambiente do deploy.'
  );
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
