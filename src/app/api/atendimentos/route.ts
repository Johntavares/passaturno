import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { inMemoryStore } from '@/lib/inMemoryStore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag') || undefined;
  const status = searchParams.get('status') || undefined;
  const prioridade = searchParams.get('prioridade') || undefined;
  const search = searchParams.get('search') || undefined;

  try {
    const where: any = {};

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

    return NextResponse.json(incidents);
  } catch (error) {
    console.warn('Fallback to inMemoryStore for GET /api/atendimentos:', error);
    const incidents = inMemoryStore.getIncidents({ tag, status, prioridade, search });
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
    } = body;

    if (!tag || !falha || !responsavel) {
      return NextResponse.json({ error: 'TAG, Falha e Responsável são obrigatórios' }, { status: 400 });
    }

    try {
      // Buscar equipamento pela TAG para vincular
      const equipment = await prisma.equipment.findUnique({
        where: { tag: tag.toUpperCase().trim() },
      });

      // Buscar turno ativo atual
      const activeShift = await prisma.shift.findFirst({
        where: { status: 'ATIVO' },
      });

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
          isPendenciaHerdada: false,
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
    } catch (dbErr) {
      console.warn('Fallback to inMemoryStore for POST /api/atendimentos:', dbErr);
      const incident = inMemoryStore.createIncident(body);
      return NextResponse.json(incident, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating incident:', error);
    return NextResponse.json({ error: 'Erro ao criar atendimento' }, { status: 500 });
  }
}

