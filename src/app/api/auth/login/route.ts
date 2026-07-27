import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Usuário único oficial do PASSATURNO
const OFFICIAL_USER = {
  id: 'usr-john-tavares',
  nome: 'John Tavares',
  email: 'john.tavares@passaturno.com',
  matricula: '1001',
  senha: 'passaturno2026',
  equipe: 'Automação & CCO',
  cargo: 'Engenheiro de Automação',
};

const DEFAULT_USERS = [OFFICIAL_USER];

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

    // 2. Se não encontrar no banco ou se o banco estiver indisponível no serverless, aceitar credenciais do John Tavares
    if (!user) {
      const isMatch =
        cleanLogin === '1001' ||
        cleanLogin === 'admin' ||
        cleanLogin === 'john' ||
        cleanLogin === 'john.tavares' ||
        cleanLogin === 'john tavares' ||
        cleanLogin === 'john.tavares@passaturno.com' ||
        cleanLogin === 'john@passaturno.com';

      if (isMatch) {
        user = OFFICIAL_USER;
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não cadastrado. Utilize a matrícula 1001 ou o e-mail john.tavares@passaturno.com.' },
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
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json({ error: 'Erro interno ao realizar autenticação' }, { status: 500 });
  }
}

