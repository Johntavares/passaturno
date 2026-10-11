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
  const rawTurma = searchParams.get('turma');
  const turma = rawTurma && rawTurma !== 'TODAS' ? normalizeTurma(rawTurma) : '';

  // 1. SUPABASE REST (se disponível e dentro da cota)
  try {
    const { data: shifts, error: supaShiftErr } = await supabase
      .from('Shift')
      .select('*')
      .eq('status', 'ATIVO')
      .order('criadoEm', { ascending: false });

    if (!supaShiftErr && Array.isArray(shifts)) {
      let active: any = null;
      if (turma) {
        active = shifts.find((s) => normalizeTurma(s.turma) === turma) || null;
      } else {
        active = shifts[0] || null;
      }

      const { data: openIncidents, error: incErr } = await supabase
        .from('Incident')
        .select('*')
        .in('status', ['EM_ANDAMENTO', 'AGUARDANDO', 'PENDENCIA_PROXIMO_TURNO'])
        .order('prioridade', { ascending: false });

      if (!incErr && openIncidents) {
        return NextResponse.json({
          activeShift: active,
          lastClosedShift: null,
          openIncidentsCount: openIncidents.length,
          criticalCount: openIncidents.filter((i) => i.prioridade === 'CRITICA').length,
          inheritedCount: openIncidents.filter((i) => i.isPendenciaHerdada).length,
          openIncidents,
        });
      }
    }
  } catch (e) {
    console.warn('Supabase REST turnos/ativo warning:', e);
  }

  // 2. PRISMA POSTGRESQL (Fallback direto e tolerante a cota de tráfego)
  try {
    const activeShift = await prisma.shift.findFirst({
      where: {
        status: 'ATIVO',
        ...(turma ? { turma: turmaInFilter(turma) } : {}),
      },
      orderBy: { criadoEm: 'desc' },
    });

    const openIncidents = await prisma.incident.findMany({
      where: { status: { in: ['EM_ANDAMENTO', 'AGUARDANDO', 'PENDENCIA_PROXIMO_TURNO'] } },
      orderBy: { criadoEm: 'desc' },
    });

    return NextResponse.json({
      activeShift: activeShift || null,
      lastClosedShift: null,
      openIncidentsCount: openIncidents.length,
      criticalCount: openIncidents.filter((i) => i.prioridade === 'CRITICA').length,
      inheritedCount: openIncidents.filter((i) => i.isPendenciaHerdada).length,
      openIncidents,
    });
  } catch (error) {
    console.error('Erro ao buscar turno ativo no Prisma:', error);
    return NextResponse.json({ error: 'Erro ao buscar turno ativo' }, { status: 500 });
  }
}

