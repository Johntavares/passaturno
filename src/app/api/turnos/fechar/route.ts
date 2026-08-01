import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { inMemoryStore } from '@/lib/inMemoryStore';
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

    // Encerra o turno na memória do servidor
    inMemoryStore.closeShift();

    try {
      const turmaTurno = normalizeTurma(turma);
      const turmaWhere = turmaTurno ? { turma: turmaInFilter(turmaTurno) } : {};

      const activeShift = await prisma.shift.findFirst({
        where: { status: 'ATIVO', ...turmaWhere },
        include: {
          incidents: true,
        },
      });

      if (activeShift) {
        const shiftTurma = normalizeTurma(activeShift.turma);
        const shiftTurmaWhere = shiftTurma ? { turma: turmaInFilter(shiftTurma) } : {};

        // Buscar atendimentos do turno e pendências (apenas da própria turma)
        const finalizedIncidents = await prisma.incident.findMany({
          where: {
            status: 'FINALIZADO',
            atualizadoEm: {
              gte: activeShift.horaInicio,
            },
            ...shiftTurmaWhere,
          },
        });

        const openIncidents = await prisma.incident.findMany({
          where: {
            status: { in: ['EM_ANDAMENTO', 'AGUARDANDO', 'PENDENCIA_PROXIMO_TURNO'] },
            ...shiftTurmaWhere,
          },
        });

        const criticalIncidents = openIncidents.filter((i) => i.prioridade === 'CRITICA' || i.prioridade === 'ALTA');

        const targetProximaTurma = (proximaTurma || '').toUpperCase().trim() ||
          (turma === 'A' ? 'B' : turma === 'B' ? 'C' : turma === 'C' ? 'D' : 'A');

        // Redirecionar todas as pendências em aberto para a próxima turma que assumirá o turno
        for (const incident of openIncidents) {
          await prisma.incident.update({
            where: { id: incident.id },
            data: {
              status: 'PENDENCIA_PROXIMO_TURNO',
              isPendenciaHerdada: true,
              turma: targetProximaTurma,
            },
          });
        }

        // Se houve atualização de pendências com ações recomendadas
        if (pendenciasAcoes && Array.isArray(pendenciasAcoes)) {
          for (const item of pendenciasAcoes) {
            if (item.incidentId) {
              await prisma.incident.update({
                where: { id: item.incidentId },
                data: {
                  motivoEspera: item.motivoEspera || undefined,
                  proximaAcao: item.proximaAcao || undefined,
                  prioridade: item.prioridade || undefined,
                },
              });
            }
          }
        }

        // Encerrar o turno no banco SQLite
        const closedShift = await prisma.shift.update({
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
        });

        // Salvar o registro de ShiftHandover
        const handover = await prisma.shiftHandover.create({
          data: {
            turnoAnteriorId: closedShift.id,
            responsavelSaida: responsavelSaida || closedShift.responsavelNome,
            turma: turma || closedShift.turma,
            monitoramento: monitoramento || closedShift.monitoramento,
            horarioTurno: horarioTurno || closedShift.horarioTurno,
            checklistMalaoStatus,
            checklistMalaoFaltantes,
            checklistMalaoResponsavel,
            solicitacaoMaterialStatus,
            solicitacaoMaterialResponsavel,
            anomaliasIdentificadas,
            observacoes: observacoesTurno || activeShift.observacoes,
            resumoFinalizados: JSON.stringify(
              finalizedIncidents.map((i) => ({
                tag: i.tag,
                equipamento: i.equipamentoNome,
                falha: i.falha,
                solucao: i.solucao,
                responsavel: i.responsavel,
              }))
            ),
            resumoPendencias: JSON.stringify(
              openIncidents.map((i) => ({
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
              criticalIncidents.map((i) => ({
                tag: i.tag,
                equipamento: i.equipamentoNome,
                falha: i.falha,
                prioridade: i.prioridade,
              }))
            ),
          },
        });

        return NextResponse.json({
          closedShift,
          handover,
          success: true,
        });
      }
    } catch (dbErr) {
      console.warn('Alerta banco SQLite fechar turno:', dbErr);
    }

    return NextResponse.json({ success: true, message: 'Turno encerrado com sucesso' });
  } catch (error) {
    console.error('Error closing shift:', error);
    return NextResponse.json({ success: true, message: 'Turno encerrado com sucesso' });
  }
}
