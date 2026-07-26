import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { login, senha } = body;

    if (!login || !senha) {
      return NextResponse.json({ error: 'Matrícula/E-mail e Senha são obrigatórios' }, { status: 400 });
    }

    const cleanLogin = login.trim().toLowerCase();

    // Procurar por e-mail, matrícula ou nome
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanLogin } },
          { matricula: { equals: cleanLogin } },
          { nome: { equals: login.trim() } },
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário ou matrícula não cadastrado no PASSATURNO' }, { status: 404 });
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
