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
    const todayYMD = getTodayYMDInBR();

    if (typeof dateStr === 'string') {
      const trimmed = dateStr.trim();
      // Comparação direta de prefixo YYYY-MM-DD
      if (trimmed.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        if (trimmed.slice(0, 10) === todayYMD) {
          return true;
        }
      }

      // Comparação por DD/MM/YYYY
      const todayDate = new Date();
      const dd = String(todayDate.getDate()).padStart(2, '0');
      const mm = String(todayDate.getMonth() + 1).padStart(2, '0');
      const yyyy = String(todayDate.getFullYear());
      const brToday = `${dd}/${mm}/${yyyy}`;

      if (trimmed.includes(brToday)) {
        return true;
      }

      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        const options: Intl.DateTimeFormatOptions = {
          timeZone: 'America/Sao_Paulo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        };
        const itemYMD = new Intl.DateTimeFormat('en-CA', options).format(d);
        return itemYMD === todayYMD;
      }
    } else if (dateStr instanceof Date && !isNaN(dateStr.getTime())) {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      };
      const itemYMD = new Intl.DateTimeFormat('en-CA', options).format(dateStr);
      return itemYMD === todayYMD;
    }

    return false;
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
