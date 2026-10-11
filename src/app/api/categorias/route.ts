import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { prisma } from '@/lib/prisma';

const DEFAULT_CATEGORIES = [
  'CASGPS',
  'OPTALERT',
  'MEMES',
  'DESMONTE',
  'TELEOP',
  'AUTONOMOS',
  'MODULAR',
  'ALIMENTAÇÃO/ELETRICA',
  'MOVIMENTAÇÃO',
  'COMUNICAÇÃO',
  'TELEMETRIA',
];

async function listCategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('FailureCategory')
      .select('nome')
      .order('criadoEm', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((r: any) => r.nome);
    }
  } catch (e) {}

  try {
    const rows = await prisma.failureCategory.findMany({
      select: { nome: true },
      orderBy: { criadoEm: 'asc' },
    });
    if (rows && rows.length > 0) {
      return rows.map((r) => r.nome);
    }
  } catch (e) {}

  return DEFAULT_CATEGORIES;
}

export async function GET() {
  try {
    const categories = await listCategories();
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error('Erro ao listar categorias:', error);
    return NextResponse.json(DEFAULT_CATEGORIES);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nome = (body?.nome || '').trim();
    if (!nome) {
      return NextResponse.json({ error: 'Nome da categoria é obrigatório' }, { status: 400 });
    }

    const existing = await listCategories();
    if (existing.some((c) => c.toLowerCase() === nome.toLowerCase())) {
      return NextResponse.json({ error: 'Categoria já existe' }, { status: 409 });
    }

    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `cat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const { error } = await supabase
      .from('FailureCategory')
      .insert([{ id, nome, criadoEm: new Date().toISOString() }]);

    if (error) {
      if (error.message?.toLowerCase().includes('duplicate')) {
        return NextResponse.json({ error: 'Categoria já existe' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Não foi possível salvar a categoria no banco' }, { status: 500 });
    }

    return NextResponse.json(await listCategories(), { status: 201 });
  } catch (error) {
    console.error('Erro ao adicionar categoria:', error);
    return NextResponse.json({ error: 'Erro ao adicionar categoria' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const antigo = (body?.antigo || '').trim();
    const novo = (body?.novo || '').trim();
    if (!antigo || !novo) {
      return NextResponse.json({ error: 'Nome antigo e novo são obrigatórios' }, { status: 400 });
    }

    const existing = await listCategories();
    if (existing.some((c) => c.toLowerCase() === novo.toLowerCase() && c.toLowerCase() !== antigo.toLowerCase())) {
      return NextResponse.json({ error: 'Já existe outra categoria com esse nome' }, { status: 409 });
    }

    const { data: rows, error } = await supabase
      .from('FailureCategory')
      .update({ nome: novo, atualizadoEm: new Date().toISOString() })
      .ilike('nome', antigo)
      .select('id');

    if (error) {
      return NextResponse.json({ error: 'Não foi possível atualizar a categoria no banco' }, { status: 500 });
    }
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }

    return NextResponse.json(await listCategories());
  } catch (error) {
    console.error('Erro ao editar categoria:', error);
    return NextResponse.json({ error: 'Erro ao editar categoria' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const nome = ((body?.nome as string) || '').trim();
    if (!nome) {
      return NextResponse.json({ error: 'Nome da categoria é obrigatório' }, { status: 400 });
    }

    const { data: rows, error } = await supabase
      .from('FailureCategory')
      .delete()
      .ilike('nome', nome)
      .select('id');

    if (error) {
      return NextResponse.json({ error: 'Não foi possível remover a categoria no banco' }, { status: 500 });
    }
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }

    return NextResponse.json(await listCategories());
  } catch (error) {
    console.error('Erro ao remover categoria:', error);
    return NextResponse.json({ error: 'Erro ao remover categoria' }, { status: 500 });
  }
}