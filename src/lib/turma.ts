// Normaliza valores de turma ('Turma B', 'TURMA B', 'B') para a letra isolada ('B').
// Retorna '' para valores inválidos ou 'GERAL'.
export function normalizeTurma(value?: string | null): string {
  if (!value) return '';
  const cleaned = value
    .toUpperCase()
    .replace(/TURMA\s*/g, '')
    .replace(/[^A-D]/g, '')
    .trim();
  return ['A', 'B', 'C', 'D'].includes(cleaned) ? cleaned : '';
}

// Retorna a próxima turma da sequência do turno de revezamento (A -> B -> C -> D -> A)
export function getNextTurma(currentTurma?: string | null): string {
  const clean = normalizeTurma(currentTurma) || 'A';
  if (clean === 'A') return 'B';
  if (clean === 'B') return 'C';
  if (clean === 'C') return 'D';
  if (clean === 'D') return 'A';
  return 'B';
}

// Filtro Prisma que casa 'B', 'Turma B' ou 'TURMA B' (dados legados podem ter prefixo).
export function turmaInFilter(turma: string): { in: string[] } {
  return { in: [turma, `Turma ${turma}`, `TURMA ${turma}`] };
}

// Retorna a data de hoje no formato YYYY-MM-DD no fuso horário do Brasil (America/Sao_Paulo)
export function getTodayYMDInBR(): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };
  return new Intl.DateTimeFormat('en-CA', options).format(new Date());
}

// Verifica se uma data em ISO ou string refere-se ao dia alvo (YYYY-MM-DD) no fuso do Brasil (America/Sao_Paulo)
export function isSameDayAsYMD(dateVal?: string | Date | null, targetYMD?: string): boolean {
  if (!dateVal || !targetYMD || !/^\d{4}-\d{2}-\d{2}$/.test(targetYMD)) return false;
  try {
    let d: Date;

    if (dateVal instanceof Date) {
      d = dateVal;
    } else if (typeof dateVal === 'string') {
      const trimmed = dateVal.trim();
      if (!trimmed) return false;

      // Se for formato simples YYYY-MM-DD sem horário
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed === targetYMD;
      }

      // Se contiver data em formato DD/MM/YYYY (dados legados)
      const brMatch = trimmed.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (brMatch) {
        return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}` === targetYMD;
      }

      d = new Date(trimmed);
    } else {
      return false;
    }

    if (isNaN(d.getTime())) return false;

    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
    const itemYMD = new Intl.DateTimeFormat('en-CA', options).format(d);
    return itemYMD === targetYMD;
  } catch {
    return false;
  }
}

// Verifica se uma data em ISO ou string refere-se ao dia de HOJE no fuso do Brasil (America/Sao_Paulo)
export function isSameDayAsToday(dateVal?: string | Date | null): boolean {
  return isSameDayAsYMD(dateVal, getTodayYMDInBR());
}

// Verifica se a OCORRÊNCIA (parada, liberação ou criação) pertence estritamente ao dia alvo (YYYY-MM-DD, fuso BR)
export function isIncidentOnDate(item: any, targetYMD: string): boolean {
  if (!item || !targetYMD) return false;

  // Apenas campos de negócio de data da ocorrência (NÃO checar atualizadoEm!)
  const businessDateFields = [
    item.dataHoraLiberacao,
    item.dataHoraParada,
    item.criadoEm,
    item.dataHoraAcionamento,
  ];

  for (const dateVal of businessDateFields) {
    if (dateVal && isSameDayAsYMD(dateVal, targetYMD)) {
      return true;
    }
  }

  return false;
}

// Verifica se a OCORRÊNCIA (parada, liberação ou criação) pertence estritamente ao dia de HOJE
export function isIncidentFromToday(item: any): boolean {
  return isIncidentOnDate(item, getTodayYMDInBR());
}

// O banco grava os timestamps como colunas TIMESTAMP sem time zone (o valor guardado é o
// horário UTC, pois a sessão do banco roda em UTC e o cliente envia strings ISO com 'Z').
// Converte o valor bruto vindo do banco para um instante Date, tratando strings sem sufixo
// de fuso como UTC (evita o JavaScript interpretá-las no fuso local do navegador).
export function parseStoredDate(dateVal?: string | Date | null): Date | null {
  if (dateVal == null) return null;
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }
  const s = String(dateVal).trim();
  if (!s) return null;
  // Se já tiver indicador de fuso (Z ou ±HH:MM), o valor já é um instante absoluto
  if (/(Z|[+-]\d{2}:?\d{2})$/i.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  // Sem fuso: o banco armazenou o horário UTC (wall clock UTC)
  const d = new Date(s + 'Z');
  return isNaN(d.getTime()) ? null : d;
}

// Formata hora/minuto (ou data+hora) de um valor armazenado no banco para o fuso do Brasil
// (America/Sao_Paulo), independente do fuso do navegador/servidor. Ex.: '14:30' ou '14/08/2026 14:30'.
export function formatBRTime(
  dateVal?: string | Date | null,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const d = parseStoredDate(dateVal);
  if (!d) return '--:--';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(d);
}
