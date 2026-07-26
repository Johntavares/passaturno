import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    const status = searchParams.get('status');
    const prioridade = searchParams.get('prioridade');
    const search = searchParams.get('search');

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
    console.error('Error fetching incidents:', error);
    return NextResponse.json({ error: 'Erro ao buscar atendimentos' }, { status: 500 });
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

    // Buscar equipamento pela TAG para vincular
    const equipment = await prisma.equipment.findUnique({
      where: { tag },
    });

    // Buscar turno ativo atual
    const activeShift = await prisma.shift.findFirst({
      where: { status: 'ATIVO' },
    });

    const incident = await prisma.incident.create({
      data: {
        tag: tag.toUpperCase(),
        equipmentId: equipment?.id || null,
        equipamentoNome: equipamentoNome || equipment?.nome || `Equipamento ${tag}`,
        area: area || equipment?.area || 'Frota Mina',
        tipoFalha: tipoFalha || 'Comunicação',
        falha,
        sintoma,
        dataHoraParada: dataHoraParada ? new Date(dataHoraParada) : new Date(),
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
  } catch (error) {
    console.error('Error creating incident:', error);
    return NextResponse.json({ error: 'Erro ao criar atendimento' }, { status: 500 });
  }
}
