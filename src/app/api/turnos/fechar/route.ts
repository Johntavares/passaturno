import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import { normalizeTurma, turmaInFilter } from '@/lib/turma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      responsavelSaida,
      turma,
      proximaTurma,
      monitoramento,
      horarioTurno,
      checklistMalaoStatus,
      checklistMalaoFaltantes,
      checklistMalaoResponsavel,
      solicitacaoMaterialStatus,
      solicitacaoMaterialResponsavel,
      anomaliasIdentificadas,
      observacoesTurno,
      pendenciasAcoes,
    } = body;

    const turmaTurno = normalizeTurma(turma);
    const targetProximaTurma = (proximaTurma || '').toUpperCase().trim() ||
      (turmaTurno === 'A' ? 'B' : turmaTurno === 'B' ? 'C' : turmaTurno === 'C' ? 'D' : 'A');

    const nowIso = new Date().toISOString();

    let closedShiftObj: any = null;

    // 1. SUPABASE REST (Fonte de Verdade Principal em Tempo Real)
    try {
      const { data: supaShifts } = await supabase
        .from('Shift')
        .select('*')
        .eq('status', 'ATIVO')
        .order('criadoEm', { ascending: false });

      let supaActiveShift: any = null;
      if (supaShifts && supaShifts.length > 0) {
        if (turmaTurno) {
          supaActiveShift = supaShifts.find((s: any) => normalizeTurma(s.turma) === turmaTurno);
        }
        if (!supaActiveShift) supaActiveShift = supaShifts[0];
      }

      if (supaActiveShift) {
        const activeTurma = normalizeTurma(supaActiveShift.turma) || turmaTurno || 'A';

        const { data: supaIncidents } = await supabase.from('Incident').select('*');
        const allInc = supaIncidents || [];
        const finalizedIncidents = allInc.filter((i: any) => i.status === 'FINALIZADO' && normalizeTurma(i.turma) === activeTurma);
        const openIncidents = allInc.filter((i: any) =>
          ['EM_ANDAMENTO', 'AGUARDANDO', 'PENDENCIA_PROXIMO_TURNO'].includes(i.status) &&
          normalizeTurma(i.turma) === activeTurma
        );
        const criticalIncidents = openIncidents.filter((i: any) => i.prioridade === 'CRITICA' || i.prioridade === 'ALTA');

        // Repassar pendências em aberto para a próxima turma
        for (const inc of openIncidents) {
          try {
            await supabase
              .from('Incident')
              .update({
                status: 'PENDENCIA_PROXIMO_TURNO',
                isPendenciaHerdada: true,
                turma: targetProximaTurma,
                atualizadoEm: nowIso,
              })
              .eq('id', inc.id);
          } catch (eInc) {}
        }

        // Se houve recomendações de ações para pendências
        if (pendenciasAcoes && Array.isArray(pendenciasAcoes)) {
          for (const item of pendenciasAcoes) {
            if (item.incidentId) {
              try {
                await supabase
                  .from('Incident')
                  .update({
                    motivoEspera: item.motivoEspera || undefined,
                    proximaAcao: item.proximaAcao || undefined,
                    prioridade: item.prioridade || undefined,
                  })
                  .eq('id', item.incidentId);
              } catch (eAct) {}
            }
          }
        }

        // Marcar o turno ativo como ENCERRADO no Supabase REST
        try {
          const { data: supaClosed } = await supabase
            .from('Shift')
            .update({
              status: 'ENCERRADO',
              horaFim: nowIso,
              turma: turma || supaActiveShift.turma,
              monitoramento: monitoramento || supaActiveShift.monitoramento,
              horarioTurno: horarioTurno || supaActiveShift.horarioTurno,
              observacoes: observacoesTurno || supaActiveShift.observacoes,
              checklistMalaoStatus,
              checklistMalaoFaltantes,
              checklistMalaoResponsavel,
              solicitacaoMaterialStatus,
              solicitacaoMaterialResponsavel,
              anomaliasIdentificadas,
            })
            .eq('id', supaActiveShift.id)
            .select('*')
            .single();

          if (supaClosed) closedShiftObj = supaClosed;
        } catch (eClose) {}

        // Criar registro de ShiftHandover no Supabase REST
        const handoverId = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `ho-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        try {
          await supabase
            .from('ShiftHandover')
            .insert([{
              id: handoverId,
              turnoAnteriorId: supaActiveShift.id,
              responsavelSaida: responsavelSaida || supaActiveShift.responsavelNome,
              turma: turma || supaActiveShift.turma,
              monitoramento: monitoramento || supaActiveShift.monitoramento,
              horarioTurno: horarioTurno || supaActiveShift.horarioTurno,
              checklistMalaoStatus,
              checklistMalaoFaltantes,
              checklistMalaoResponsavel,
              solicitacaoMaterialStatus,
              solicitacaoMaterialResponsavel,
              anomaliasIdentificadas,
              observacoes: observacoesTurno || supaActiveShift.observacoes,
              resumoFinalizados: JSON.stringify(
                finalizedIncidents.map((i: any) => ({
                  tag: i.tag,
                  equipamento: i.equipamentoNome,
                  falha: i.falha,
                  solucao: i.solucao,
                  responsavel: i.responsavel,
                }))
              ),
              resumoPendencias: JSON.stringify(
                openIncidents.map((i: any) => ({
                  tag: i.tag,
                  equipamento: i.equipamentoNome,
                  falha: i.falha,
                  status: i.status,
                  motivoEspera: i.motivoEspera,
                  proximaAcao: i.proximaAcao,
                  prioridade: i.prioridade,
                }))
              ),
              prioridades: JSON.stringify(
                criticalIncidents.map((i: any) => ({
                  tag: i.tag,
                  equipamento: i.equipamentoNome,
                  falha: i.falha,
                  prioridade: i.prioridade,
                }))
              ),
              dataHora: nowIso,
            }]);
        } catch (eHo) {}
      }
    } catch (supaErr) {
      console.warn('Alerta fechar turno Supabase REST:', supaErr);
    }

    // 2. PRISMA POSTGRESQL (Isolado e tolerante a falhas de rede)
    try {
      const turmaWhere = turmaTurno ? { turma: turmaInFilter(turmaTurno) } : {};
      const activeShift = await prisma.shift.findFirst({
        where: { status: 'ATIVO', ...turmaWhere },
      }).catch(() => null);

      if (activeShift) {
        const shiftTurma = normalizeTurma(activeShift.turma);
        const shiftTurmaWhere = shiftTurma ? { turma: turmaInFilter(shiftTurma) } : {};

        const openIncidents = await prisma.incident.findMany({
          where: {
            OR: [
              { status: { in: ['EM_ANDAMENTO', 'AGUARDANDO'] }, ...shiftTurmaWhere },
              { status: 'PENDENCIA_PROXIMO_TURNO', ...shiftTurmaWhere },
              { isPendenciaHerdada: true, status: { notIn: ['FINALIZADO', 'RETROAGIDO', 'EM_ANDAMENTO'] }, ...shiftTurmaWhere },
            ],
          },
        }).catch(() => []);

        for (const incident of openIncidents) {
          await prisma.incident.update({
            where: { id: incident.id },
            data: {
              status: 'PENDENCIA_PROXIMO_TURNO',
              isPendenciaHerdada: true,
              turma: targetProximaTurma,
            },
          }).catch(() => null);
        }

        const closedPrisma = await prisma.shift.update({
          where: { id: activeShift.id },
          data: {
            status: 'ENCERRADO',
            horaFim: new Date(),
            turma: turma || activeShift.turma,
            monitoramento: monitoramento || activeShift.monitoramento,
            horarioTurno: horarioTurno || activeShift.horarioTurno,
            observacoes: observacoesTurno || activeShift.observacoes,
            checklistMalaoStatus,
            checklistMalaoFaltantes,
            checklistMalaoResponsavel,
            solicitacaoMaterialStatus,
            solicitacaoMaterialResponsavel,
            anomaliasIdentificadas,
          },
        }).catch(() => null);

        if (!closedShiftObj && closedPrisma) closedShiftObj = closedPrisma;
      }
    } catch (prismaErr) {
      console.warn('Alerta Prisma fechar turno:', prismaErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Turno encerrado com sucesso',
      closedShift: closedShiftObj,
    });
  } catch (error) {
    console.error('Error closing shift:', error);
    return NextResponse.json({ error: 'Erro ao encerrar turno' }, { status: 500 });
  }
}
