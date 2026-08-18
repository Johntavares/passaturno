import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export interface BoletimCarteiraType {
  turma: string;
  data: string;
  total?: string;
  andamento?: string;
  aberto?: string;
  pendente?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const turma = (searchParams.get('turma') || 'A').toUpperCase().trim();
    const data = (searchParams.get('data') || '').trim();
    if (!data) {
      return NextResponse.json({ error: 'Parâmetro data é obrigatório' }, { status: 400 });
    }

    const { data: row, error } = await supabase
      .from('BoletimCarteira')
      .select('*')
      .eq('turma', turma)
      .eq('data', data)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar carteira do boletim' }, { status: 500 });
    }
    return NextResponse.json(row || null);
  } catch (error) {
    console.error('Erro ao buscar carteira do boletim:', error);
    return NextResponse.json({ error: 'Erro ao buscar carteira do boletim' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const turma = ((body?.turma || 'A') as string).toUpperCase().trim();
    const data = ((body?.data || '') as string).trim();
    if (!['A', 'B', 'C', 'D'].includes(turma)) {
      return NextResponse.json({ error: 'Turma inválida' }, { status: 400 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Parâmetro data é obrigatório' }, { status: 400 });
    }

    const fields: any = { turma, data, atualizadoEm: new Date().toISOString() };
    for (const key of ['total', 'andamento', 'aberto', 'pendente']) {
      if (body[key] !== undefined) fields[key] = String(body[key]);
    }

    const { data: row, error } = await supabase
      .from('BoletimCarteira')
      .upsert(fields, { onConflict: 'turma,data' })
      .select('*')
      .single();

    if (error || !row) {
      return NextResponse.json({ error: 'Não foi possível salvar a carteira do boletim no banco' }, { status: 500 });
    }
    return NextResponse.json(row);
  } catch (error) {
    console.error('Erro ao salvar carteira do boletim:', error);
    return NextResponse.json({ error: 'Erro ao salvar carteira do boletim' }, { status: 500 });
  }
}