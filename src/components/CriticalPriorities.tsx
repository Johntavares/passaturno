'use client';

import React, { useState, useEffect } from 'react';
import { IncidentType } from '@/types';
import { 
  Bell, 
  Check, 
  X, 
  Clock, 
  User, 
  MessageSquare, 
  AlertTriangle,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CriticalPrioritiesProps {
  incidents: IncidentType[];
  onOpenWhatsapp: (incident: IncidentType) => void;
  onOpenTimeline: (incident: IncidentType) => void;
  onAcceptPriority: (incident: IncidentType) => void;
}

export const CriticalPriorities: React.FC<CriticalPrioritiesProps> = ({
  incidents,
  onOpenWhatsapp,
  onOpenTimeline,
  onAcceptPriority,
}) => {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('dismissed_shift_notifications');
      if (saved) {
        setDismissedIds(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Erro ao ler notificacoes dispensadas:', e);
    }
  }, []);

  const handleDismiss = (id: string) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      localStorage.setItem('dismissed_shift_notifications', JSON.stringify(updated));
    } catch (e) {
      console.error('Erro ao salvar notificacao dispensada:', e);
    }
  };

  const handleDismissAll = () => {
    const allIds = allUnacceptedItems.map((i) => i.id);
    const updated = Array.from(new Set([...dismissedIds, ...allIds]));
    setDismissedIds(updated);
    try {
      localStorage.setItem('dismissed_shift_notifications', JSON.stringify(updated));
    } catch (e) {
      console.error('Erro ao dispensar todas as notificacoes:', e);
    }
  };

  const handleRestoreAll = () => {
    setDismissedIds([]);
    try {
      localStorage.removeItem('dismissed_shift_notifications');
    } catch (e) {
      console.error('Erro ao limpar notificacoes dispensadas:', e);
    }
  };

  // Todos os itens de prioridade da passagem de turno ainda NÃO aceitos
  const allUnacceptedItems = incidents.filter((i) => {
    const isPriorityOrInherited =
      i.isPendenciaHerdada ||
      i.status === 'PENDENCIA_PROXIMO_TURNO' ||
      i.status === 'AGUARDANDO' ||
      i.prioridade === 'CRITICA' ||
      i.prioridade === 'ALTA';

    const isNotYetAccepted = i.status !== 'FINALIZADO' && i.status !== 'RETROAGIDO' && i.status !== 'EM_ANDAMENTO';

    return isPriorityOrInherited && isNotYetAccepted;
  });

  // Itens visíveis (que não foram dispensados individualmente)
  const visibleItems = allUnacceptedItems.filter((i) => !dismissedIds.includes(i.id));

  // Se não houver nenhum item pendente de aceite, não exibe nada
  if (allUnacceptedItems.length === 0) return null;

  // SE O USUÁRIO FECHOU A NOTIFICAÇÃO (visibleItems === 0), mas ainda há ativos não aceitos:
  // Exibe a Barra de Alerta Recorrente Compacta!
  if (visibleItems.length === 0) {
    return (
      <div className="mb-4 bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border border-amber-300 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs animate-fadeIn">
        <div className="flex items-center space-x-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-rose-600 animate-bounce" />
            <span className="text-xs font-bold text-amber-950">
              Atenção: Existe(m) <strong className="text-rose-700 font-extrabold">{allUnacceptedItems.length} ativo(s)</strong> da passagem de turno pendente(s) de aceite!
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <button
            onClick={handleRestoreAll}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="Restaurar notificações na tela"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Ver Notificações ({allUnacceptedItems.length})</span>
          </button>

          <button
            onClick={() => {
              allUnacceptedItems.forEach((item) => onAcceptPriority(item));
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Aceitar todos os ativos pendentes e enviar para Em Andamento"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Aceitar Todos</span>
          </button>
        </div>
      </div>
    );
  }

  // CASO NORMAL: Exibe a lista compacta de cards
  return (
    <div className="mb-4 bg-rose-50/70 border border-rose-200/80 rounded-xl p-3 shadow-2xs">
      
      {/* Top Bar: Título compacto */}
      <div className="flex items-center justify-between pb-2 border-b border-rose-200/60">
        <div className="flex items-center space-x-2">
          <div className="p-1 bg-rose-100 text-rose-600 rounded-md">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs font-bold text-rose-900 tracking-tight flex items-center gap-1.5">
            Prioridades da Passagem de Turno ({visibleItems.length})
          </h2>
          <span className="text-[11px] text-rose-600 font-normal hidden sm:inline">
            • Aceite para enviar para a fila Em Andamento
          </span>
        </div>

        <button
          onClick={handleDismissAll}
          className="text-[11px] font-medium text-rose-700 hover:text-rose-900 hover:bg-rose-100/60 px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
          title="Ocultar notificações temporariamente"
        >
          <X className="w-3 h-3" />
          Dispensar
        </button>
      </div>

      {/* Cards Compactos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-2.5">
        {visibleItems.map((item) => {
          const paradaDate = new Date(item.dataHoraParada);
          const timeAgo = formatDistanceToNow(paradaDate, { locale: ptBR, addSuffix: true });
          const isCritical = item.prioridade === 'CRITICA';

          return (
            <div
              key={item.id}
              className={`p-2.5 rounded-lg border bg-white shadow-2xs flex flex-col justify-between space-y-2 transition-all hover:shadow-xs ${
                isCritical ? 'border-rose-300' : 'border-amber-200'
              }`}
            >
              {/* Top Card Info */}
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center space-x-1.5 truncate">
                    <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                      {item.tag}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 truncate max-w-[130px]" title={item.equipamentoNome}>
                      {item.equipamentoNome}
                    </span>
                  </div>

                  <span
                    className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      isCritical
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {item.prioridade}
                  </span>
                </div>

                {/* Falha */}
                <p className="text-xs text-slate-700 line-clamp-1 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                  <strong className="text-slate-500 font-semibold">Falha:</strong> {item.falha}
                </p>
              </div>

              {/* Footer e Botões de Ação */}
              <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 truncate max-w-[100px]" title={item.responsavel}>
                  {item.responsavel} • {timeAgo}
                </span>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onAcceptPriority(item)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-2.5 py-1 rounded flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                    title="Aceitar e mover para a fila Em Andamento"
                  >
                    <Check className="w-3 h-3" />
                    <span>Aceitar</span>
                  </button>

                  <button
                    onClick={() => handleDismiss(item.id)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-medium px-2 py-1 rounded transition-colors cursor-pointer"
                    title="Fechar notificação"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
