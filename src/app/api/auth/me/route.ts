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

    // Mapeamento de contingência para IDs fictícios do frontend
    const mockIdToMatricula: Record<string, string> = {
      'usr-turma-a-def': '1001',
      'usr-turma-b-def': '1002',
      'usr-turma-c-def': '1003',
      'usr-turma-d-def': '1004',
      'usr-lider-def': '9999',
      'usr-john-def': '8888',
      'usr-turma-a-official': '1001',
      'usr-turma-b-official': '1002',
      'usr-turma-c-official': '1003',
      'usr-turma-d-official': '1004',
    };

    const targetMatricula = matricula || (id ? mockIdToMatricula[id] : null);

    let user: any = null;

    // 1. Supabase REST
    try {
      const query = supabase
        .from('User')
        .select('id, nome, email, matricula, equipe, cargo, turma, horarioTurno, periodoTurno, escala, diaEscala');

      const { data, error } = id
        ? await query.eq('id', id).single()
        : await query.eq('matricula', matricula!).single();

      if (!error && data) user = data;

      if (!user && targetMatricula) {
        const { data: byMat, error: errMat } = await supabase
          .from('User')
          .select('id, nome, email, matricula, equipe, cargo, turma, horarioTurno, periodoTurno, escala, diaEscala')
          .eq('matricula', targetMatricula)
          .single();
        if (!errMat && byMat) user = byMat;
      }
    } catch (e) {}

    // 2. Prisma fallback
    if (!user) {
      const orConditions: any[] = [];
      if (id) orConditions.push({ id });
      if (targetMatricula) orConditions.push({ matricula: targetMatricula });

      user = await prisma.user.findFirst({
        where: orConditions.length > 1 ? { OR: orConditions } : orConditions[0] || {},
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
