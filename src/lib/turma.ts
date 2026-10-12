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

// ============================================================================
// PROGRESSÃO AUTOMÁTICA DA ESCALA DE TRABALHO (EX: 3x3, 2x3, 4x3)
// ============================================================================

/**
 * Remove anotações extras e referências de data, retornando a string limpa
 * como '1º Dia', '2º Dia', '3º Dia' ou 'Folga'.
 */
export function cleanDiaEscala(raw?: string | null): string {
  if (!raw) return '1º Dia';
  const cleaned = raw.replace(/\[\d{4}-\d{2}-\d{2}\]/g, '').trim();
  return cleaned || '1º Dia';
}

/**
 * Extrai o dia base e a data de referência a partir de uma string codificada ou crua.
 */
export function parseDiaEscala(raw?: string | null): { baseDia: string; baseDate: string | null } {
  if (!raw) return { baseDia: '1º Dia', baseDate: null };
  const match = raw.match(/^(.*?)\s*\[(\d{4}-\d{2}-\d{2})\]$/);
  if (match) {
    return {
      baseDia: cleanDiaEscala(match[1]),
      baseDate: match[2],
    };
  }
  return {
    baseDia: cleanDiaEscala(raw),
    baseDate: null,
  };
}

/**
 * Calcula dinamicamente o dia da escala atual (ex: 3x3) a partir de uma data de referência.
 * Na escala 3x3:
 * - 1º Dia -> 2º Dia -> 3º Dia -> Folga (3 dias de folga) -> 1º Dia (repete o ciclo de 6 dias).
 */
export function calculateCurrentDiaEscala(
  baseDia: string,
  baseDateYMD: string,
  escala = '3x3',
  targetDateYMD?: string
): string {
  const cleanBase = cleanDiaEscala(baseDia);
  const targetYMD = targetDateYMD || getTodayYMDInBR();

  // Parsing da escala (ex: '3x3' -> 3 dias de trabalho, 3 dias de folga)
  const matchEscala = (escala || '3x3').match(/^(\d+)\s*[xX]\s*(\d+)$/);
  const workDays = matchEscala ? Math.max(1, parseInt(matchEscala[1], 10) || 3) : 3;
  const offDays = matchEscala ? Math.max(1, parseInt(matchEscala[2], 10) || 3) : 3;
  const cycleLength = workDays + offDays;

  // Determina o índice base no ciclo (0 = 1º Dia, 1 = 2º Dia, etc.)
  let baseIndex = 0;
  const lower = cleanBase.toLowerCase();
  if (lower.includes('folga')) {
    baseIndex = workDays; // Primeiro dia de folga
  } else {
    const numMatch = cleanBase.match(/(\d+)/);
    if (numMatch) {
      baseIndex = Math.max(0, parseInt(numMatch[1], 10) - 1);
    }
  }

  // Diferença em dias corridos calculados a partir de UTC meia-noite para evitar desvios de timezone
  const [y1, m1, d1] = baseDateYMD.split('-').map(Number);
  const [y2, m2, d2] = targetYMD.split('-').map(Number);
  if (isNaN(y1) || isNaN(m1) || isNaN(d1) || isNaN(y2) || isNaN(m2) || isNaN(d2)) {
    return cleanBase;
  }

  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  const diffDays = Math.round((utc2 - utc1) / (24 * 60 * 60 * 1000));

  const currentCycleIndex = ((baseIndex + diffDays) % cycleLength + cycleLength) % cycleLength;

  if (currentCycleIndex < workDays) {
    return `${currentCycleIndex + 1}º Dia`;
  }
  return 'Folga';
}

const ESCALA_REF_PREFIX = 'passaturno-escala-ref-';

export interface EscalaReference {
  baseDia: string;
  baseDate: string;
  escala: string;
  turma?: string;
  userId?: string;
}

/**
 * Salva a referência da escala no localStorage (por turma e usuário).
 */
export function saveEscalaReference(ref: {
  baseDia: string;
  baseDate?: string;
  escala?: string;
  turma?: string;
  userId?: string;
}): void {
  if (typeof window === 'undefined') return;
  try {
    const today = getTodayYMDInBR();
    const data: EscalaReference = {
      baseDia: cleanDiaEscala(ref.baseDia),
      baseDate: ref.baseDate || today,
      escala: ref.escala || '3x3',
      turma: ref.turma,
      userId: ref.userId,
    };
    if (ref.turma) {
      const cleanT = normalizeTurma(ref.turma) || ref.turma;
      localStorage.setItem(`${ESCALA_REF_PREFIX}turma-${cleanT}`, JSON.stringify(data));
    }
    if (ref.userId) {
      localStorage.setItem(`${ESCALA_REF_PREFIX}user-${ref.userId}`, JSON.stringify(data));
    }
    localStorage.setItem(`${ESCALA_REF_PREFIX}current`, JSON.stringify(data));
  } catch (e) {
    console.warn('Erro ao salvar referência de escala:', e);
  }
}

/**
 * Obtém a referência da escala do localStorage.
 */
export function getEscalaReference(turma?: string, userId?: string): EscalaReference | null {
  if (typeof window === 'undefined') return null;
  try {
    if (userId) {
      const u = localStorage.getItem(`${ESCALA_REF_PREFIX}user-${userId}`);
      if (u) return JSON.parse(u);
    }
    if (turma) {
      const cleanT = normalizeTurma(turma) || turma;
      const t = localStorage.getItem(`${ESCALA_REF_PREFIX}turma-${cleanT}`);
      if (t) return JSON.parse(t);
    }
    const c = localStorage.getItem(`${ESCALA_REF_PREFIX}current`);
    if (c) return JSON.parse(c);
  } catch {}
  return null;
}

/**
 * Calcula o dia efetivo de hoje para um usuário / turma, considerando avanço automático.
 */
export function getEffectiveDiaEscala(user?: any, turma?: string): string {
  const userTurma = turma || user?.turma || 'A';
  const escala = user?.escala || '3x3';
  const parsed = parseDiaEscala(user?.diaEscala);
  let baseDia = parsed.baseDia;
  let baseDate = parsed.baseDate || user?.diaEscalaDataRef;

  // Se não tem data no objeto user, busca no localStorage
  if (!baseDate && typeof window !== 'undefined') {
    const ref = getEscalaReference(userTurma, user?.id);
    if (ref && ref.baseDate) {
      baseDate = ref.baseDate;
      if (!user?.diaEscala || cleanDiaEscala(user.diaEscala) === '1º Dia') {
        baseDia = ref.baseDia;
      }
    }
  }

  // Se ainda não tiver data base, adota a data de hoje para iniciar a contagem
  if (!baseDate) {
    return cleanDiaEscala(baseDia);
  }

  return calculateCurrentDiaEscala(baseDia, baseDate, escala);
}

