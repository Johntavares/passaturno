import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { inMemoryStore } from '@/lib/inMemoryStore';
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

    // 1. Atualizar a memória do servidor para resposta imediata
    const inMemShift = inMemoryStore.startShift({
      equipe: equipeFinal,
      responsavelNome: respFinal,
      observacoes: observacoes || '',
      turma: turmaFinal,
      escala: escala,
    });

    try {
      // Encerrar apenas o turno ativo DA MESMA TURMA (outras turmas são independentes)
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

      // Criar o novo turno ativo no banco SQLite
      const today = new Date().toISOString().split('T')[0];
      const newShift = await prisma.shift.create({
        data: {
          equipe,
          responsavelNome,
          turma: turmaFinal,
          escala: escala || '3x3',
          data: today,
          horaInicio: new Date(),
          status: 'ATIVO',
          observacoes,
        },
      });

      return NextResponse.json(newShift, { status: 201 });
    } catch (dbErr) {
      console.warn('Alerta banco SQLite assumir turno:', dbErr);
    }

    return NextResponse.json(inMemShift, { status: 200 });
  } catch (error) {
    console.error('Error assuming shift:', error);
    return NextResponse.json(
      {
        id: `shift-${Date.now()}`,
        equipe: 'Automação B',
        responsavelNome: 'Operador',
        status: 'ATIVO',
        data: new Date().toISOString().split('T')[0],
        horaInicio: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
