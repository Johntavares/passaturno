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
    if (users && users.length > 0) {
      return NextResponse.json(users);
    }

    // Auto-seed de usuários padrão no Supabase se estiver vazio
    const passHash = await bcrypt.hash('123456', 10);
    const defaultUsers = [
      { nome: 'John Tavares', email: 'john.tavares@passaturno.com', matricula: '8888', senha: passHash, equipe: 'Automação A', cargo: 'Técnico de Automação (Turma A)', turma: 'A' },
      { nome: 'Operador Turma A', email: 'turma.a@passaturno.com', matricula: '1001', senha: passHash, equipe: 'Automação A', cargo: 'Técnico de Automação (Turma A)', turma: 'A' },
      { nome: 'Operador Turma B', email: 'turma.b@passaturno.com', matricula: '1002', senha: passHash, equipe: 'Automação B', cargo: 'Técnico de Automação (Turma B)', turma: 'B' },
      { nome: 'Operador Turma C', email: 'turma.c@passaturno.com', matricula: '1003', senha: passHash, equipe: 'Automação C', cargo: 'Técnico de Automação (Turma C)', turma: 'C' },
      { nome: 'Operador Turma D', email: 'turma.d@passaturno.com', matricula: '1004', senha: passHash, equipe: 'Automação D', cargo: 'Técnico de Automação (Turma D)', turma: 'D' },
      { nome: 'Líder da Turma', email: 'lider@passaturno.com', matricula: '9999', senha: passHash, equipe: 'Liderança CCO', cargo: 'LÍDER DE TURMA', turma: 'GERAL' },
    ];

    for (const u of defaultUsers) {
      await prisma.user.upsert({ where: { email: u.email }, update: u, create: u });
    }

    const seeded = await prisma.user.findMany({ orderBy: { criadoEm: 'desc' } });
    return NextResponse.json(seeded);
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
