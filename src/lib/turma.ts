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

// Verifica se uma data em ISO ou string refere-se ao dia de HOJE
export function isSameDayAsToday(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  } catch {
    return false;
  }
}
