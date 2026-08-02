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

// Verifica se uma data em ISO ou string refere-se ao dia de HOJE (suporta fuso horário, ISO e formatos br)
export function isSameDayAsToday(dateStr?: string | Date | null): boolean {
  if (!dateStr) return false;
  try {
    const today = new Date();
    const tYear = today.getFullYear();
    const tMonth = today.getMonth();
    const tDate = today.getDate();

    // Verificação por padrão de texto (ISO YYYY-MM-DD ou BR DD/MM/YYYY)
    if (typeof dateStr === 'string') {
      const yyyy = String(tYear);
      const mm = String(tMonth + 1).padStart(2, '0');
      const dd = String(tDate).padStart(2, '0');

      const isoToday = `${yyyy}-${mm}-${dd}`;
      if (dateStr.includes(isoToday)) return true;

      const brToday = `${dd}/${mm}/${yyyy}`;
      if (dateStr.includes(brToday)) return true;
    }

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;

    // Comparação em fuso local
    if (d.getFullYear() === tYear && d.getMonth() === tMonth && d.getDate() === tDate) {
      return true;
    }

    // Comparação em UTC (para datas ISO terminadas em Z)
    if (d.getUTCFullYear() === today.getUTCFullYear() &&
        d.getUTCMonth() === today.getUTCMonth() &&
        d.getUTCDate() === today.getUTCDate()) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

// Verifica se qualquer um dos campos de data de um atendimento pertence ao dia de HOJE
export function isIncidentFromToday(item: any): boolean {
  if (!item) return false;

  const dateFields = [
    item.dataHoraParada,
    item.criadoEm,
    item.atualizadoEm,
    item.dataHoraLiberacao,
    item.dataHoraAcionamento,
  ];

  for (const dateVal of dateFields) {
    if (dateVal && isSameDayAsToday(dateVal)) {
      return true;
    }
  }

  return false;
}
