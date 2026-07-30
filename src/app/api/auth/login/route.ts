import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { login, senha } = body;

    if (!login || !senha) {
      return NextResponse.json({ error: 'Matrícula/E-mail e Senha são obrigatórios' }, { status: 400 });
    }

    const cleanLogin = login.trim().toLowerCase();

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
      return NextResponse.json(
        { error: 'Usuário não cadastrado.' },
        { status: 404 }
      );
    }

    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) {
      return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
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
        horarioTurno: user.horarioTurno,
        periodoTurno: user.periodoTurno,
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json({ error: 'Erro interno ao realizar autenticação' }, { status: 500 });
  }
}
