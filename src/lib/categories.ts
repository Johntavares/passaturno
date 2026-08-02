export const DEFAULT_FAILURE_CATEGORIES = [
  'Comunicação',
  'PLC',
  'Inversor',
  'Instrumentação',
  'Rede Industrial',
  'Sensor',
  'Supervisório',
  'Hardware / Elétrica',
  'Outro',
];

const STORAGE_KEY = 'passaturno-failure-categories-v1';

export function getFailureCategories(): string[] {
  if (typeof window === 'undefined') return DEFAULT_FAILURE_CATEGORIES;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erro ao ler categorias de falha do localStorage:', e);
  }
  return DEFAULT_FAILURE_CATEGORIES;
}

export function saveFailureCategories(categories: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const unique = Array.from(new Set(categories.map((c) => c.trim()).filter(Boolean)));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
    window.dispatchEvent(new Event('categories-updated'));
  } catch (e) {
    console.error('Erro ao salvar categorias de falha no localStorage:', e);
  }
}

export function addFailureCategory(newCategory: string): string[] {
  const current = getFailureCategories();
  const trimmed = newCategory.trim();
  if (!trimmed) return current;
  if (!current.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
    const updated = [...current, trimmed];
    saveFailureCategories(updated);
    return updated;
  }
  return current;
}

export function removeFailureCategory(categoryToRemove: string): string[] {
  const current = getFailureCategories();
  const updated = current.filter((c) => c.toLowerCase() !== categoryToRemove.trim().toLowerCase());
  saveFailureCategories(updated);
  return updated;
}

export function updateFailureCategory(oldName: string, newName: string): string[] {
  const current = getFailureCategories();
  const trimmedNew = newName.trim();
  if (!trimmedNew) return current;
  const updated = current.map((c) => (c.toLowerCase() === oldName.trim().toLowerCase() ? trimmedNew : c));
  saveFailureCategories(updated);
  return updated;
}

export function resetFailureCategories(): string[] {
  saveFailureCategories(DEFAULT_FAILURE_CATEGORIES);
  return DEFAULT_FAILURE_CATEGORIES;
}
