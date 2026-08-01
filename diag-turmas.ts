import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const prisma = new PrismaClient();

async function main() {
  const incidents = await prisma.incident.findMany({
    orderBy: { criadoEm: 'desc' },
    take: 30,
  });
  console.log('=== INCIDENTS (30 mais recentes) ===');
  for (const i of incidents) {
    console.log(
      [i.id.slice(0, 8), i.tag, i.status, `turma=${i.turma ?? 'NULL'}`, `herdada=${i.isPendenciaHerdada}`, `shift=${i.shiftId?.slice(0, 8) ?? 'NULL'}`, i.criadoEm.toISOString().slice(0, 16)].join(' | ')
    );
  }

  const shifts = await prisma.shift.findMany({
    orderBy: { criadoEm: 'desc' },
    take: 15,
    select: { id: true, turma: true, status: true, responsavelNome: true, horaInicio: true, horaFim: true, data: true },
  });
  console.log('\n=== SHIFTS (15 mais recentes) ===');
  for (const s of shifts) {
    console.log([s.id.slice(0, 8), `turma=${s.turma ?? 'NULL'}`, s.status, s.responsavelNome, s.horaInicio?.toISOString().slice(0, 16) ?? 'NULL', s.horaFim?.toISOString().slice(0, 16) ?? 'NULL', s.data].join(' | '));
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
