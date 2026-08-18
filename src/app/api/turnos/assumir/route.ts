import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import { turmaInFilter, normalizeTurma } from '@/lib/turma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { equipe, responsavelNome, observacoes, turma, escala } = body;

    const equipeFinal = equipe || `Automação ${turma || 'A'}`;
    const respFinal = responsavelNome || 'Operador';

    const turmaDaEquipe = (equipeFinal || '')
      .replace(/Automação\s*/i, '')
      .replace(/& CCO.*/i, '')
      .trim()
      .toUpperCase();
    const turmaFinal = ['A', 'B', 'C', 'D'].includes(turmaDaEquipe)
      ? turmaDaEquipe
      : (turma || 'A').toUpperCase().trim();

    const nowIso = new Date().toISOString();
    const today = nowIso.split('T')[0];
    const shiftId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `shift-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    let newShift: any = null;
    let hadActiveSameTurma = false;

    // 1. SUPABASE REST: Encerrar turno anterior APENAS da MESMA turma e criar novo turno ativo
    // (NUNCA encerrar turnos de outras turmas — cada turma é independente)
    try {
      const { data: supaShifts } = await supabase
        .from('Shift')
        .select('*')
        .eq('status', 'ATIVO');

      if (supaShifts && supaShifts.length > 0) {
        const prevActive = supaShifts.find((s: any) => normalizeTurma(s.turma) === turmaFinal);
        if (prevActive) {
          hadActiveSameTurma = true;
          await supabase
            .from('Shift')
            .update({ status: 'ENCERRADO', horaFim: nowIso })
            .eq('id', prevActive.id);
        }
      }

      const { data: createdSupaShift } = await supabase
        .from('Shift')
        .insert([{
          id: shiftId,
          equipe: equipeFinal,
          responsavelNome: respFinal,
          turma: turmaFinal,
          escala: escala || '3x3',
          data: today,
          horaInicio: nowIso,
          status: 'ATIVO',
          observacoes,
          criadoEm: nowIso,
        }])
        .select('*')
        .single();

      if (createdSupaShift) newShift = createdSupaShift;

      // Assegurar que as pendências repassadas para esta turma continuem no estado PENDENCIA_PROXIMO_TURNO / HERDADA
      // (NÃO mover automaticamente para EM_ANDAMENTO nem vincular ao shiftId para manter as colunas zeradas)
      const { data: supaIncidents } = await supabase
        .from('Incident')
        .select('*');

      if (supaIncidents && supaIncidents.length > 0) {
        const pendingForTurma = supaIncidents.filter((i: any) =>
          normalizeTurma(i.turma) === turmaFinal &&
          ['EM_ANDAMENTO', 'AGUARDANDO', 'PENDENCIA_PROXIMO_TURNO'].includes(i.status)
        );

        for (const inc of pendingForTurma) {
          await supabase
            .from('Incident')
            .update({
              turma: turmaFinal,
              status: 'PENDENCIA_PROXIMO_TURNO',
              isPendenciaHerdada: true,
              atualizadoEm: nowIso,
            })
            .eq('id', inc.id);

          try {
            await supabase
              .from('IncidentHistory')
              .insert([{
                id: typeof crypto !== 'undefined' && crypto.randomUUID
                  ? crypto.randomUUID()
                  : `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                incidentId: inc.id,
                tipoEvento: 'TRANSFERENCIA_TURNO',
                descricao: `Pendência repassada para o novo turno da Turma ${turmaFinal} (${respFinal}).`,
                usuario: respFinal,
                dataHora: nowIso,
              }]);
          } catch (eH) {}
        }
      }
    } catch (supaErr) {
      console.warn('Alerta assumir turno Supabase REST:', supaErr);
    }

    // Resetar a carteira diária do boletim quando um NOVO turno começa de fato
    // (sem turno ativo anterior da mesma turma — re-login no mesmo turno NÃO zera os valores)
    if (!hadActiveSameTurma) {
      try {
        await supabase
          .from('BoletimCarteira')
          .delete()
          .eq('turma', turmaFinal)
          .eq('data', today);
      } catch (eReset) {
        console.warn('Alerta reset carteira boletim:', eReset);
      }
    }

    // 2. PRISMA POSTGRESQL (Fallback: mesmo banco Supabase — encerra APENAS o turno ativo da MESMA turma)
    try {
      const activeShift = await prisma.shift.findFirst({
        where: { status: 'ATIVO', turma: turmaInFilter(turmaFinal) },
      });

      if (activeShift) {
        await prisma.shift.update({
          where: { id: activeShift.id },
          data: { status: 'ENCERRADO', horaFim: new Date() },
        }).catch(() => null);
      }

      const prismaShift = await prisma.shift.upsert({
        where: { id: shiftId },
        update: {
          equipe: equipeFinal,
          responsavelNome: respFinal,
          turma: turmaFinal,
          escala: escala || '3x3',
          data: today,
          status: 'ATIVO',
          observacoes,
        },
        create: {
          id: shiftId,
          equipe: equipeFinal,
          responsavelNome: respFinal,
          turma: turmaFinal,
          escala: escala || '3x3',
          data: today,
          horaInicio: new Date(),
          status: 'ATIVO',
          observacoes,
        },
      }).catch(() => null);

      if (!newShift && prismaShift) newShift = prismaShift;

      const pendingIncidents = await prisma.incident.findMany({
        where: {
          turma: turmaInFilter(turmaFinal),
          status: { in: ['EM_ANDAMENTO', 'AGUARDANDO', 'PENDENCIA_PROXIMO_TURNO'] },
        },
      }).catch(() => []);

      for (const inc of pendingIncidents) {
        await prisma.incident.update({
          where: { id: inc.id },
          data: {
            turma: turmaFinal,
            status: 'PENDENCIA_PROXIMO_TURNO',
            isPendenciaHerdada: true,
          },
        }).catch(() => null);
      }
    } catch (prismaErr) {
      console.warn('Alerta Prisma assumir turno:', prismaErr);
    }

    // NUNCA retornar turno fake: se não persistiu, é erro de verdade
    if (!newShift) {
      console.error('Falha ao assumir turno: Supabase REST e Prisma falharam.');
      return NextResponse.json(
        { error: 'Não foi possível iniciar o turno no banco. Tente novamente.' },
        { status: 500 }
      );
    }

    return NextResponse.json(newShift, { status: 201 });
  } catch (error) {
    console.error('Error assuming shift:', error);
    return NextResponse.json({ error: 'Erro ao assumir turno' }, { status: 500 });
  }
}
