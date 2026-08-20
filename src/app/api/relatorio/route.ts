import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { format, differenceInMinutes } from 'date-fns';
import { getTodayYMDInBR } from '@/lib/turma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const prioridade = searchParams.get('prioridade') || undefined;
    // Padrão: apenas o dia de HOJE (Brasil). Opcionalmente `data=YYYY-MM-DD` para consulta histórica.
    const data = searchParams.get('data') || getTodayYMDInBR();

    // Limites do dia no fuso do Brasil (UTC-3): 00:00 BR = 03:00 UTC
    const startMs = Date.parse(`${data}T03:00:00.000Z`);
    const start = new Date(startMs);
    const end = new Date(startMs + 24 * 60 * 60 * 1000 - 1);

    const where: any = {
      OR: [
        { dataHoraParada: { gte: start, lte: end } },
        { dataHoraLiberacao: { gte: start, lte: end } },
        { dataHoraAcionamento: { gte: start, lte: end } },
        { criadoEm: { gte: start, lte: end } },
      ],
    };
    if (status) where.status = status;
    if (prioridade) where.prioridade = prioridade;

    const incidents = await prisma.incident.findMany({
      where,
      include: {
        equipment: true,
        shift: true,
      },
      orderBy: { dataHoraParada: 'desc' },
    });

    const rows = incidents.map((inc) => {
      const parada = new Date(inc.dataHoraParada);
      const liberacao = inc.dataHoraLiberacao ? new Date(inc.dataHoraLiberacao) : null;
      let tempoParadaText = 'Em aberto';

      // Formata no fuso do Brasil (America/Sao_Paulo), já que o banco guarda os timestamps em UTC
      const brFmt = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      if (liberacao) {
        const diffMinutes = differenceInMinutes(liberacao, parada);
        const hours = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        tempoParadaText = hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
      }

      return {
        'TAG': inc.tag,
        'Equipamento': inc.equipamentoNome,
        'Área': inc.area,
        'Tipo de Falha': inc.tipoFalha,
        'Falha Apresentada': inc.falha,
        'Sintoma': inc.sintoma || '-',
        'Hora da Parada': brFmt.format(parada),
        'Hora da Liberação': liberacao ? brFmt.format(liberacao) : 'Pendente',
        'Tempo de Parada': tempoParadaText,
        'Status': inc.status,
        'Prioridade': inc.prioridade,
        'Responsável': inc.responsavel,
        'Equipe / Turno': inc.shift ? `${inc.shift.equipe} (${inc.shift.data})` : 'N/A',
        'Solução Aplicada': inc.solucao || '-',
        'Motivo de Aguardo': inc.motivoEspera || '-',
        'Próxima Ação': inc.proximaAcao || '-',
        'Observação Técnica': inc.observacao || '-',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    
    // Auto-ajustar largura das colunas
    const colWidths = Object.keys(rows[0] || {}).map((key) => ({
      wch: Math.max(key.length + 5, 18),
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Atendimentos Automação');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Relatorio_Automacao_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error generating Excel report:', error);
    return NextResponse.json({ error: 'Erro ao gerar relatório Excel' }, { status: 500 });
  }
}
