import { supabase } from './supabaseClient';

export const DEFAULT_FAILURE_CATEGORIES = [
  'CASGPS',
  'OPTALERT',
  'MEMES',
  'DESMONTE',
  'TELEOP',
  'AUTONOMOS',
  'MODULAR',
  'ALIMENTAÇÃO/ELETRICA',
  'MOVIMENTAÇÃO',
  'COMUNICAÇÃO',
];

const STORAGE_KEY = 'passaturno-failure-categories-v1';
const API_URL = '/api/categorias';

function getCached(): string[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return null;
}

function cacheCategories(categories: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  } catch (e) {}
}

export function notifyCategoriesUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('categories-updated'));
}

export async function getFailureCategories(): Promise<string[]> {
  try {
    const res = await fetch(API_URL, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        cacheCategories(data);
        return data;
      }
    }
  } catch (e) {
    console.error('Erro ao buscar categorias do banco:', e);
  }
  const cached = getCached();
  return cached || DEFAULT_FAILURE_CATEGORIES;
}

async function mutateCategories(init: RequestInit): Promise<string[]> {
  const res = await fetch(API_URL, init);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || 'Erro ao atualizar categorias');
  }
  if (Array.isArray(data)) {
    cacheCategories(data);
    notifyCategoriesUpdated();
    return data;
  }
  throw new Error('Resposta inválida do servidor');
}

export async function addFailureCategory(newCategory: string): Promise<string[]> {
  const trimmed = newCategory.trim();
  if (!trimmed) return getFailureCategories();
  return mutateCategories({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: trimmed }),
  });
}

export async function removeFailureCategory(categoryToRemove: string): Promise<string[]> {
  return mutateCategories({
    method: 'DELETE',
    body: JSON.stringify({ nome: categoryToRemove.trim() }),
  });
}

export async function updateFailureCategory(oldName: string, newName: string): Promise<string[]> {
  return mutateCategories({
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ antigo: oldName.trim(), novo: newName.trim() }),
  });
}

export async function resetFailureCategories(): Promise<string[]> {
  const res = await fetch(`${API_URL}/reset`, { method: 'POST' });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || 'Erro ao restaurar categorias padrão');
  }
  if (Array.isArray(data)) {
    cacheCategories(data);
    notifyCategoriesUpdated();
    return data;
  }
  throw new Error('Resposta inválida do servidor');
}

let realtimeSubscribed = false;

export function subscribeFailureCategoriesRealtime(): () => void {
  if (typeof window === 'undefined') return () => {};
  if (realtimeSubscribed) return () => {};

  const channel = supabase
    .channel('failure-categories-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'FailureCategory' },
      () => {
        getFailureCategories().then(() => {
          notifyCategoriesUpdated();
        }).catch(() => {});
      }
    )
    .subscribe();

  realtimeSubscribed = true;

  return () => {
    realtimeSubscribed = false;
    supabase.removeChannel(channel);
  };
}