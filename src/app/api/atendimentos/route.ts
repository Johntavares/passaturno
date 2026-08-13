export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabaseClient';
import { normalizeTurma, turmaInFilter, getNextTurma } from '@/lib/turma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag') || undefined;
  const status = searchParams.get('status') || undefined;
  const prioridade = searchParams.get('prioridade') || undefined;
  const search = searchParams.get('search') || undefined;
  const turma = normalizeTurma(searchParams.get('turma'));

  try {
    const { data: supaIncidents, error: supaErr } = await supabase
      .from('Incident')
      .select('*, historico:IncidentHistory(*)')
      .order('criadoEm', { ascending: false });

    if (supaIncidents && supaIncidents.length > 0) {
      let filtered = supaIncidents;
      if (turma) {
        filtered = filtered.filter((i) => normalizeTurma(i.turma) === turma);
      }
      if (status) {
        filtered = filtered.filter((i) => i.status === status);
      }
      if (prioridade) {
        filtered = filtered.filter((i) => i.prioridade === prioridade);
      }
      if (tag) {
        filtered = filtered.filter((i) => i.tag && i.tag.toUpperCase().includes(tag.toUpperCase()));
      }
      if (search) {
        const s = search.toUpperCase();
        filtered = filtered.filter(
          (i) =>
            (i.tag && i.tag.toUpperCase().includes(s)) ||
            (i.equipamentoNome && i.equipamentoNome.toUpperCase().includes(s)) ||
            (i.falha && i.falha.toUpperCase().includes(s)) ||
            (i.responsavel && i.responsavel.toUpperCase().includes(s))
        );
      }
      return NextResponse.json(filtered);
    }
  } catch (e) {
    console.warn('Supabase REST GET warning:', e);
  }

  try {
    const incidents = await prisma.incident.findMany({
      where: turma ? { turma: turmaInFilter(turma) } : {},
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

    try {
      // Buscar equipamento pela TAG para vincular
      const equipment = await prisma.equipment.findUnique({
        where: { tag: tag.toUpperCase().trim() },
      });

      const turmaNormalizada = normalizeTurma(turma) || undefined;

      // Buscar turno ativo atual DA MESMA TURMA (nunca de outra turma)
      const activeShift = await prisma.shift.findFirst({
        where: {
          status: 'ATIVO',
          ...(turmaNormalizada ? { turma: turmaInFilter(turmaNormalizada) } : {}),
        },
      });

      const isPendencia = status === 'PENDENCIA_PROXIMO_TURNO';
      const activeTurmaClean = turmaNormalizada || (activeShift?.turma ? normalizeTurma(activeShift.turma) : 'A');
      const finalTurma = isPendencia ? getNextTurma(activeTurmaClean) : activeTurmaClean;

      const incident = await prisma.incident.create({
        data: {
          tag: tag.toUpperCase().trim(),
          equipmentId: equipment?.id || null,
          equipamentoNome: equipamentoNome || equipment?.nome || `Equipamento ${tag}`,
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
          shiftId: activeShift?.id || null,
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
        include: {
          historico: true,
        },
      });

      // Sincroniza em memória para garantir consistência imediata no polling
      return NextResponse.json(incident, { status: 201 });
    } catch (dbErr) {
      // Retry unico: falhas transitórias de rede costumam ser resolvidas na segunda tentativa,
      // garantindo que o atendimento seja gravado no banco (e não apenas em memória).
      console.warn('Tentativa 1 de criacao de atendimento falhou, tentando de novo:', dbErr);
      await new Promise((r) => setTimeout(r, 1200));
      try {
        const equipment = await prisma.equipment.findUnique({
          where: { tag: tag.toUpperCase().trim() },
        });

        const turmaNormalizada = normalizeTurma(turma) || undefined;

        const activeShift = await prisma.shift.findFirst({
          where: {
            status: 'ATIVO',
            ...(turmaNormalizada ? { turma: turmaInFilter(turmaNormalizada) } : {}),
          },
        });

        const isPendencia = status === 'PENDENCIA_PROXIMO_TURNO';
        const activeTurmaClean = turmaNormalizada || (activeShift?.turma ? normalizeTurma(activeShift.turma) : 'A');
        const finalTurma = isPendencia ? getNextTurma(activeTurmaClean) : activeTurmaClean;

        const incident = await prisma.incident.create({
          data: {
            tag: tag.toUpperCase().trim(),
            equipmentId: equipment?.id || null,
            equipamentoNome: equipamentoNome || equipment?.nome || `Equipamento ${tag}`,
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
            shiftId: activeShift?.id || null,
            turma: finalTurma,
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
          include: {
            historico: true,
          },
        });

        return NextResponse.json(incident, { status: 201 });
      } catch (dbErr2) {
        console.error('Falha ao criar atendimento no Supabase após retry:', dbErr2);
        return NextResponse.json({ error: 'Erro ao gravar atendimento no banco de dados' }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Error creating incident:', error);
    return NextResponse.json({ error: 'Erro ao criar atendimento' }, { status: 500 });
  }
}

