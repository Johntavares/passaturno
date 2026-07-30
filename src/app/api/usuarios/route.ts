import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { criadoEm: 'desc' },
      select: {
        id: true,
        nome: true,
        email: true,
        matricula: true,
        equipe: true,
        cargo: true,
        turma: true,
        horarioTurno: true,
        periodoTurno: true,
        criadoPor: true,
        criadoEm: true,
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, matricula, senha, turma, criadoPor } = body;

    if (!nome || !matricula || !senha || !turma) {
      return NextResponse.json({ error: 'Nome, matrícula, senha e turma são obrigatórios' }, { status: 400 });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const user = await prisma.user.create({
      data: {
        nome: nome.trim(),
        matricula: matricula.trim(),
        email: `turma.${turma.toLowerCase()}.${matricula.trim()}@passaturno.com`,
        senha: senhaHash,
        equipe: `Automação & CCO (Turma ${turma})`,
        cargo: `Técnico de Automação (Turma ${turma})`,
        turma,
        horarioTurno: turma === 'D' ? '19:00 às 07:00' : '07:00 às 19:00',
        periodoTurno: turma === 'D' ? 'Noite' : 'Dia',
        criadoPor: criadoPor || 'Líder da Turma',
      },
    });

    return NextResponse.json({
      id: user.id,
      nome: user.nome,
      email: user.email,
      matricula: user.matricula,
      equipe: user.equipe,
      cargo: user.cargo,
      turma: user.turma,
    }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Matrícula já cadastrada' }, { status: 409 });
    }
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
  }
}
