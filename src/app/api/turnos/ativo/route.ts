export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabaseClient';
import { normalizeTurma, turmaInFilter } from '@/lib/turma';

// GET /api/turnos/ativo?turma=X
// SOMENTE LEITURA — este endpoint NUNCA altera o banco.
// A instabilidade anterior vinha de GETs que encerravam turnos automaticamente.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const turma = normalizeTurma(searchParams.get('turma'));

  try {
    const { data: shifts, error: supaShiftErr } = await supabase
      .from('Shift')
      .select('*')
      .eq('status', 'ATIVO')
      .order('criadoEm', { ascending: false });

    if (shifts && shifts.length > 0) {
      let active: any = null;
      if (turma) {
        active = shifts.find((s) => normalizeTurma(s.turma) === turma) || null;
      } else {
        active = shifts[0];
      }

      const { data: openIncidents } = await supabase
        .from('Incident')
        .select('*')
        .in('status', ['EM_ANDAMENTO', 'AGUARDANDO', 'PENDENCIA_PROXIMO_TURNO'])
        .order('prioridade', { ascending: false });

      const filteredInc = openIncidents || [];

      return NextResponse.json({
        activeShift: active,
        lastClosedShift: null,
        openIncidentsCount: filteredInc.length,
        criticalCount: filteredInc.filter((i) => i.prioridade === 'CRITICA').length,
        inheritedCount: filteredInc.filter((i) => i.isPendenciaHerdada).length,
        openIncidents: filteredInc,
      });
    } else {
      return NextResponse.json({
        activeShift: null,
        lastClosedShift: null,
        openIncidentsCount: 0,
        criticalCount: 0,
        inheritedCount: 0,
        openIncidents: [],
      });
    }
  } catch (e) {
    console.warn('Supabase REST turnos/ativo warning:', e);
  }

  try {
    const activeShift = await prisma.shift.findFirst({
      where: { status: 'ATIVO', ...(turma ? { turma: turmaInFilter(turma) } : {}) },
      orderBy: { criadoEm: 'desc' },
    });

    const openIncidents = await prisma.incident.findMany({
      where: { status: { in: ['EM_ANDAMENTO', 'AGUARDANDO', 'PENDENCIA_PROXIMO_TURNO'] } },
      orderBy: { criadoEm: 'desc' },
    });

    return NextResponse.json({
      activeShift,
      lastClosedShift: null,
      openIncidentsCount: openIncidents.length,
      criticalCount: openIncidents.filter((i) => i.prioridade === 'CRITICA').length,
      inheritedCount: openIncidents.filter((i) => i.isPendenciaHerdada).length,
      openIncidents,
    });
  } catch (error) {
    console.error('Erro ao buscar turno ativo:', error);
    return NextResponse.json({ error: 'Erro ao buscar turno ativo' }, { status: 500 });
  }
}
