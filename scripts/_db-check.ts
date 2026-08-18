import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const p = new PrismaClient();

(async () => {
  try {
    const users = await p.user.count();
    const incidents = await p.incident.count();
    console.log('Prisma local OK - usuarios:', users, '| incidents:', incidents);
  } catch (e: any) {
    console.log('Prisma local ERRO:', e.message?.slice(0, 200));
  }
  await p.$disconnect();
})();