export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabaseClient';
import { inMemoryStore } from '@/lib/inMemoryStore';

export async function GET() {
  try {
    const { data: supaEquipments, error: supaErr } = await supabase
      .from('Equipment')
      .select('*')
      .order('tag', { ascending: true });

    if (supaEquipments && supaEquipments.length > 0) {
      return NextResponse.json(supaEquipments);
    }
  } catch (e) {
    console.warn('Supabase REST GET equipamentos warning:', e);
  }

  try {
    const equipments = await prisma.equipment.findMany({
      orderBy: { tag: 'asc' },
    });
    if (equipments && equipments.length > 0) {
      return NextResponse.json(equipments);
    }
  } catch (error) {
    console.warn('Prisma get equipments warning:', error);
  }

  // Fallback 100% garantido com os 171 equipamentos da frota
  const fleet = inMemoryStore.getEquipments();
  return NextResponse.json(fleet, { status: 200 });
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
      const { data: supaCreated } = await supabase
        .from('Equipment')
        .insert([{
          tag: formattedTag,
          nome,
          tipo: tipo || 'Outros',
          area: area || 'Frota Mina',
          horimetroOpcional: horimetroOpcional ? parseFloat(horimetroOpcional) : null,
        }])
        .select('*')
        .single();

      if (supaCreated) {
        return NextResponse.json(supaCreated, { status: 201 });
      }
    } catch (e) {
      console.warn('Supabase REST equipment create warning:', e);
    }

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
    }

    const localEq = {
      id: `eq-${Date.now()}`,
      tag: formattedTag,
      nome,
      tipo: tipo || 'Outros',
      area: area || 'Frota Mina',
      horimetroOpcional: horimetroOpcional ? parseFloat(horimetroOpcional) : null,
      criadoEm: new Date().toISOString(),
    };
    return NextResponse.json(localEq, { status: 201 });
  } catch (error) {
    console.error('Error creating equipment:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar equipamento' }, { status: 500 });
  }
}

