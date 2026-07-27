import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { inMemoryStore } from '@/lib/inMemoryStore';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        equipment: true,
        historico: {
          orderBy: { dataHora: 'desc' },
        },
      },
    });

    if (incident) {
      return NextResponse.json(incident);
    }
  } catch (error) {
    console.warn('Fallback to inMemoryStore for GET /api/atendimentos/[id]:', error);
  }

  const memInc = inMemoryStore.findIncidentById(id);
  if (memInc) {
    return NextResponse.json(memInc);
  }
  return NextResponse.json({ error: 'Atendimento não encontrado' }, { status: 404 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  try {
    const currentIncident = await prisma.incident.findUnique({
      where: { id },
    });

    if (currentIncident) {
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
        } else if (status === 'RETROAGIDO') {
          if (!currentIncident.dataHoraLiberacao) {
            updateData.dataHoraLiberacao = new Date();
          }
          eventType = 'RETROACAO';
          defaultLogDesc = `Atendimento retroagido por ${logUsuario || responsavel || currentIncident.responsavel} (Constatado que não era falha de automação).`;
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
    }
  } catch (error) {
    console.warn('Fallback to inMemoryStore for PATCH /api/atendimentos/[id]:', error);
  }

  const updated = inMemoryStore.updateIncident(id, body);
  if (updated) {
    return NextResponse.json(updated);
  }
  return NextResponse.json({ error: 'Erro ao atualizar atendimento' }, { status: 500 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.incident.delete({
      where: { id },
    });
  } catch (error) {
    console.warn('Fallback to inMemoryStore for DELETE /api/atendimentos/[id]:', error);
  }

  inMemoryStore.deleteIncident(id);
  return NextResponse.json({ success: true });
}

