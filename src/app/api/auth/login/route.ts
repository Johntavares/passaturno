import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { normalizeTurma, turmaInFilter } from '@/lib/turma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { login, senha } = body;

    if (!login || !senha) {
      return NextResponse.json({ error: 'Matrícula/E-mail e Senha são obrigatórios' }, { status: 400 });
    }

    const cleanLogin = login.trim().toLowerCase();

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanLogin } },
          { matricula: { equals: cleanLogin } },
          { nome: { equals: login.trim() } },
        ],
      },
    });

    if (!user) {
      const passHash = await bcrypt.hash('123456', 10);
      const defaultDataMap: Record<string, any> = {
        '1001': { nome: 'Operador Turma A', email: 'turma.a@passaturno.com', matricula: '1001', senha: passHash, equipe: 'Automação A', cargo: 'Técnico de Automação (Turma A)', turma: 'A' },
        '1002': { nome: 'Operador Turma B', email: 'turma.b@passaturno.com', matricula: '1002', senha: passHash, equipe: 'Automação B', cargo: 'Técnico de Automação (Turma B)', turma: 'B' },
        '1003': { nome: 'Operador Turma C', email: 'turma.c@passaturno.com', matricula: '1003', senha: passHash, equipe: 'Automação C', cargo: 'Técnico de Automação (Turma C)', turma: 'C' },
        '1004': { nome: 'Operador Turma D', email: 'turma.d@passaturno.com', matricula: '1004', senha: passHash, equipe: 'Automação D', cargo: 'Técnico de Automação (Turma D)', turma: 'D' },
        '8888': { nome: 'John Tavares', email: 'john.tavares@passaturno.com', matricula: '8888', senha: passHash, equipe: 'Automação A', cargo: 'Técnico de Automação (Turma A)', turma: 'A' },
        '9999': { nome: 'Líder da Turma', email: 'lider@passaturno.com', matricula: '9999', senha: passHash, equipe: 'Liderança CCO', cargo: 'LÍDER DE TURMA', turma: 'GERAL' },
      };

      const matchedDefault = defaultDataMap[cleanLogin];
      if (matchedDefault) {
        user = await prisma.user.create({ data: matchedDefault });
      }
    }

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
    const userTurma = normalizeTurma(user.turma);
    if (user.cargo !== 'LIDER' && userTurma) {
      try {
        const { inMemoryStore } = await import('@/lib/inMemoryStore');
        
        try {
          const activeShiftTurma = await prisma.shift.findFirst({
            where: { status: 'ATIVO', turma: turmaInFilter(userTurma) },
            orderBy: { criadoEm: 'desc' },
          });

          // Só assume se a própria turma ainda não tiver turno ativo —
          // turnos de OUTRAS turmas são independentes e nunca são tocados.
          if (!activeShiftTurma) {
            console.log(`Auto-assumindo turno para Turma ${userTurma} via login...`);
            const today = new Date().toISOString().split('T')[0];
            const equipe = user.equipe;
            const responsavelNome = user.nome;
            const escala = user.escala || '3x3';
            const diaEscala = user.diaEscala || '1º Dia';
            const observacoes = `Turno assumido automaticamente no login. Escala: ${escala} (${diaEscala}).`;

            inMemoryStore.startShift({
              equipe,
              responsavelNome,
              observacoes,
              turma: userTurma,
              escala,
            });

            // Herdar pendências APENAS da própria turma (operador anterior não encerrou formalmente).
            const ownOpenIncidents = await prisma.incident.findMany({
              where: {
                turma: turmaInFilter(userTurma),
                status: { in: ['EM_ANDAMENTO', 'AGUARDANDO'] },
              },
            });

            for (const incident of ownOpenIncidents) {
              await prisma.incident.update({
                where: { id: incident.id },
                data: {
                  isPendenciaHerdada: true,
                  status: 'PENDENCIA_PROXIMO_TURNO',
                },
              });
            }

            await prisma.shift.create({
              data: {
                equipe,
                responsavelNome,
                turma: userTurma,
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
          }
        } catch (e) {
          console.warn('SQLite auto-assume failed, inMemoryStore updated.', e);
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
