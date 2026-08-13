import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { inMemoryStore } from '@/lib/inMemoryStore';
import { normalizeTurma, turmaInFilter, getNextTurma } from '@/lib/turma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag') || undefined;
  const status = searchParams.get('status') || undefined;
  const prioridade = searchParams.get('prioridade') || undefined;
  const search = searchParams.get('search') || undefined;
  const turma = normalizeTurma(searchParams.get('turma'));

  try {
    const where: any = {};

    if (turma) {
      where.turma = turmaInFilter(turma);
    }

    if (tag) {
      where.tag = { contains: tag };
    }

    if (status) {
      where.status = status;
    }

    if (prioridade) {
      where.prioridade = prioridade;
    }

    if (search) {
      where.OR = [
        { tag: { contains: search } },
        { equipamentoNome: { contains: search } },
        { falha: { contains: search } },
        { responsavel: { contains: search } },
        { area: { contains: search } },
      ];
    }

    const incidents = await prisma.incident.findMany({
      where,
      include: {
        equipment: true,
        historico: {
          orderBy: { dataHora: 'desc' },
        },
      },
      orderBy: { criadoEm: 'desc' },
    });

    // Mescla atendimentos criados via fallback em memória (ex.: falha transitoria de conexao no POST),
    // para que eles continuem visiveis no painel mesmo quando o GET le o banco com sucesso.
    const memIncidents = inMemoryStore
      .getIncidents({ tag, status, prioridade, search })
      .filter(
        (i) =>
          i.isFallback &&
          !incidents.some((db) => db.id === i.id) &&
          (!turma || normalizeTurma(i.turma) === turma)
      );

    const merged = [...incidents, ...memIncidents].sort(
      (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
    );

    return NextResponse.json(merged);
  } catch (error) {
    console.warn('Fallback to inMemoryStore for GET /api/atendimentos:', error);
    const incidents = inMemoryStore.getIncidents({ tag, status, prioridade, search });
    if (turma) {
      return NextResponse.json(
        incidents.filter((i) => normalizeTurma(i.turma) === turma)
      );
    }
    return NextResponse.json(incidents);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tag,
      equipamentoNome,
      area,
      tipoFalha,
      falha,
      sintoma,
      dataHoraParada,
      dataHoraAcionamento,
      previsaoLiberacao,
      prioridade,
      status,
      responsavel,
      motivoEspera,
      proximaAcao,
      localizacaoAtualOpcional,
      observacao,
      turma,
      noCodigo,
      divisaoAtuacao,
    } = body;

    if (!tag || !falha || !responsavel) {
      return NextResponse.json({ error: 'TAG, Falha e Responsável são obrigatórios' }, { status: 400 });
    }

    try {
      // Buscar equipamento pela TAG para vincular
      const equipment = await prisma.equipment.findUnique({
        where: { tag: tag.toUpperCase().trim() },
      });

      const turmaNormalizada = normalizeTurma(turma) || undefined;

      // Buscar turno ativo atual DA MESMA TURMA (nunca de outra turma)
      const activeShift = await prisma.shift.findFirst({
        where: {
          status: 'ATIVO',
          ...(turmaNormalizada ? { turma: turmaInFilter(turmaNormalizada) } : {}),
        },
      });

      const isPendencia = status === 'PENDENCIA_PROXIMO_TURNO';
      const activeTurmaClean = turmaNormalizada || (activeShift?.turma ? normalizeTurma(activeShift.turma) : 'A');
      const finalTurma = isPendencia ? getNextTurma(activeTurmaClean) : activeTurmaClean;

      const incident = await prisma.incident.create({
        data: {
          tag: tag.toUpperCase().trim(),
          equipmentId: equipment?.id || null,
          equipamentoNome: equipamentoNome || equipment?.nome || `Equipamento ${tag}`,
          area: area || equipment?.area || 'Frota Mina',
          tipoFalha: tipoFalha || 'Comunicação',
          falha,
          sintoma,
          dataHoraParada: dataHoraParada ? new Date(dataHoraParada) : new Date(),
          dataHoraAcionamento: dataHoraAcionamento ? new Date(dataHoraAcionamento) : new Date(),
          previsaoLiberacao: previsaoLiberacao || null,
          prioridade: prioridade || 'MEDIA',
          status: status || 'EM_ANDAMENTO',
          responsavel,
          motivoEspera,
          proximaAcao,
          localizacaoAtualOpcional,
          observacao,
          shiftId: activeShift?.id || null,
          turma: finalTurma,
          divisaoAtuacao: divisaoAtuacao || 'MONITORAMENTO',
          isPendenciaHerdada: isPendencia,

          noCodigo: noCodigo === true,
          historico: {
            create: {
              tipoEvento: 'ABERTURA',
              descricao: `Ocorrência iniciada por ${responsavel}. Falha: ${falha}`,
              usuario: responsavel,
            },
          },
        },
        include: {
          historico: true,
        },
      });

      // Sincroniza em memória para garantir consistência imediata no polling
      try {
        inMemoryStore.createIncident({
          id: incident.id,
          tag: incident.tag,
          equipamentoNome: incident.equipamentoNome,
          area: incident.area,
          tipoFalha: incident.tipoFalha,
          falha: incident.falha,
          sintoma: incident.sintoma,
          dataHoraParada: incident.dataHoraParada.toISOString(),
          dataHoraAcionamento: incident.dataHoraAcionamento?.toISOString(),
          previsaoLiberacao: incident.previsaoLiberacao,
          prioridade: incident.prioridade,
          status: incident.status,
          responsavel: incident.responsavel,
          motivoEspera: incident.motivoEspera,
          proximaAcao: incident.proximaAcao,
          localizacaoAtualOpcional: incident.localizacaoAtualOpcional,
          observacao: incident.observacao,
          turma: incident.turma,
          noCodigo: incident.noCodigo,
          divisaoAtuacao: incident.divisaoAtuacao,
        } as any);
      } catch (e) {}

      return NextResponse.json(incident, { status: 201 });
    } catch (dbErr) {
      // Retry unico: falhas transitórias de rede costumam ser resolvidas na segunda tentativa,
      // garantindo que o atendimento seja gravado no banco (e não apenas em memória).
      console.warn('Tentativa 1 de criacao de atendimento falhou, tentando de novo:', dbErr);
      await new Promise((r) => setTimeout(r, 1200));
      try {
        const equipment = await prisma.equipment.findUnique({
          where: { tag: tag.toUpperCase().trim() },
        });

        const turmaNormalizada = normalizeTurma(turma) || undefined;

        const activeShift = await prisma.shift.findFirst({
          where: {
            status: 'ATIVO',
            ...(turmaNormalizada ? { turma: turmaInFilter(turmaNormalizada) } : {}),
          },
        });

        const isPendencia = status === 'PENDENCIA_PROXIMO_TURNO';
        const activeTurmaClean = turmaNormalizada || (activeShift?.turma ? normalizeTurma(activeShift.turma) : 'A');
        const finalTurma = isPendencia ? getNextTurma(activeTurmaClean) : activeTurmaClean;

        const incident = await prisma.incident.create({
          data: {
            tag: tag.toUpperCase().trim(),
            equipmentId: equipment?.id || null,
            equipamentoNome: equipamentoNome || equipment?.nome || `Equipamento ${tag}`,
            area: area || equipment?.area || 'Frota Mina',
            tipoFalha: tipoFalha || 'Comunicação',
            falha,
            sintoma,
            dataHoraParada: dataHoraParada ? new Date(dataHoraParada) : new Date(),
            dataHoraAcionamento: dataHoraAcionamento ? new Date(dataHoraAcionamento) : new Date(),
            previsaoLiberacao: previsaoLiberacao || null,
            prioridade: prioridade || 'MEDIA',
            status: status || 'EM_ANDAMENTO',
            responsavel,
            motivoEspera,
            proximaAcao,
            localizacaoAtualOpcional,
            observacao,
            shiftId: activeShift?.id || null,
            turma: finalTurma,
            isPendenciaHerdada: isPendencia,
            noCodigo: noCodigo === true,
            historico: {
              create: {
                tipoEvento: 'ABERTURA',
                descricao: `Ocorrência iniciada por ${responsavel}. Falha: ${falha}`,
                usuario: responsavel,
              },
            },
          },
          include: {
            historico: true,
          },
        });

        return NextResponse.json(incident, { status: 201 });
      } catch (dbErr2) {
        console.warn('Fallback to inMemoryStore for POST /api/atendimentos (apos retry):', dbErr2);
        const incident = inMemoryStore.createIncident(body);
        return NextResponse.json(incident, { status: 201 });
      }
    }
  } catch (error) {
    console.error('Error creating incident:', error);
    return NextResponse.json({ error: 'Erro ao criar atendimento' }, { status: 500 });
  }
}

