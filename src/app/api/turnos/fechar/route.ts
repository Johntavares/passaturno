import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      responsavelSaida,
      turma,
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

    const activeShift = await prisma.shift.findFirst({
      where: { status: 'ATIVO' },
      include: {
        incidents: true,
      },
    });

    if (!activeShift) {
      return NextResponse.json({ error: 'Nenhum turno ativo para fechar' }, { status: 400 });
    }

    // Buscar atendimentos do turno e pendências
    const finalizedIncidents = await prisma.incident.findMany({
      where: {
        status: 'FINALIZADO',
        atualizadoEm: {
          gte: activeShift.horaInicio,
        },
      },
    });

    const openIncidents = await prisma.incident.findMany({
      where: {
        status: { in: ['EM_ANDAMENTO', 'AGUARDANDO', 'PENDENCIA_PROXIMO_TURNO'] },
      },
    });

    const criticalIncidents = openIncidents.filter((i) => i.prioridade === 'CRITICA' || i.prioridade === 'ALTA');

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
              historico: {
                create: {
                  tipoEvento: 'TRANSFERENCIA_TURNO',
                  descricao: `Nota de passagem de turno registrada por ${responsavelSaida}: Próxima Ação: ${item.proximaAcao || 'N/A'}`,
                  usuario: responsavelSaida,
                },
              },
            },
          });
        }
      }
    }

    // Encerrar o turno
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
    });
  } catch (error) {
    console.error('Error closing shift:', error);
    return NextResponse.json({ error: 'Erro ao fechar o turno' }, { status: 500 });
  }
}
