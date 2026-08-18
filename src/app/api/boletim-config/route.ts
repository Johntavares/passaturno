import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export interface BoletimConfigType {
  turma: string;
  equipeSonda?: string;
  liderVale?: string;
  ausencia?: string;
  equipSemDespacho?: string;
  equipSemGps?: string;
  equipPreventiva?: string;
  equipManutencao?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const turma = (searchParams.get('turma') || 'A').toUpperCase().trim();

    const { data, error } = await supabase
      .from('BoletimConfig')
      .select('*')
      .eq('turma', turma)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar configuração do boletim' }, { status: 500 });
    }
    return NextResponse.json(data || null);
  } catch (error) {
    console.error('Erro ao buscar boletim config:', error);
    return NextResponse.json({ error: 'Erro ao buscar configuração do boletim' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const turma = ((body?.turma || 'A') as string).toUpperCase().trim();
    if (!['A', 'B', 'C', 'D'].includes(turma)) {
      return NextResponse.json({ error: 'Turma inválida' }, { status: 400 });
    }

    const fields: any = {};
    for (const key of ['equipeSonda', 'liderVale', 'ausencia', 'equipSemDespacho', 'equipSemGps', 'equipPreventiva', 'equipManutencao']) {
      if (body[key] !== undefined) fields[key] = String(body[key]);
    }
    fields.atualizadoEm = new Date().toISOString();

    const { data, error } = await supabase
      .from('BoletimConfig')
      .upsert({ turma, ...fields }, { onConflict: 'turma' })
      .select('*')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Não foi possível salvar a configuração do boletim no banco' }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao salvar boletim config:', error);
    return NextResponse.json({ error: 'Erro ao salvar configuração do boletim' }, { status: 500 });
  }
}