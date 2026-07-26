import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { format, differenceInMinutes } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const prioridade = searchParams.get('prioridade');

    const where: any = {};
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
        'Hora da Parada': format(parada, 'dd/MM/yyyy HH:mm'),
        'Hora da Liberação': liberacao ? format(liberacao, 'dd/MM/yyyy HH:mm') : 'Pendente',
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
