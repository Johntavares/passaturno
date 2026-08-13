export const dynamic = 'force-dynamic';
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

    // Auto-seed de equipamentos no banco de dados Supabase se estiver vazio
    try {
      const defaultFleet = inMemoryStore.getEquipments();
      for (const eq of defaultFleet) {
        await prisma.equipment.upsert({
          where: { tag: eq.tag },
          update: {},
          create: {
            tag: eq.tag,
            nome: eq.nome,
            tipo: eq.tipo,
            area: eq.area,
          },
        });
      }
      const seeded = await prisma.equipment.findMany({
        orderBy: { tag: 'asc' },
        include: {
          _count: {
            select: { incidents: true },
          },
        },
      });
      return NextResponse.json(seeded);
    } catch (e) {
      console.error('Erro ao fazer auto-seed de equipamentos no Supabase:', e);
      return NextResponse.json({ error: 'Erro ao buscar equipamentos' }, { status: 500 });
    }
  } catch (error) {
    console.error('Erro ao buscar equipamentos no Supabase:', error);
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
      console.error('Erro ao cadastrar equipamento no Supabase:', dbErr);
      return NextResponse.json({ error: 'Erro ao cadastrar equipamento' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error creating equipment:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar equipamento' }, { status: 500 });
  }
}

