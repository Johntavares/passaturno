import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { inMemoryStore } from '@/lib/inMemoryStore';

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
    if (equipments && equipments.length > 0) {
      return NextResponse.json(equipments);
    }
    return NextResponse.json(inMemoryStore.getEquipments());
  } catch (error) {
    console.warn('Fallback to inMemoryStore for GET /api/equipamentos:', error);
    return NextResponse.json(inMemoryStore.getEquipments());
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

    try {
      const existing = await prisma.equipment.findUnique({
        where: { tag: formattedTag },
      });

      if (existing) {
        return NextResponse.json(existing, { status: 200 });
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
    } catch (dbErr) {
      console.warn('Fallback to inMemoryStore for POST /api/equipamentos:', dbErr);
      const eq = inMemoryStore.addEquipment({
        tag: formattedTag,
        nome,
        tipo,
        area,
        horimetroOpcional: horimetroOpcional ? parseFloat(horimetroOpcional) : null,
      });
      return NextResponse.json(eq, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating equipment:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar equipamento' }, { status: 500 });
  }
}

