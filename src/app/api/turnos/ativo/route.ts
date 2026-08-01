export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { inMemoryStore } from '@/lib/inMemoryStore';
import { normalizeTurma, turmaInFilter } from '@/lib/turma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const turma = normalizeTurma(searchParams.get('turma'));
  const turmaWhere = turma ? { turma: turmaInFilter(turma) } : {};

  try {
    const activeShift = await prisma.shift.findFirst({
      where: { status: 'ATIVO', ...turmaWhere },
      orderBy: { criadoEm: 'desc' },
      include: {
        responsavel: true,
      },
    });

    const lastClosedShift = await prisma.shift.findFirst({
      where: { status: 'ENCERRADO', ...turmaWhere },
      orderBy: { horaFim: 'desc' },
    });

    const openIncidents = await prisma.incident.findMany({
      where: {
        status: { in: ['EM_ANDAMENTO', 'AGUARDANDO', 'PENDENCIA_PROXIMO_TURNO'] },
        ...turmaWhere,
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
    const fallback = inMemoryStore.getActiveShift();
    if (turma) {
      const shiftTurma = normalizeTurma(fallback?.activeShift?.turma);
      return NextResponse.json({
        ...fallback,
        activeShift: shiftTurma === turma ? fallback.activeShift : null,
        lastClosedShift: null,
        openIncidents: (fallback?.openIncidents || []).filter(
          (i: any) => normalizeTurma(i.turma) === turma
        ),
      });
    }
    return NextResponse.json(fallback);
  }
}

