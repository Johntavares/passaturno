import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const DEFAULT_FAILURE_CATEGORIES = [
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

export async function POST() {
  try {
    const { error: delErr } = await supabase.from('FailureCategory').delete().neq('id', '');
    if (delErr) {
      return NextResponse.json({ error: 'Não foi possível restaurar o padrão no banco' }, { status: 500 });
    }

    const now = new Date().toISOString();
    const rows = DEFAULT_FAILURE_CATEGORIES.map((nome) => ({
      id: typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `cat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      nome,
      criadoEm: now,
    }));

    const { error: insErr } = await supabase.from('FailureCategory').insert(rows);
    if (insErr) {
      return NextResponse.json({ error: 'Não foi possível restaurar o padrão no banco' }, { status: 500 });
    }

    const { data } = await supabase
      .from('FailureCategory')
      .select('nome')
      .order('criadoEm', { ascending: true });

    return NextResponse.json(data ? data.map((r: any) => r.nome) : []);
  } catch (error) {
    console.error('Erro ao restaurar categorias padrão:', error);
    return NextResponse.json({ error: 'Erro ao restaurar categorias padrão' }, { status: 500 });
  }
}