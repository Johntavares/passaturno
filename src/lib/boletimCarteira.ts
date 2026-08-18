import { supabase } from './supabaseClient';

export interface BoletimCarteiraType {
  turma: string;
  data: string;
  total?: string;
  andamento?: string;
  aberto?: string;
  pendente?: string;
}

const STORAGE_KEY = 'passaturno-boletim-carteira-v1';

function getCached(turma: string, data: string): BoletimCarteiraType | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const all = JSON.parse(saved);
      const key = `${turma}:${data}`;
      if (all && all[key]) return all[key];
    }
  } catch (e) {}
  return null;
}

function cacheRow(row: BoletimCarteiraType): void {
  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const all = saved ? JSON.parse(saved) : {};
    all[`${row.turma}:${row.data}`] = row;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {}
}

export async function getBoletimCarteira(turma: string, data: string): Promise<BoletimCarteiraType | null> {
  try {
    const res = await fetch(`/api/boletim-carteira?turma=${encodeURIComponent(turma)}&data=${encodeURIComponent(data)}`, { cache: 'no-store' });
    if (res.ok) {
      const row = await res.json();
      if (row && row.turma && row.data) {
        cacheRow(row);
        return row;
      }
      return null;
    }
  } catch (e) {
    console.error('Erro ao buscar carteira do boletim:', e);
  }
  return getCached(turma, data);
}

export async function saveBoletimCarteira(turma: string, data: string, fields: Partial<BoletimCarteiraType>): Promise<BoletimCarteiraType | null> {
  try {
    const res = await fetch('/api/boletim-carteira', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ turma, data, ...fields }),
    });
    if (res.ok) {
      const row = await res.json();
      if (row && row.turma && row.data) {
        cacheRow(row);
        return row;
      }
    }
  } catch (e) {
    console.error('Erro ao salvar carteira do boletim:', e);
  }
  return null;
}

export function subscribeBoletimCarteiraRealtime(onChange: (row: BoletimCarteiraType) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const channel = supabase
    .channel('boletim-carteira-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'BoletimCarteira' },
      (payload) => {
        const newRow = payload.new as BoletimCarteiraType;
        if (newRow && newRow.turma && newRow.data) {
          cacheRow(newRow);
          onChange(newRow);
        }
      }
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}