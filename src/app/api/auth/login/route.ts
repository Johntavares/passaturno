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

    // --- AUTO-ASSUMIR TURNO LOGIC ---
    if (user.cargo !== 'LIDER' && ['A', 'B', 'C', 'D'].includes(user.turma)) {
      try {
        const { inMemoryStore } = await import('@/lib/inMemoryStore');
        
        let currentTurma = null;
        try {
          const activeShift = await prisma.shift.findFirst({
            where: { status: 'ATIVO' },
            orderBy: { criadoEm: 'desc' },
          });
          currentTurma = activeShift?.turma;
        } catch (dbErr) {
          const inMemActive = inMemoryStore.getActiveShift();
          currentTurma = inMemActive?.activeShift?.turma;
        }

        if (currentTurma !== user.turma) {
          console.log(`Auto-assumindo turno para Turma ${user.turma} via login...`);
          const today = new Date().toISOString().split('T')[0];
          const equipe = user.equipe;
          const responsavelNome = user.nome;
          const turma = user.turma;
          const escala = user.escala || '3x3';
          const diaEscala = user.diaEscala || '1º Dia';
          const observacoes = `Turno assumido automaticamente no login. Escala: ${escala} (${diaEscala}).`;
          
          inMemoryStore.startShift({
            equipe,
            responsavelNome,
            observacoes,
            turma,
            escala,
          });

          try {
            const activeShift = await prisma.shift.findFirst({
              where: { status: 'ATIVO' },
            });

            if (activeShift) {
              await prisma.shift.update({
                where: { id: activeShift.id },
                data: { status: 'ENCERRADO', horaFim: new Date() },
              });
            }

            const openIncidents = await prisma.incident.findMany({
              where: { status: { in: ['EM_ANDAMENTO', 'AGUARDANDO', 'PENDENCIA_PROXIMO_TURNO'] } },
            });

            for (const incident of openIncidents) {
              await prisma.incident.update({
                where: { id: incident.id },
                data: {
                  isPendenciaHerdada: true,
                  status: incident.status === 'EM_ANDAMENTO' ? 'PENDENCIA_PROXIMO_TURNO' : incident.status,
                },
              });
            }

            await prisma.shift.create({
              data: {
                equipe,
                responsavelNome,
                turma,
                tipoTurno: user.periodoTurno === 'Noite' ? 'Noturno' : 'Diurno',
                escala,
                horarioTurno: user.horarioTurno,
                responsavelId: user.id,
                data: today,
                horaInicio: new Date(),
                status: 'ATIVO',
                observacoes,
              },
            });
          } catch (e) {
            console.warn('SQLite auto-assume failed, inMemoryStore updated.', e);
          }
        }
      } catch (autoShiftErr) {
        console.error('Erro no auto-assumir turno durante o login:', autoShiftErr);
      }
    }
    // ---------------------------------

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
