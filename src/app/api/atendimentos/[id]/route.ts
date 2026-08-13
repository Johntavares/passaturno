export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabaseClient';
import { normalizeTurma, getNextTurma } from '@/lib/turma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { data: supaIncident } = await supabase
      .from('Incident')
      .select('*, IncidentHistory(*), historico:IncidentHistory(*)')
      .eq('id', id)
      .single();

    if (supaIncident) {
      const hist = (supaIncident.historico && supaIncident.historico.length > 0) ? supaIncident.historico : (supaIncident.IncidentHistory || []);
      if (Array.isArray(hist)) {
        hist.sort((a: any, b: any) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
      }
      return NextResponse.json({ ...supaIncident, historico: hist });
    }
  } catch (e) {
    console.warn('Supabase REST GET id warning:', e);
  }

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
    console.error('Erro ao buscar atendimento no Supabase:', error);
    return NextResponse.json({ error: 'Erro ao buscar atendimento' }, { status: 500 });
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
    // Buscar atendimento atual
    let currentIncident: any = null;
    try {
      const { data: supaInc } = await supabase
        .from('Incident')
        .select('*, IncidentHistory(*), historico:IncidentHistory(*)')
        .eq('id', id)
        .single();
      if (supaInc) currentIncident = supaInc;
    } catch (e) {}

    if (!currentIncident) {
      currentIncident = await prisma.incident.findUnique({ where: { id } });
    }

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

      const updateData: any = {
        atualizadoEm: new Date().toISOString(),
      };

      let eventType = 'ATUALIZACAO';
      let defaultLogDesc = 'Atendimento atualizado.';

      if (status && status !== currentIncident.status) {
        updateData.status = status;
        eventType = 'ALTERACAO_STATUS';
        defaultLogDesc = `Status alterado de ${currentIncident.status} para ${status}.`;

        if (status === 'PENDENCIA_PROXIMO_TURNO') {
          updateData.isPendenciaHerdada = true;
          if (!body.turma) {
            updateData.turma = getNextTurma(currentIncident.turma);
          }
        } else if (status === 'FINALIZADO') {
          updateData.dataHoraLiberacao = new Date().toISOString();
          eventType = 'LIBERACAO';
          defaultLogDesc = `Equipamento liberado por ${logUsuario || responsavel || currentIncident.responsavel}.`;
        } else if (status === 'RETROAGIDO') {
          if (!currentIncident.dataHoraLiberacao) {
            updateData.dataHoraLiberacao = new Date().toISOString();
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
      if (body.isPendenciaHerdada !== undefined) updateData.isPendenciaHerdada = body.isPendenciaHerdada;
      if (body.noCodigo !== undefined) {
        updateData.noCodigo = body.noCodigo === true;
        if (body.noCodigo === true && (!status || status === 'EM_ANDAMENTO')) {
          updateData.status = 'EM_ANDAMENTO';
          defaultLogDesc = `Atendimento movido para a Fila de No Código por ${logUsuario || responsavel || currentIncident.responsavel}.`;
        }
      }
      if (body.turma) updateData.turma = normalizeTurma(body.turma) || body.turma;
      if (body.divisaoAtuacao) updateData.divisaoAtuacao = body.divisaoAtuacao;

      // 1. Inserir histórico no Supabase REST primeiro
      try {
        await supabase
          .from('IncidentHistory')
          .insert([{
            id: typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            incidentId: id,
            tipoEvento: eventType,
            descricao: logDescription || defaultLogDesc,
            usuario: logUsuario || responsavel || currentIncident.responsavel,
            dataHora: new Date().toISOString(),
          }]);
      } catch (eHist) {
        console.warn('Supabase REST History insert warning:', eHist);
      }

      // 2. Atualizar Supabase REST imediatamente e retornar com historico completo
      let updatedIncident: any = null;
      try {
        const { data: supaUpdated, error: supaErr } = await supabase
          .from('Incident')
          .update(updateData)
          .eq('id', id)
          .select('*, IncidentHistory(*), historico:IncidentHistory(*)')
          .single();

        if (supaUpdated) {
          if (supaUpdated.historico && Array.isArray(supaUpdated.historico)) {
            supaUpdated.historico.sort((a: any, b: any) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
          }
          updatedIncident = supaUpdated;
        }
      } catch (eSupa) {
        console.warn('Supabase REST PATCH warning:', eSupa);
      }

      // 2. Atualizar Prisma PostgreSQL
      try {
        const prismaUpdated = await prisma.incident.update({
          where: { id },
          data: {
            ...updateData,
            dataHoraLiberacao: updateData.dataHoraLiberacao ? new Date(updateData.dataHoraLiberacao) : undefined,
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
        if (!updatedIncident) updatedIncident = prismaUpdated;
      } catch (ePrisma) {
        console.warn('Prisma PATCH warning:', ePrisma);
      }

      if (updatedIncident) {
        return NextResponse.json(updatedIncident);
      }
    }
  } catch (error) {
    console.error('Erro ao atualizar atendimento:', error);
  }

  return NextResponse.json({ error: 'Erro ao atualizar atendimento' }, { status: 500 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Deletar do Supabase REST
    try {
      await supabase.from('IncidentHistory').delete().eq('incidentId', id);
      await supabase.from('Incident').delete().eq('id', id);
    } catch (eSupa) {}

    // Deletar do Prisma
    try {
      await prisma.incident.delete({ where: { id } });
    } catch (ePrisma) {}

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir atendimento:', error);
    return NextResponse.json({ error: 'Erro ao excluir atendimento' }, { status: 500 });
  }
}
