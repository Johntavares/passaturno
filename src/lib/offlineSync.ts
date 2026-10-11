import { IncidentType } from '@/types';

const OFFLINE_QUEUE_KEY = 'passaturno_offline_queue_v1';

export function getOfflineQueue(): IncidentType[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Erro ao ler fila offline:', e);
    return [];
  }
}

export function addToOfflineQueue(incident: IncidentType): void {
  if (typeof window === 'undefined') return;
  try {
    const queue = getOfflineQueue();
    // Evita duplicatas se o ID temporário já estiver na fila
    const exists = queue.some((item) => item.id === incident.id);
    if (!exists) {
      queue.push({ ...incident, isOfflinePending: true });
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    }
  } catch (e) {
    console.error('Erro ao salvar ocorrência na fila offline:', e);
  }
}

export function removeFromOfflineQueue(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const queue = getOfflineQueue();
    const filtered = queue.filter((item) => item.id !== id);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Erro ao remover da fila offline:', e);
  }
}

export function hasOfflinePending(): boolean {
  return getOfflineQueue().length > 0;
}

export async function syncOfflineQueue(
  onSuccessItem?: (tempId: string, savedItem: IncidentType) => void
): Promise<{ synced: number; failed: number }> {
  if (typeof window === 'undefined') return { synced: 0, failed: 0 };
  const queue = getOfflineQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const payload = {
        tag: item.tag,
        equipamentoNome: item.equipamentoNome,
        area: item.area,
        tipoFalha: item.tipoFalha,
        falha: item.falha,
        sintoma: item.sintoma,
        dataHoraParada: item.dataHoraParada,
        dataHoraAcionamento: item.dataHoraAcionamento || null,
        previsaoLiberacao: item.previsaoLiberacao || null,
        prioridade: item.prioridade,
        status: item.status,
        noCodigo: item.noCodigo,
        responsavel: item.responsavel,
        motivoEspera: item.motivoEspera || '',
        proximaAcao: item.proximaAcao || '',
        observacao: item.observacao || '',
        turma: item.turma || 'A',
        divisaoAtuacao: item.divisaoAtuacao || 'MONITORAMENTO',
      };

      const res = await fetch('/api/atendimentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedItem = await res.json();
        removeFromOfflineQueue(item.id);
        synced++;
        if (onSuccessItem) {
          onSuccessItem(item.id, savedItem);
        }
      } else {
        failed++;
      }
    } catch (e) {
      console.warn('Falha ao tentar sincronizar item offline:', item.tag, e);
      failed++;
    }
  }

  return { synced, failed };
}
