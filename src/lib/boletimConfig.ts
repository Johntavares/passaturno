import { supabase } from './supabaseClient';

export interface BoletimConfigType {
  turma: string;
  equipeSonda?: string;
  liderVale?: string;
  ausencia?: string;
  ausenciaNome?: string;
  ausenciaMotivo?: string;
  equipSemDespacho?: string;
  equipSemGps?: string;
  equipPreventiva?: string;
  equipManutencao?: string;
}

const STORAGE_KEY = 'passaturno-boletim-config-v1';

function getCached(): Record<string, BoletimConfigType> | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {}
  return null;
}

function cacheConfig(turma: string, config: BoletimConfigType): void {
  if (typeof window === 'undefined') return;
  try {
    const all = getCached() || {};
    all[turma] = config;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {}
}

export async function getBoletimConfig(turma: string): Promise<BoletimConfigType | null> {
  try {
    const res = await fetch(`/api/boletim-config?turma=${encodeURIComponent(turma)}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.turma) {
        cacheConfig(turma, data);
        return data;
      }
      return null;
    }
  } catch (e) {
    console.error('Erro ao buscar configuração do boletim:', e);
  }
  const cached = getCached();
  if (cached && cached[turma]) return cached[turma];
  return null;
}

export async function saveBoletimConfig(turma: string, fields: Partial<BoletimConfigType>): Promise<BoletimConfigType | null> {
  try {
    const res = await fetch('/api/boletim-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ turma, ...fields }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.turma) {
        cacheConfig(turma, data);
        return data;
      }
    }
  } catch (e) {
    console.error('Erro ao salvar configuração do boletim:', e);
  }
  return null;
}

export function subscribeBoletimConfigRealtime(onChange: (config: BoletimConfigType) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const channel = supabase
    .channel('boletim-config-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'BoletimConfig' },
      (payload) => {
        const newConfig = payload.new as BoletimConfigType;
        if (newConfig && newConfig.turma) {
          cacheConfig(newConfig.turma, newConfig);
          onChange(newConfig);
        }
      }
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}