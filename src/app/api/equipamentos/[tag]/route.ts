import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tag: string }> }
) {
  try {
    const { tag } = await params;
    const formattedTag = decodeURIComponent(tag).toUpperCase();

    const equipment = await prisma.equipment.findUnique({
      where: { tag: formattedTag },
      include: {
        incidents: {
          orderBy: { criadoEm: 'desc' },
          include: {
            shift: true,
            historico: {
              orderBy: { dataHora: 'asc' },
            },
          },
        },
      },
    });

    if (!equipment) {
      // Se não achar o equipamento cadastrado diretamente, buscar atendimentos pela TAG isolada
      const incidents = await prisma.incident.findMany({
        where: { tag: formattedTag },
        orderBy: { criadoEm: 'desc' },
        include: {
          shift: true,
          historico: {
            orderBy: { dataHora: 'asc' },
          },
        },
      });

      if (incidents.length === 0) {
        return NextResponse.json({ error: 'Nenhum histórico encontrado para esta TAG' }, { status: 404 });
      }

      return NextResponse.json({
        tag: formattedTag,
        nome: incidents[0].equipamentoNome,
        tipo: 'Desconhecido',
        area: incidents[0].area,
        incidents,
      });
    }

    return NextResponse.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment by TAG:', error);
    return NextResponse.json({ error: 'Erro ao buscar histórico da TAG' }, { status: 500 });
  }
}
