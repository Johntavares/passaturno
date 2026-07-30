import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nome, matricula, email, senha, turma, horarioTurno, periodoTurno } = body;

    const data: any = {};
    if (nome !== undefined) data.nome = nome.trim();
    if (matricula !== undefined) data.matricula = matricula.trim();
    if (email !== undefined) data.email = email.trim();
    if (turma !== undefined) data.turma = turma;
    if (horarioTurno !== undefined) data.horarioTurno = horarioTurno;
    if (periodoTurno !== undefined) data.periodoTurno = periodoTurno;
    if (senha !== undefined) {
      data.senha = await bcrypt.hash(senha, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
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

    return NextResponse.json(user);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return NextResponse.json({ error: 'Erro ao deletar usuário' }, { status: 500 });
  }
}
