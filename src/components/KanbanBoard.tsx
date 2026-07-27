'use client';

import React, { useState } from 'react';
import { IncidentType, IncidentStatusType, PriorityLevel } from '@/types';
import { 
  Clock, 
  User, 
  MessageSquare, 
  History, 
  Search, 
  Filter, 
  Wrench, 
  Tag, 
  AlertCircle,
  Send,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Trash2
} from 'lucide-react';
import { differenceInMinutes, format } from 'date-fns';

interface KanbanBoardProps {
  incidents: IncidentType[];
  onStatusChange: (id: string, newStatus: IncidentStatusType) => void;
  onPriorityChange: (id: string, newPriority: PriorityLevel) => void;
  onOpenWhatsapp: (incident: IncidentType) => void;
  onOpenTimeline: (incident: IncidentType) => void;
  onOpenEquipmentHistory: (tag: string) => void;
  onOpenEditIncident: (incident: IncidentType) => void;
  onOpenCommentModal: (incident: IncidentType) => void;
  onDeleteIncident?: (id: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  incidents,
  onStatusChange,
  onPriorityChange,
  onOpenWhatsapp,
  onOpenTimeline,
  onOpenEquipmentHistory,
  onOpenEditIncident,
  onOpenCommentModal,
  onDeleteIncident,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('TODAS');
  
  // Estado de cards expandidos (por padrão, false = todos minimizados)
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpandAll = () => {
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    const newMap: Record<string, boolean> = {};
    incidents.forEach((i) => {
      newMap[i.id] = nextState;
    });
    setExpandedCards(newMap);
  };

  // Filtragem de busca e área
  const filteredIncidents = incidents.filter((item) => {
    const matchesSearch =
      item.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.equipamentoNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.falha.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.responsavel.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesArea = selectedArea === 'TODAS' || item.area === selectedArea;

    return matchesSearch && matchesArea;
  });

  const areas = ['TODAS', ...Array.from(new Set(incidents.map((i) => i.area)))];

  // Separar colunas
  const colEmAndamento = filteredIncidents.filter((i) => i.status === 'EM_ANDAMENTO');
  const colAguardando = filteredIncidents.filter((i) => i.status === 'AGUARDANDO');
  const colFinalizados = filteredIncidents.filter((i) => i.status === 'FINALIZADO' || i.status === 'RETROAGIDO');
  const colHerdados = filteredIncidents.filter(
    (i) => i.status === 'PENDENCIA_PROXIMO_TURNO' || (i.isPendenciaHerdada && i.status !== 'FINALIZADO' && i.status !== 'RETROAGIDO')
  );

  const calculateDowntime = (dataParada: string, dataLiberacao?: string | null) => {
    const start = new Date(dataParada);
    const end = dataLiberacao ? new Date(dataLiberacao) : new Date();
    const mins = differenceInMinutes(end, start);
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours > 0) return `${hours}h ${remainingMins}m`;
    return `${remainingMins} min`;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICA':
        return 'bg-rose-500 text-white font-bold';
      case 'ALTA':
        return 'bg-amber-500 text-white font-bold';
      case 'MEDIA':
        return 'bg-sky-500 text-white font-medium';
      case 'BAIXA':
      default:
        return 'bg-slate-200 text-slate-700 font-medium';
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtro e Controle de Exibição */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        
        {/* Pesquisa */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por TAG, equipamento, falha..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 font-medium transition-all"
          />
        </div>

        {/* Filtro por Área + Botão Expandir/Minimizar Todos */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Área:</span>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-sky-500 font-medium transition-all cursor-pointer"
            >
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={toggleExpandAll}
            className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Alternar entre modo minimizado e detalhado para todos os cards"
          >
            {allExpanded ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
                <span>Minimizar Todos</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
                <span>Expandir Todos</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Grid de Colunas Kanban Estilo Trello */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* COLUNA 1: 🔴 Em Andamento */}
        <div className="bg-slate-100/80 border border-slate-200/70 rounded-2xl p-3 flex flex-col min-h-[500px]">
          <div className="bg-rose-500 text-white p-2.5 rounded-xl shadow-xs flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wide flex items-center">
              Em Andamento
            </h3>
            <span className="bg-white/20 px-2 py-0.5 rounded-md text-[11px] font-bold">
              {colEmAndamento.length}
            </span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
            {colEmAndamento.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 italic">Nenhum atendimento em andamento</div>
            ) : (
              colEmAndamento.map((item) => renderCard(item))
            )}
          </div>
        </div>

        {/* COLUNA 2: 🟡 Aguardando */}
        <div className="bg-slate-100/80 border border-slate-200/70 rounded-2xl p-3 flex flex-col min-h-[500px]">
          <div className="bg-amber-500 text-white p-2.5 rounded-xl shadow-xs flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wide flex items-center">
              Aguardando
            </h3>
            <span className="bg-white/20 px-2 py-0.5 rounded-md text-[11px] font-bold">
              {colAguardando.length}
            </span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
            {colAguardando.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 italic">Nenhum atendimento aguardando</div>
            ) : (
              colAguardando.map((item) => renderCard(item))
            )}
          </div>
        </div>

        {/* COLUNA 3: 🟢 Concluído / Finalizados */}
        <div className="bg-slate-100/80 border border-slate-200/70 rounded-2xl p-3 flex flex-col min-h-[500px]">
          <div className="bg-emerald-500 text-white p-2.5 rounded-xl shadow-xs flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wide flex items-center">
              Concluído
            </h3>
            <span className="bg-white/20 px-2 py-0.5 rounded-md text-[11px] font-bold">
              {colFinalizados.length}
            </span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
            {colFinalizados.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 italic">Nenhum atendimento finalizado</div>
            ) : (
              colFinalizados.map((item) => renderCard(item))
            )}
          </div>
        </div>

        {/* COLUNA 4: 🔵 Pendências Herdadas */}
        <div className="bg-slate-100/80 border border-slate-200/70 rounded-2xl p-3 flex flex-col min-h-[500px]">
          <div className="bg-sky-500 text-white p-2.5 rounded-xl shadow-xs flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wide flex items-center">
              Pendências Herdadas
            </h3>
            <span className="bg-white/20 px-2 py-0.5 rounded-md text-[11px] font-bold">
              {colHerdados.length}
            </span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
            {colHerdados.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 italic">Nenhuma pendência herdada</div>
            ) : (
              colHerdados.map((item) => renderCard(item))
            )}
          </div>
        </div>

      </div>
    </div>
  );

  // Renderizador do Card do Atendimento (Minimizado por padrão)
  function renderCard(item: IncidentType) {
    const paradaDate = new Date(item.dataHoraParada);
    const downtimeStr = calculateDowntime(item.dataHoraParada, item.dataHoraLiberacao);
    const isFinished = item.status === 'FINALIZADO';
    const isExpanded = !!expandedCards[item.id];

    return (
      <div
        key={item.id}
        className={`bg-white border rounded-xl p-2.5 shadow-2xs transition-all hover:shadow-xs space-y-2 ${
          item.prioridade === 'CRITICA' && !isFinished
            ? 'border-rose-300 ring-1 ring-rose-100'
            : 'border-slate-200/80'
        }`}
      >
        {/* LINHA 1: TAG, Nome do Equipamento & Prioridade */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center space-x-1.5 truncate">
            <button
              onClick={() => onOpenEquipmentHistory(item.tag)}
              title="Clique para ver histórico da TAG"
              className="badge-tag text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono font-bold hover:bg-sky-50 hover:text-sky-700 transition-colors flex items-center gap-1 border border-slate-200"
            >
              <Tag className="w-3 h-3 text-slate-400" />
              {item.tag}
            </button>
            <h4 className="text-xs font-bold text-slate-800 truncate max-w-[130px]" title={item.equipamentoNome}>
              {item.equipamentoNome}
            </h4>
          </div>

          <div className="flex items-center space-x-1">
            {!isFinished && (
              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${getPriorityBadge(item.prioridade)}`}>
                {item.prioridade}
              </span>
            )}
          </div>
        </div>

        {/* MODO MINIMIZADO (Informações essenciais: Status + Hora da Parada + Ações) */}
        {!isExpanded ? (
          <div className="space-y-2 pt-1 border-t border-slate-100">
            {/* Status, Tempo Parado e Previsão de Liberação */}
            <div className="flex items-center justify-between text-[11px] flex-wrap gap-1">
              <select
                value={item.status}
                onChange={(e) => onStatusChange(item.id, e.target.value as IncidentStatusType)}
                className="bg-slate-50 text-[10px] font-semibold text-slate-700 border border-slate-200 rounded-lg px-1.5 py-0.5 focus:outline-none focus:bg-white focus:border-sky-500 cursor-pointer max-w-[145px] truncate"
                title="Alterar status do atendimento"
              >
                <option value="EM_ANDAMENTO">🔴 Em Andamento</option>
                <option value="AGUARDANDO">🟡 Aguardando</option>
                <option value="FINALIZADO">🟢 Concluído</option>
                <option value="RETROAGIDO">🟣 Retroagido</option>
                <option value="PENDENCIA_PROXIMO_TURNO">🔵 Pendência Herdada</option>
              </select>

              <div className="flex items-center gap-2 text-[10px]">
                <span className="font-semibold text-slate-600 flex items-center gap-1" title={format(paradaDate, 'dd/MM/yyyy HH:mm')}>
                  <Clock className="w-3 h-3 text-slate-400" />
                  Parado: <strong>{downtimeStr}</strong>
                </span>

                <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Prev: <strong>{item.previsaoLiberacao || '---'}</strong>
                </span>
              </div>
            </div>

            {/* Ícones de Ação Rápida + Botão Detalhes (Expandir) */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <div className="flex items-center space-x-1">
                {/* Botão de Comentários / Anotações */}
                <button
                  onClick={() => onOpenCommentModal(item)}
                  title="Adicionar / Ver Anotações do Turno"
                  className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors relative"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {item.observacao && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  )}
                </button>

                {/* Botão Histórico / Linha do Tempo */}
                <button
                  onClick={() => onOpenTimeline(item)}
                  title="Linha do Tempo"
                  className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors"
                >
                  <History className="w-3.5 h-3.5" />
                </button>

                {/* Botão Editar / Solução */}
                <button
                  onClick={() => onOpenEditIncident(item)}
                  title="Editar / Solução"
                  className="p-1 bg-slate-50 hover:bg-slate-100 text-amber-700 rounded-lg border border-slate-200 transition-colors"
                >
                  <Wrench className="w-3.5 h-3.5" />
                </button>

                {/* Botão Excluir Atendimento */}
                {onDeleteIncident && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Tem certeza que deseja apagar o atendimento da TAG [${item.tag}]? Esta ação não pode ser desfeita.`)) {
                        onDeleteIncident(item.id);
                      }
                    }}
                    title="Excluir / Apagar Atendimento"
                    className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Botão para Expandir Detalhes */}
              <button
                onClick={() => toggleExpand(item.id)}
                className="text-[10px] font-semibold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded border border-sky-200/80 transition-colors flex items-center gap-0.5 cursor-pointer"
                title="Expandir informações detalhadas do atendimento"
              >
                <span>Detalhes</span>
                <ChevronDown className="w-3 h-3 text-sky-600" />
              </button>
            </div>
          </div>
        ) : (
          /* MODO MAXIMIZADO / EXPANDIDO (Todas as Informações) */
          <div className="space-y-2.5 pt-1.5 border-t border-slate-100 animate-fadeIn">
            {/* Descrição da Falha */}
            <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-200/60 leading-relaxed">
              <strong className="text-slate-700 font-semibold">Falha:</strong> {item.falha}
            </p>

            {/* Solução Aplicada (se finalizado) */}
            {isFinished && item.solucao && (
              <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                <strong>Solução:</strong> {item.solucao}
              </div>
            )}

            {/* Motivo da Espera / Próxima Ação */}
            {item.status === 'AGUARDANDO' && item.motivoEspera && (
              <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                <strong>Aguardando:</strong> {item.motivoEspera}
              </div>
            )}

            {item.proximaAcao && (
              <div className="text-[11px] text-sky-800 bg-sky-50 p-2 rounded-lg border border-sky-200">
                <strong>Próxima Ação:</strong> {item.proximaAcao}
              </div>
            )}

            {/* Anotações / Observação do Atendimento */}
            {item.observacao && (
              <div className="text-[11px] text-amber-900 bg-amber-50/90 p-2 rounded-lg border border-amber-200/80 leading-relaxed font-medium">
                <strong className="text-amber-950 font-bold flex items-center gap-1 mb-0.5">
                  <MessageSquare className="w-3 h-3 text-amber-600 inline" />
                  Anotação do Turno:
                </strong>
                {item.observacao}
              </div>
            )}

            {/* Metadados: Parada & Responsável */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <div className="flex items-center space-x-1 text-slate-700">
                <User className="w-3 h-3 text-slate-400" />
                <span className="truncate">{item.responsavel}</span>
              </div>

              <div className="flex items-center space-x-1 text-slate-600 justify-end" title={format(paradaDate, 'dd/MM/yyyy HH:mm')}>
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Parado: <strong>{downtimeStr}</strong></span>
              </div>
            </div>

            {/* Botões de Ação do Card Maximizado */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-1 flex-wrap">
              <div className="flex items-center gap-1 max-w-[200px] flex-wrap">
                {/* Seletor rápido de Status */}
                <select
                  value={item.status}
                  onChange={(e) => onStatusChange(item.id, e.target.value as IncidentStatusType)}
                  className="bg-slate-50 text-[10px] font-semibold text-slate-700 border border-slate-200 rounded-lg px-1.5 py-1 focus:outline-none focus:bg-white focus:border-sky-500 cursor-pointer max-w-[125px] truncate"
                  title="Alterar status do atendimento"
                >
                  <option value="EM_ANDAMENTO">🔴 Em Andamento</option>
                  <option value="AGUARDANDO">🟡 Aguardando</option>
                  <option value="FINALIZADO">🟢 Concluído</option>
                  <option value="RETROAGIDO">🟣 Retroagido</option>
                  <option value="PENDENCIA_PROXIMO_TURNO">🔵 Pendência Herdada</option>
                </select>

                {/* Seletor rápido de Prioridade (oculto quando concluído) */}
                {!isFinished && (
                  <select
                    value={item.prioridade}
                    onChange={(e) => onPriorityChange(item.id, e.target.value as PriorityLevel)}
                    title="Alterar prioridade do atendimento"
                    className={`text-[10px] font-bold border rounded-lg px-1 py-1 focus:outline-none cursor-pointer max-w-[70px] truncate ${
                      item.prioridade === 'CRITICA' || item.prioridade === 'ALTA'
                        ? 'bg-rose-50 text-rose-700 border-rose-200 font-extrabold'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <option value="BAIXA">⚪ Baixa</option>
                    <option value="MEDIA">🔵 Média</option>
                    <option value="ALTA">🟠 Alta</option>
                    <option value="CRITICA">🔴 Crítica</option>
                  </select>
                )}
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onOpenCommentModal(item)}
                  title="Adicionar / Ver Anotações do Turno"
                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors relative"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {item.observacao && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  )}
                </button>

                <button
                  onClick={() => onOpenWhatsapp(item)}
                  title="Gerar Resumo WhatsApp"
                  className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg border border-sky-200 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onOpenTimeline(item)}
                  title="Linha do Tempo"
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors"
                >
                  <History className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onOpenEditIncident(item)}
                  title="Editar / Solução"
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 text-amber-700 rounded-lg border border-slate-200 transition-colors"
                >
                  <Wrench className="w-3.5 h-3.5" />
                </button>

                {onDeleteIncident && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Tem certeza que deseja apagar o atendimento da TAG [${item.tag}]? Esta ação não pode ser desfeita.`)) {
                        onDeleteIncident(item.id);
                      }
                    }}
                    title="Excluir / Apagar Atendimento"
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => toggleExpand(item.id)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg border border-slate-200 transition-colors flex items-center"
                  title="Recolher / Minimizar card"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }
};
