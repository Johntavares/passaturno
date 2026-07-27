import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ALL_PRESET_USERS = [
  {
    id: 'usr-john-tavares',
    nome: 'John Tavares',
    email: 'john.tavares@passaturno.com',
    matricula: '1001',
    senha: 'passaturno2026',
    equipe: 'Automação & CCO (Turma A)',
    cargo: 'Engenheiro de Automação',
    turma: 'A',
  },
  {
    id: 'usr-turma-b',
    nome: 'Operador Turma B',
    email: 'turma.b@passaturno.com',
    matricula: '1002',
    senha: 'passaturno2026',
    equipe: 'Automação & CCO (Turma B)',
    cargo: 'Técnico de Automação',
    turma: 'B',
  },
  {
    id: 'usr-turma-c',
    nome: 'Operador Turma C',
    email: 'turma.c@passaturno.com',
    matricula: '1003',
    senha: 'passaturno2026',
    equipe: 'Automação & CCO (Turma C)',
    cargo: 'Técnico de Automação',
    turma: 'C',
  },
  {
    id: 'usr-turma-d',
    nome: 'Operador Turma D',
    email: 'turma.d@passaturno.com',
    matricula: '1004',
    senha: 'passaturno2026',
    equipe: 'Automação & CCO (Turma D)',
    cargo: 'Técnico de Automação',
    turma: 'D',
  },
  {
    id: 'usr-lider-turma',
    nome: 'Líder da Turma',
    email: 'lider.turma@passaturno.com',
    matricula: '9001',
    senha: 'passaturno2026',
    equipe: 'Gestão Multiturmas (A, B, C, D)',
    cargo: 'LÍDER DE TURMA',
    turma: 'GERAL',
  },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { login, senha } = body;

    if (!login || !senha) {
      return NextResponse.json({ error: 'Matrícula/E-mail e Senha são obrigatórios' }, { status: 400 });
    }

    const cleanLogin = login.trim().toLowerCase();
    let user: any = null;

    // 1. Tentar buscar no banco de dados Prisma
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: cleanLogin } },
            { matricula: { equals: cleanLogin } },
            { nome: { equals: login.trim() } },
          ],
        },
      });
    } catch (dbError) {
      console.warn('Erro ao consultar banco de dados Prisma no login, recorrendo ao fallback:', dbError);
    }

    // 2. Fallback de Usuários Pré-cadastrados (Turmas A, B, C, D e Líder)
    if (!user) {
      user = ALL_PRESET_USERS.find(
        (u) =>
          u.matricula === cleanLogin ||
          u.email.toLowerCase() === cleanLogin ||
          u.nome.toLowerCase().includes(cleanLogin) ||
          (cleanLogin === 'a' && u.turma === 'A') ||
          (cleanLogin === 'b' && u.turma === 'B') ||
          (cleanLogin === 'c' && u.turma === 'C') ||
          (cleanLogin === 'd' && u.turma === 'D') ||
          (cleanLogin === 'lider' && u.cargo === 'LÍDER DE TURMA')
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não cadastrado. Utilize as matrículas 1001 (Turma A), 1002 (B), 1003 (C), 1004 (D) ou 9001 (Líder).' },
        { status: 404 }
      );
    }

    if (user.senha !== senha) {
      return NextResponse.json({ error: 'Senha incorreta. Verifique suas credenciais.' }, { status: 401 });
    }

    return NextResponse.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        matricula: user.matricula,
        equipe: user.equipe,
        cargo: user.cargo,
        turma: user.turma,
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json({ error: 'Erro interno ao realizar autenticação' }, { status: 500 });
  }
}

