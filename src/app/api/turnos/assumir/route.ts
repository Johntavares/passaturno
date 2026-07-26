import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { equipe, responsavelNome, observacoes } = body;

    if (!equipe || !responsavelNome) {
      return NextResponse.json({ error: 'Equipe e Nome do Responsável são obrigatórios' }, { status: 400 });
    }

    // 1. Encerrar qualquer turno ativo anterior
    const activeShift = await prisma.shift.findFirst({
      where: { status: 'ATIVO' },
    });

    if (activeShift) {
      await prisma.shift.update({
        where: { id: activeShift.id },
        data: {
          status: 'ENCERRADO',
          horaFim: new Date(),
        },
      });
    }

    // 2. Marcar todas as ocorrências não finalizadas como "Pendências Herdadas" (isPendenciaHerdada = true)
    const openIncidents = await prisma.incident.findMany({
      where: {
        status: { in: ['EM_ANDAMENTO', 'AGUARDANDO', 'PENDENCIA_PROXIMO_TURNO'] },
      },
    });

    for (const incident of openIncidents) {
      await prisma.incident.update({
        where: { id: incident.id },
        data: {
          isPendenciaHerdada: true,
          status: incident.status === 'EM_ANDAMENTO' ? 'PENDENCIA_PROXIMO_TURNO' : incident.status,
          historico: {
            create: {
              tipoEvento: 'TRANSFERENCIA_TURNO',
              descricao: `Ocorrência transferida para a nova equipe (${equipe} - Responsável: ${responsavelNome}).`,
              usuario: responsavelNome,
            },
          },
        },
      });
    }

    // 3. Criar o novo turno ativo
    const today = new Date().toISOString().split('T')[0];
    const newShift = await prisma.shift.create({
      data: {
        equipe,
        responsavelNome,
        data: today,
        horaInicio: new Date(),
        status: 'ATIVO',
        observacoes,
      },
    });

    return NextResponse.json(newShift, { status: 201 });
  } catch (error) {
    console.error('Error assuming shift:', error);
    return NextResponse.json({ error: 'Erro ao assumir o turno' }, { status: 500 });
  }
}
