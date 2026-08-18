export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabaseClient';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const { data: supaUsers, error: supaErr } = await supabase
      .from('User')
      .select('id, nome, email, matricula, equipe, cargo, turma, horarioTurno, periodoTurno, escala, diaEscala, criadoPor, criadoEm')
      .order('criadoEm', { ascending: false });

    if (supaUsers && supaUsers.length > 0) {
      return NextResponse.json(supaUsers);
    }
  } catch (e) {
    console.warn('Supabase REST usuarios warning:', e);
  }

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
        escala: true,
        diaEscala: true,
        criadoPor: true,
        criadoEm: true,
      },
    });
    if (users && users.length > 0) {
      return NextResponse.json(users);
    }

    // Auto-seed de usuários padrão se estiver vazio
    const passHash = await bcrypt.hash('123456', 10);
    const defaultUsers = [
      { nome: 'John Tavares', email: 'john.tavares@passaturno.com', matricula: '8888', senha: passHash, equipe: 'Automação A', cargo: 'Técnico de Automação (Turma A)', turma: 'A', escala: '3x3', diaEscala: '1º Dia', horarioTurno: '07:00 às 19:00', periodoTurno: 'Dia' },
      { nome: 'Operador Turma A', email: 'turma.a@passaturno.com', matricula: '1001', senha: passHash, equipe: 'Automação A', cargo: 'Técnico de Automação (Turma A)', turma: 'A', escala: '3x3', diaEscala: '1º Dia', horarioTurno: '07:00 às 19:00', periodoTurno: 'Dia' },
      { nome: 'Operador Turma B', email: 'turma.b@passaturno.com', matricula: '1002', senha: passHash, equipe: 'Automação B', cargo: 'Técnico de Automação (Turma B)', turma: 'B', escala: '3x3', diaEscala: '1º Dia', horarioTurno: '07:00 às 19:00', periodoTurno: 'Dia' },
      { nome: 'Operador Turma C', email: 'turma.c@passaturno.com', matricula: '1003', senha: passHash, equipe: 'Automação C', cargo: 'Técnico de Automação (Turma C)', turma: 'C', escala: '3x3', diaEscala: '1º Dia', horarioTurno: '07:00 às 19:00', periodoTurno: 'Dia' },
      { nome: 'Operador Turma D', email: 'turma.d@passaturno.com', matricula: '1004', senha: passHash, equipe: 'Automação D', cargo: 'Técnico de Automação (Turma D)', turma: 'D', escala: '3x3', diaEscala: '1º Dia', horarioTurno: '19:00 às 07:00', periodoTurno: 'Noite' },
      { nome: 'Líder da Turma', email: 'lider@passaturno.com', matricula: '9999', senha: passHash, equipe: 'Liderança CCO', cargo: 'LÍDER DE TURMA', turma: 'GERAL', escala: '3x3', diaEscala: '1º Dia', horarioTurno: '07:00 às 19:00', periodoTurno: 'Dia' },
    ];

    for (const u of defaultUsers) {
      await prisma.user.upsert({ where: { email: u.email }, update: u, create: u }).catch(() => null);
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
    const { nome, matricula, senha, turma, escala, diaEscala, horarioTurno, periodoTurno, criadoPor } = body;

    if (!nome || !matricula || !senha || !turma) {
      return NextResponse.json({ error: 'Nome, matrícula, senha e turma são obrigatórios' }, { status: 400 });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}`;
    const email = `turma.${turma.toLowerCase()}.${matricula.trim()}@passaturno.com`;
    const equipe = `Automação ${turma}`;
    const cargo = `Técnico de Automação (Turma ${turma})`;
    const finalHorario = horarioTurno || (turma === 'D' ? '19:00 às 07:00' : '07:00 às 19:00');
    const finalPeriodo = periodoTurno || (turma === 'D' ? 'Noite' : 'Dia');
    const finalEscala = escala || '3x3';
    const finalDiaEscala = diaEscala || '1º Dia';

    // 1. Supabase REST
    try {
      await supabase.from('User').insert([{
        id,
        nome: nome.trim(),
        matricula: matricula.trim(),
        email,
        senha: senhaHash,
        equipe,
        cargo,
        turma,
        horarioTurno: finalHorario,
        periodoTurno: finalPeriodo,
        escala: finalEscala,
        diaEscala: finalDiaEscala,
        criadoPor: criadoPor || 'Líder da Turma',
      }]);
    } catch (eSupa) {}

    // 2. Prisma
    const user = await prisma.user.create({
      data: {
        id,
        nome: nome.trim(),
        matricula: matricula.trim(),
        email,
        senha: senhaHash,
        equipe,
        cargo,
        turma,
        horarioTurno: finalHorario,
        periodoTurno: finalPeriodo,
        escala: finalEscala,
        diaEscala: finalDiaEscala,
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
      escala: user.escala,
      diaEscala: user.diaEscala,
      horarioTurno: user.horarioTurno,
      periodoTurno: user.periodoTurno,
    }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Matrícula já cadastrada' }, { status: 409 });
    }
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
  }
}
