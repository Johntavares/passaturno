import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const equipments = await prisma.equipment.findMany({
      orderBy: { tag: 'asc' },
      include: {
        _count: {
          select: { incidents: true },
        },
      },
    });
    return NextResponse.json(equipments);
  } catch (error) {
    console.error('Error fetching equipments:', error);
    return NextResponse.json({ error: 'Erro ao buscar equipamentos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tag, nome, tipo, area, horimetroOpcional } = body;

    if (!tag || !nome) {
      return NextResponse.json({ error: 'TAG e Nome são obrigatórios' }, { status: 400 });
    }

    const formattedTag = tag.toUpperCase().trim();

    const existing = await prisma.equipment.findUnique({
      where: { tag: formattedTag },
    });

    if (existing) {
      return NextResponse.json({ error: 'Equipamento com esta TAG já está cadastrado' }, { status: 400 });
    }

    const equipment = await prisma.equipment.create({
      data: {
        tag: formattedTag,
        nome,
        tipo: tipo || 'Outros',
        area: area || 'Frota Mina',
        horimetroOpcional: horimetroOpcional ? parseFloat(horimetroOpcional) : null,
      },
    });

    return NextResponse.json(equipment, { status: 201 });
  } catch (error) {
    console.error('Error creating equipment:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar equipamento' }, { status: 500 });
  }
}
