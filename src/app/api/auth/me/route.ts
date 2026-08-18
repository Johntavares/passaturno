export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabaseClient';

// GET /api/auth/me?id=xxx  ou  ?matricula=xxx
// Retorna os dados mais frescos do usuário diretamente do banco.
// Usado para sincronizar a sessão do browser sempre que a página carrega.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const matricula = searchParams.get('matricula');

    if (!id && !matricula) {
      return NextResponse.json({ error: 'Parâmetro id ou matricula obrigatório' }, { status: 400 });
    }

    let user: any = null;

    // 1. Supabase REST
    try {
      const query = supabase
        .from('User')
        .select('id, nome, email, matricula, equipe, cargo, turma, horarioTurno, periodoTurno, escala, diaEscala');

      const { data } = id
        ? await query.eq('id', id).single()
        : await query.eq('matricula', matricula!).single();

      if (data) user = data;
    } catch (e) {}

    // 2. Prisma fallback
    if (!user) {
      user = await prisma.user.findFirst({
        where: id ? { id } : { matricula: matricula! },
        select: {
          id: true, nome: true, email: true, matricula: true,
          equipe: true, cargo: true, turma: true,
          horarioTurno: true, periodoTurno: true,
          escala: true, diaEscala: true,
        },
      }).catch(() => null);
    }

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Erro em /api/auth/me:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
