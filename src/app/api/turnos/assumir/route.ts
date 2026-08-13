import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { turmaInFilter } from '@/lib/turma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { equipe, responsavelNome, observacoes, turma, escala } = body;

    const equipeFinal = equipe || `Automação ${turma || 'A'}`;
    const respFinal = responsavelNome || 'Operador';

    // Deriva a turma da equipe selecionada (ex: 'Automação C' => 'C'),
    // garantindo que turma e equipe nunca fiquem inconsistentes.
    const turmaDaEquipe = (equipeFinal || '')
      .replace(/Automação\s*/i, '')
      .replace(/& CCO.*/i, '')
      .trim()
      .toUpperCase();
    const turmaFinal = ['A', 'B', 'C', 'D'].includes(turmaDaEquipe)
      ? turmaDaEquipe
      : (turma || 'A').toUpperCase().trim();

    try {
      // Encerrar o turno ativo anterior DA MESMA TURMA
      const activeShift = await prisma.shift.findFirst({
        where: { status: 'ATIVO', turma: turmaInFilter(turmaFinal) },
      });

      if (activeShift) {
        await prisma.shift.update({
          where: { id: activeShift.id },
          data: {
            status: 'ENCERRADO',
            horaFim: new Date(),
          },
        });
      }

      // Criar o novo turno ativo no banco de dados
      const today = new Date().toISOString().split('T')[0];
      const newShift = await prisma.shift.create({
        data: {
          equipe: equipeFinal,
          responsavelNome: respFinal,
          turma: turmaFinal,
          escala: escala || '3x3',
          data: today,
          horaInicio: new Date(),
          status: 'ATIVO',
          observacoes,
        },
      });

      // Vincula todas as pendências em aberto direcionadas a esta turma ao novo turno iniciado
      const pendingIncidents = await prisma.incident.findMany({
        where: {
          turma: turmaInFilter(turmaFinal),
          status: { in: ['EM_ANDAMENTO', 'AGUARDANDO', 'PENDENCIA_PROXIMO_TURNO'] },
        },
      });

      for (const inc of pendingIncidents) {
        await prisma.incident.update({
          where: { id: inc.id },
          data: {
            shiftId: newShift.id,
            turma: turmaFinal,
            status: inc.status === 'PENDENCIA_PROXIMO_TURNO' ? 'EM_ANDAMENTO' : inc.status,
            isPendenciaHerdada: true,
            historico: {
              create: {
                tipoEvento: 'TRANSFERENCIA_TURNO',
                descricao: `Ocorrência vinculada ao novo turno ativado pela Turma ${turmaFinal} (${respFinal}).`,
                usuario: respFinal,
              },
            },
          },
        });
      }

      return NextResponse.json(newShift, { status: 201 });
    } catch (dbErr) {
      console.error('Erro ao assumir turno no Supabase:', dbErr);
      return NextResponse.json({ error: 'Erro ao gravar turno no banco de dados' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error assuming shift:', error);
    return NextResponse.json({ error: 'Erro ao assumir turno' }, { status: 500 });
  }
}
