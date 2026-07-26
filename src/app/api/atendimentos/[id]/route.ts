import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        equipment: true,
        historico: {
          orderBy: { dataHora: 'desc' },
        },
      },
    });

    if (!incident) {
      return NextResponse.json({ error: 'Atendimento não encontrado' }, { status: 404 });
    }

    return NextResponse.json(incident);
  } catch (error) {
    console.error('Error fetching incident details:', error);
    return NextResponse.json({ error: 'Erro ao buscar detalhes' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      status,
      solucao,
      motivoEspera,
      proximaAcao,
      prioridade,
      responsavel,
      observacao,
      previsaoLiberacao,
      logDescription,
      logUsuario,
    } = body;

    const currentIncident = await prisma.incident.findUnique({
      where: { id },
    });

    if (!currentIncident) {
      return NextResponse.json({ error: 'Atendimento não encontrado' }, { status: 404 });
    }

    const updateData: any = {};
    let eventType = 'ATUALIZACAO';
    let defaultLogDesc = 'Atendimento atualizado.';

    if (status && status !== currentIncident.status) {
      updateData.status = status;
      eventType = 'ALTERACAO_STATUS';
      defaultLogDesc = `Status alterado de ${currentIncident.status} para ${status}.`;

      if (status === 'FINALIZADO') {
        updateData.dataHoraLiberacao = new Date();
        eventType = 'LIBERACAO';
        defaultLogDesc = `Equipamento liberado por ${logUsuario || responsavel || currentIncident.responsavel}.`;
      }
    }

    if (solucao) {
      updateData.solucao = solucao;
      eventType = 'SOLUCAO';
      defaultLogDesc = `Solução aplicada: ${solucao}`;
    }

    if (motivoEspera !== undefined) updateData.motivoEspera = motivoEspera;
    if (proximaAcao !== undefined) updateData.proximaAcao = proximaAcao;
    if (prioridade) updateData.prioridade = prioridade;
    if (responsavel) updateData.responsavel = responsavel;
    if (observacao !== undefined) updateData.observacao = observacao;
    if (previsaoLiberacao !== undefined) updateData.previsaoLiberacao = previsaoLiberacao;

    const updatedIncident = await prisma.incident.update({
      where: { id },
      data: {
        ...updateData,
        historico: {
          create: {
            tipoEvento: eventType as any,
            descricao: logDescription || defaultLogDesc,
            usuario: logUsuario || responsavel || currentIncident.responsavel,
          },
        },
      },
      include: {
        historico: {
          orderBy: { dataHora: 'desc' },
        },
      },
    });

    return NextResponse.json(updatedIncident);
  } catch (error) {
    console.error('Error updating incident:', error);
    return NextResponse.json({ error: 'Erro ao atualizar atendimento' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.incident.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting incident:', error);
    return NextResponse.json({ error: 'Erro ao excluir atendimento' }, { status: 500 });
  }
}
