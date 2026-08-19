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
