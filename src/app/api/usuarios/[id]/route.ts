export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import bcrypt from 'bcryptjs';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nome, matricula, email, senha, turma, horarioTurno, periodoTurno, escala, diaEscala } = body;

    const data: any = {};
    if (nome !== undefined) data.nome = nome.trim();
    if (matricula !== undefined) data.matricula = matricula.trim();
    if (email !== undefined) data.email = email.trim();
    if (turma !== undefined) {
      data.turma = turma;
      data.equipe = `Automação ${turma}`;
      data.cargo = `Técnico de Automação (Turma ${turma})`;
    }
    if (horarioTurno !== undefined) data.horarioTurno = horarioTurno;
    if (periodoTurno !== undefined) data.periodoTurno = periodoTurno;
    if (escala !== undefined) data.escala = escala;
    if (diaEscala !== undefined) data.diaEscala = diaEscala;
    if (senha !== undefined && senha) {
      data.senha = await bcrypt.hash(senha, 10);
    }

    // 1. Atualiza no Supabase REST
    try {
      await supabase
        .from('User')
        .update(data)
        .eq('id', id);
    } catch (eSupa) {
      console.warn('Supabase user update warning:', eSupa);
    }

    // 2. Atualiza no Prisma
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
        escala: true,
        diaEscala: true,
        criadoPor: true,
        criadoEm: true,
      },
    });

    // 3. Sincroniza o turno ativo no Supabase e no Prisma se pertencer a esta turma ou usuário
    try {
      const activeTurma = data.turma || user.turma;
      const shiftUpdateData: any = {};
      if (data.nome !== undefined) shiftUpdateData.responsavelNome = data.nome;
      if (data.turma !== undefined) shiftUpdateData.turma = data.turma;
      if (data.escala !== undefined) shiftUpdateData.escala = data.escala;
      if (data.horarioTurno !== undefined) shiftUpdateData.horarioTurno = data.horarioTurno;
      if (data.periodoTurno !== undefined) {
        shiftUpdateData.tipoTurno = data.periodoTurno === 'Noite' ? 'Noturno' : 'Diurno';
      }
      if (data.turma !== undefined) shiftUpdateData.equipe = `Automação ${data.turma}`;

      if (Object.keys(shiftUpdateData).length > 0) {
        // Atualiza Supabase
        await supabase
          .from('Shift')
          .update(shiftUpdateData)
          .eq('status', 'ATIVO');

        // Atualiza Prisma
        await prisma.shift.updateMany({
          where: { status: 'ATIVO' },
          data: shiftUpdateData,
        });
      }
    } catch (shiftErr) {
      console.error('Erro ao sincronizar turno ativo:', shiftErr);
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    try {
      await supabase.from('User').delete().eq('id', id);
    } catch (e) {}
    await prisma.user.delete({ where: { id } }).catch(() => null);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return NextResponse.json({ error: 'Erro ao deletar usuário' }, { status: 500 });
  }
}
