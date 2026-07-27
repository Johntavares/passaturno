import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { inMemoryStore } from '@/lib/inMemoryStore';

export async function GET() {
  try {
    const activeShift = await prisma.shift.findFirst({
      where: { status: 'ATIVO' },
      orderBy: { criadoEm: 'desc' },
      include: {
        responsavel: true,
      },
    });

    const lastClosedShift = await prisma.shift.findFirst({
      where: { status: 'ENCERRADO' },
      orderBy: { horaFim: 'desc' },
    });

    const openIncidents = await prisma.incident.findMany({
      where: {
        status: { in: ['EM_ANDAMENTO', 'AGUARDANDO', 'PENDENCIA_PROXIMO_TURNO'] },
      },
      include: {
        equipment: true,
      },
      orderBy: { prioridade: 'desc' },
    });

    const criticalCount = openIncidents.filter((i) => i.prioridade === 'CRITICA').length;
    const inheritedCount = openIncidents.filter((i) => i.isPendenciaHerdada).length;

    return NextResponse.json({
      activeShift,
      lastClosedShift,
      openIncidentsCount: openIncidents.length,
      criticalCount,
      inheritedCount,
      openIncidents,
    });
  } catch (error) {
    console.warn('Fallback to inMemoryStore for GET /api/turnos/ativo:', error);
    return NextResponse.json(inMemoryStore.getActiveShift());
  }
}

