import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { inMemoryStore } from '@/lib/inMemoryStore';
import { turmaInFilter } from '@/lib/turma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { equipe, responsavelNome, observacoes, turma, escala } = body;

    if (!equipe || !responsavelNome) {
      return NextResponse.json({ error: 'Equipe e Nome do Responsável são obrigatórios' }, { status: 400 });
    }

    // Deriva a turma da equipe selecionada (ex: 'Automação C' => 'C'),
    // garantindo que turma e equipe nunca fiquem inconsistentes.
    const turmaDaEquipe = (equipe || '')
      .replace(/Automação\s*/i, '')
      .replace(/& CCO.*/i, '')
      .trim()
      .toUpperCase();
    const turmaFinal = ['A', 'B', 'C', 'D'].includes(turmaDaEquipe)
      ? turmaDaEquipe
      : (turma || 'A').toUpperCase().trim();

    // 1. Atualizar a memória do servidor para resposta imediata
    const inMemShift = inMemoryStore.startShift({
      equipe: equipe || 'Automação B',
      responsavelNome: responsavelNome || 'Operador',
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

      // Marcar como pendências herdadas apenas as ocorrências abertas DA PRÓPRIA TURMA
      const openIncidents = await prisma.incident.findMany({
        where: {
          turma: turmaInFilter(turmaFinal),
          status: { in: ['EM_ANDAMENTO', 'AGUARDANDO'] },
        },
      });

      for (const incident of openIncidents) {
        await prisma.incident.update({
          where: { id: incident.id },
          data: {
            isPendenciaHerdada: true,
            status: 'PENDENCIA_PROXIMO_TURNO',
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
