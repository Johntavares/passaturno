export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabaseClient';
import { inMemoryStore } from '@/lib/inMemoryStore';
import { normalizeTurma, turmaInFilter } from '@/lib/turma';

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
      let active = shifts[0];
      if (turma) {
        const found = shifts.find((s) => normalizeTurma(s.turma) === turma);
        if (found) active = found;
      }

      const { data: openIncidents } = await supabase
        .from('Incident')
        .select('*')
        .in('status', ['EM_ANDAMENTO', 'AGUARDANDO', 'PENDENCIA_PROXIMO_TURNO'])
        .order('prioridade', { ascending: false });

      const filteredInc = (openIncidents || []).filter(
        (i) => !turma || normalizeTurma(i.turma) === turma
      );

      return NextResponse.json({
        activeShift: active,
        lastClosedShift: null,
        openIncidentsCount: filteredInc.length,
        criticalCount: filteredInc.filter((i) => i.prioridade === 'CRITICA').length,
        inheritedCount: filteredInc.filter((i) => i.isPendenciaHerdada).length,
        openIncidents: filteredInc,
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
    return NextResponse.json({
      activeShift,
      lastClosedShift: null,
      openIncidentsCount: 0,
      criticalCount: 0,
      inheritedCount: 0,
      openIncidents: [],
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
          (i) => normalizeTurma(i.turma) === turma
        ),
      });
    }
    return NextResponse.json(fallback);
  }
}

