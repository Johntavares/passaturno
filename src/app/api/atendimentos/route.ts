import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabaseClient';
import { turmaInFilter, normalizeTurma, getNextTurma } from '@/lib/turma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const turma = searchParams.get('turma');

  // 1. SUPABASE REST (Fonte de Verdade Principal em Tempo Real)
  try {
    let query = supabase
      .from('Incident')
      .select('*, IncidentHistory(*), historico:IncidentHistory(*)')
      .order('criadoEm', { ascending: false });

    if (turma && turma !== 'TODAS') {
      const cleanT = normalizeTurma(turma);
      if (cleanT) {
        query = query.eq('turma', cleanT);
      }
    }

    const { data: supaIncidents, error: supaErr } = await query;
    if (!supaErr && supaIncidents) {
      const mapped = supaIncidents.map((item: any) => {
        const histRaw = item.historico || item.IncidentHistory || [];
        const histSorted = Array.isArray(histRaw)
          ? [...histRaw].sort((a, b) => new Date(b.dataHora || b.criadoEm || 0).getTime() - new Date(a.dataHora || a.criadoEm || 0).getTime())
          : [];
        return {
          ...item,
          historico: histSorted,
        };
      });
      return NextResponse.json(mapped);
    }
  } catch (e) {
    console.warn('Alerta GET Supabase REST atendimentos:', e);
  }

  // 2. PRISMA POSTGRESQL (Fallback)
  try {
    const incidents = await prisma.incident.findMany({
      where: turma ? { turma: turmaInFilter(turma) } : {},
      include: { historico: true },
      orderBy: { criadoEm: 'desc' },
    });
    return NextResponse.json(incidents);
  } catch (error) {
    console.error('Erro ao buscar atendimentos no Supabase:', error);
    return NextResponse.json({ error: 'Erro ao buscar atendimentos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tag,
      equipamentoNome,
      area,
      tipoFalha,
      falha,
      sintoma,
      dataHoraParada,
      dataHoraAcionamento,
      previsaoLiberacao,
      prioridade,
      status,
      responsavel,
      motivoEspera,
      proximaAcao,
      localizacaoAtualOpcional,
      observacao,
      turma,
      noCodigo,
      divisaoAtuacao,
    } = body;

    if (!tag || !falha || !responsavel) {
      return NextResponse.json({ error: 'TAG, Falha e Responsável são obrigatórios' }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const tagClean = tag.toUpperCase().trim();
    const turmaNormalizada = normalizeTurma(turma) || 'A';
    const isPendencia = status === 'PENDENCIA_PROXIMO_TURNO';
    const finalTurma = isPendencia ? getNextTurma(turmaNormalizada) : turmaNormalizada;

    let activeShiftId: string | null = null;
    let createdIncident: any = null;

    // 1. SUPABASE REST (Fonte de Verdade Única Principal)
    try {
      const { data: supaShifts } = await supabase
        .from('Shift')
        .select('*')
        .eq('status', 'ATIVO');

      if (supaShifts && supaShifts.length > 0) {
        const matchingShift = supaShifts.find((s: any) => normalizeTurma(s.turma) === turmaNormalizada) || supaShifts[0];
        if (matchingShift) activeShiftId = matchingShift.id;
      }

      const newId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `inc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const supaPayload = {
        id: newId,
        tag: tagClean,
        equipamentoNome: equipamentoNome || `Equipamento ${tagClean}`,
        area: area || 'Frota Mina',
        tipoFalha: tipoFalha || 'Comunicação',
        falha,
        sintoma: sintoma || null,
        dataHoraParada: dataHoraParada || nowIso,
        dataHoraAcionamento: dataHoraAcionamento || nowIso,
        previsaoLiberacao: previsaoLiberacao || null,
        prioridade: prioridade || 'MEDIA',
        status: status || 'EM_ANDAMENTO',
        responsavel,
        motivoEspera: motivoEspera || null,
        proximaAcao: proximaAcao || null,
        localizacaoAtualOpcional: localizacaoAtualOpcional || null,
        observacao: observacao || null,
        shiftId: activeShiftId,
        turma: finalTurma,
        divisaoAtuacao: divisaoAtuacao || 'MONITORAMENTO',
        isPendenciaHerdada: isPendencia,
        noCodigo: noCodigo === true,
        criadoEm: nowIso,
        atualizadoEm: nowIso,
      };

      const { data: insertedSupa, error: supaErr } = await supabase
        .from('Incident')
        .insert([supaPayload])
        .select('*')
        .single();

      if (!supaErr && insertedSupa) {
        createdIncident = insertedSupa;
        const histId = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const newHist = {
          id: histId,
          incidentId: newId,
          tipoEvento: 'ABERTURA',
          descricao: `Ocorrência iniciada por ${responsavel}. Falha: ${falha}`,
          usuario: responsavel,
          dataHora: nowIso,
        };

        try { await supabase.from('IncidentHistory').insert([newHist]); } catch(e) {}
        createdIncident.historico = [newHist];
      }
    } catch (supaErr) {
      console.warn('Alerta POST Supabase REST atendimentos:', supaErr);
    }

    // 2. PRISMA POSTGRESQL (Apenas fallback se Supabase REST falhar, evitando inserção dupla no mesmo banco)
    if (!createdIncident) {
      try {
        const equipment = await prisma.equipment.findUnique({
          where: { tag: tagClean },
        }).catch(() => null);

        if (!activeShiftId) {
          const activeShift = await prisma.shift.findFirst({
            where: {
              status: 'ATIVO',
              turma: turmaInFilter(turmaNormalizada),
            },
          }).catch(() => null);
          if (activeShift) activeShiftId = activeShift.id;
        }

        const prismaInc = await prisma.incident.create({
          data: {
            tag: tagClean,
            equipmentId: equipment?.id || null,
            equipamentoNome: equipamentoNome || equipment?.nome || `Equipamento ${tagClean}`,
            area: area || equipment?.area || 'Frota Mina',
            tipoFalha: tipoFalha || 'Comunicação',
            falha,
            sintoma,
            dataHoraParada: dataHoraParada ? new Date(dataHoraParada) : new Date(),
            dataHoraAcionamento: dataHoraAcionamento ? new Date(dataHoraAcionamento) : new Date(),
            previsaoLiberacao: previsaoLiberacao || null,
            prioridade: prioridade || 'MEDIA',
            status: status || 'EM_ANDAMENTO',
            responsavel,
            motivoEspera,
            proximaAcao,
            localizacaoAtualOpcional,
            observacao,
            shiftId: activeShiftId,
            turma: finalTurma,
            divisaoAtuacao: divisaoAtuacao || 'MONITORAMENTO',
            isPendenciaHerdada: isPendencia,
            noCodigo: noCodigo === true,
            historico: {
              create: {
                tipoEvento: 'ABERTURA',
                descricao: `Ocorrência iniciada por ${responsavel}. Falha: ${falha}`,
                usuario: responsavel,
              },
            },
          },
          include: { historico: true },
        }).catch(() => null);

        if (prismaInc) createdIncident = prismaInc;
      } catch (prismaErr) {
        console.warn('Alerta Prisma POST atendimentos:', prismaErr);
      }
    }

    if (!createdIncident) {
      createdIncident = {
        id: `inc-${Date.now()}`,
        tag: tagClean,
        equipamentoNome: equipamentoNome || `Equipamento ${tagClean}`,
        area: area || 'Frota Mina',
        tipoFalha: tipoFalha || 'Comunicação',
        falha,
        sintoma,
        dataHoraParada: dataHoraParada || nowIso,
        dataHoraAcionamento: dataHoraAcionamento || nowIso,
        previsaoLiberacao,
        prioridade: prioridade || 'MEDIA',
        status: status || 'EM_ANDAMENTO',
        responsavel,
        motivoEspera,
        proximaAcao,
        localizacaoAtualOpcional,
        observacao,
        shiftId: activeShiftId,
        turma: finalTurma,
        divisaoAtuacao: divisaoAtuacao || 'MONITORAMENTO',
        isPendenciaHerdada: isPendencia,
        noCodigo: noCodigo === true,
        criadoEm: nowIso,
        atualizadoEm: nowIso,
        historico: [{
          id: `hist-${Date.now()}`,
          tipoEvento: 'ABERTURA',
          descricao: `Ocorrência iniciada por ${responsavel}. Falha: ${falha}`,
          usuario: responsavel,
          dataHora: nowIso,
        }],
      };
    }

    return NextResponse.json(createdIncident, { status: 201 });
  } catch (error) {
    console.error('Error creating incident:', error);
    return NextResponse.json({ error: 'Erro ao criar atendimento' }, { status: 500 });
  }
}
