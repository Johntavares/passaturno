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

// Verifica se uma data em ISO ou string refere-se ao dia de HOJE no fuso do Brasil (America/Sao_Paulo)
export function isSameDayAsToday(dateStr?: string | Date | null): boolean {
  if (!dateStr) return false;
  try {
    let d: Date;
    if (typeof dateStr === 'string') {
      // Se for formato ISO simples YYYY-MM-DD...
      if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        const itemYMD = dateStr.slice(0, 10);
        // Se a string contiver fuso ou Z, convertemos com timezone; caso contrário podemos comparar os 10 caracteres
        if (!dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.includes('-')) {
          return itemYMD === getTodayYMDInBR();
        }
      }
      d = new Date(dateStr);
    } else {
      d = dateStr;
    }

    if (isNaN(d.getTime())) return false;

    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };

    const formatter = new Intl.DateTimeFormat('en-CA', options); // Produz 'YYYY-MM-DD'
    const itemYMD = formatter.format(d);
    const todayYMD = formatter.format(new Date());

    return itemYMD === todayYMD;
  } catch {
    return false;
  }
}

// Verifica se a OCORRÊNCIA (parada, liberação ou criação) pertence estritamente ao dia de HOJE
export function isIncidentFromToday(item: any): boolean {
  if (!item) return false;

  // Apenas campos de negócio de data da ocorrência (NÃO checar atualizadoEm!)
  const businessDateFields = [
    item.dataHoraLiberacao,
    item.dataHoraParada,
    item.criadoEm,
    item.dataHoraAcionamento,
  ];

  for (const dateVal of businessDateFields) {
    if (dateVal && isSameDayAsToday(dateVal)) {
      return true;
    }
  }

  return false;
}
