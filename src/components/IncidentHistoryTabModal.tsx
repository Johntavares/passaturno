'use client';

import React, { useState } from 'react';
import { IncidentType } from '@/types';
import { 
  X, 
  Search, 
  Filter, 
  History, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Tag, 
  User, 
  FileSpreadsheet, 
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  Trash2,
  LayoutGrid,
  List,
  Wrench,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';

interface IncidentHistoryTabModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: IncidentType[];
  onOpenTimeline?: (incident: IncidentType) => void;
  onDeleteIncident?: (id: string) => void;
}

export const IncidentHistoryTabModal: React.FC<IncidentHistoryTabModalProps> = ({
  isOpen,
  onClose,
  incidents,
  onOpenTimeline,
  onDeleteIncident,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [areaFilter, setAreaFilter] = useState<string>('TODAS');
  const [divisaoFilter, setDivisaoFilter] = useState<string>('TODAS');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  if (!isOpen) return null;

  // Filtragem completa de histórico
  const filteredHistory = incidents.filter((item) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.tag.toLowerCase().includes(q) ||
      item.equipamentoNome.toLowerCase().includes(q) ||
      item.falha.toLowerCase().includes(q) ||
      item.responsavel.toLowerCase().includes(q) ||
      (item.solucao && item.solucao.toLowerCase().includes(q)) ||
      (item.observacao && item.observacao.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'TODOS' || item.status === statusFilter;
    const matchesArea = areaFilter === 'TODAS' || item.area === areaFilter;

    const matchesDivisao =
      divisaoFilter === 'TODAS' ||
      (divisaoFilter === 'CORRETIVA_CAMPO'
        ? item.divisaoAtuacao === 'CORRETIVA_CAMPO'
        : item.divisaoAtuacao !== 'CORRETIVA_CAMPO');

    return matchesSearch && matchesStatus && matchesArea && matchesDivisao;
  });


  const areasList = ['TODAS', ...Array.from(new Set(incidents.map((i) => i.area)))];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'FINALIZADO':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">🟢 Concluído</span>;
      case 'RETROAGIDO':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800">🟣 Retroagido</span>;
      case 'EM_ANDAMENTO':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">🔴 Em Andamento</span>;
      case 'AGUARDANDO':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">🟡 Aguardando</span>;
      case 'PENDENCIA_PROXIMO_TURNO':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">🔵 Pendência Herdada</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICA':
        return <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-rose-500 text-white uppercase">🔴 Crítica</span>;
      case 'ALTA':
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-white uppercase">🟠 Alta</span>;
      case 'MEDIA':
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-sky-500 text-white uppercase">🔵 Média</span>;
      case 'BAIXA':
      default:
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-400 text-white uppercase">⚪ Baixa</span>;
    }
  };

  const handleExportCSV = () => {
    if (filteredHistory.length === 0) return;

    const headers = ['ID', 'TAG', 'Equipamento', 'Área', 'Tipo Falha', 'Descrição Falha', 'Status', 'Prioridade', 'Responsável', 'Data Parada', 'Data Liberação', 'Solução'];
    const rows = filteredHistory.map((i) => [
      i.id,
      i.tag,
      `"${i.equipamentoNome}"`,
      `"${i.area}"`,
      `"${i.tipoFalha}"`,
      `"${i.falha.replace(/"/g, '""')}"`,
      i.status,
      i.prioridade,
      `"${i.responsavel}"`,
      i.dataHoraParada,
      i.dataHoraLiberacao || '',
      `"${(i.solucao || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Historico_Atendimentos_PASSATURNO_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-6xl w-full p-4 sm:p-6 shadow-2xl relative my-4 text-slate-800 dark:text-slate-100 animate-fadeIn flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-sky-50 dark:bg-sky-950 rounded-2xl flex items-center justify-center border border-sky-200 dark:border-sky-800 flex-shrink-0">
              <History className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                Histórico Geral de Atendimentos
                <span className="text-xs px-2.5 py-0.5 bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 font-bold rounded-full border border-sky-200 dark:border-sky-800">
                  {filteredHistory.length} Ocorrência{filteredHistory.length !== 1 ? 's' : ''}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Consulta auditável completa dos atendimentos e passagens de turno.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            {/* Alternador de Visualização (Cards vs Tabela) */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Modo Cards Responsivos"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Modo Tabela Detalhada"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabela</span>
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filtros e Barra de Pesquisa */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por TAG, falha, operador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 font-medium"
            />
          </div>

          <div>
            <select
              value={divisaoFilter}
              onChange={(e) => setDivisaoFilter(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="TODAS">Todas as Atuações</option>
              <option value="MONITORAMENTO">📺 Monitoramento NOC</option>
              <option value="CORRETIVA_CAMPO">🔧 Corretiva de Campo</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="FINALIZADO">🟢 Concluídos</option>
              <option value="RETROAGIDO">🟣 Retroagidos</option>
              <option value="EM_ANDAMENTO">🔴 Em Andamento</option>
              <option value="AGUARDANDO">🟡 Aguardando</option>
              <option value="PENDENCIA_PROXIMO_TURNO">🔵 Pendências Herdadas</option>
            </select>
          </div>

          <div>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-sky-500 cursor-pointer"
            >

              {areasList.map((a) => (
                <option key={a} value={a}>
                  {a === 'TODAS' ? 'Todas as Áreas' : a}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Conteúdo Principal do Histórico */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <History className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Nenhum atendimento encontrado para os filtros selecionados.
              </p>
            </div>
          ) : viewMode === 'cards' ? (
            /* 📱 MODAL DE CARDS RESPONSIVOS (Zero Compressão de Informações) */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
                >
                  {/* Linha 1: TAG, Equipamento, Status & Prioridade */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-700/80 pb-2.5">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-mono text-xs font-black bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-200 px-2.5 py-0.5 rounded-lg border border-sky-300 dark:border-sky-800">
                        {item.tag}
                      </span>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                        {item.equipamentoNome}
                      </h4>
                    </div>

                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      {getStatusBadge(item.status)}
                      {getPriorityBadge(item.prioridade)}
                    </div>
                  </div>

                  {/* Linha 2: Falha & Tipo */}
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span>{item.falha}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Categoria: <strong className="text-slate-700 dark:text-slate-300">{item.tipoFalha}</strong> • Área: <strong className="text-slate-700 dark:text-slate-300">{item.area}</strong>
                    </div>
                  </div>

                  {/* Linha 3: Solução Aplicada (se houver) */}
                  {item.solucao && (
                    <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-2.5 text-xs text-emerald-950 dark:text-emerald-200">
                      <div className="font-bold flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 mb-0.5">
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Solução Registrada:</span>
                      </div>
                      <p className="font-medium leading-relaxed">{item.solucao}</p>
                    </div>
                  )}

                  {/* Linha 4: Observação do Turno (se houver) */}
                  {item.observacao && !item.solucao && (
                    <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-700 dark:text-slate-300">
                      <div className="font-bold flex items-center gap-1 text-[10px] text-slate-500 mb-0.5">
                        <MessageSquare className="w-3 h-3" />
                        <span>Anotação:</span>
                      </div>
                      <p className="font-medium">{item.observacao}</p>
                    </div>
                  )}

                  {/* Linha 5: Rodapé do Card (Responsável, Data & Ações) */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 flex-wrap gap-2">
                    <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                      <span className="flex items-center space-x-1 font-semibold text-slate-700 dark:text-slate-300">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.responsavel}</span>
                      </span>

                      <span className="flex items-center space-x-1 font-mono text-[10px]">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{format(new Date(item.dataHoraParada), 'dd/MM/yy HH:mm')}</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {onOpenTimeline && (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenTimeline(item);
                          }}
                          className="inline-flex items-center px-2.5 py-1 bg-sky-50 dark:bg-sky-950 hover:bg-sky-100 text-sky-700 dark:text-sky-300 text-[11px] font-bold rounded-lg border border-sky-200 dark:border-sky-800 transition-colors cursor-pointer"
                        >
                          <span>Linha do Tempo</span>
                          <ChevronRight className="w-3 h-3 ml-1" />
                        </button>
                      )}

                      {onDeleteIncident && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Tem certeza que deseja excluir permanentemente a ocorrência da TAG [${item.tag}]?`)) {
                              onDeleteIncident(item.id);
                            }
                          }}
                          title="Excluir / Apagar Ocorrência"
                          className="p-1 bg-rose-50 dark:bg-rose-950 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            /* 📊 VISÃO EM TABELA AMPLA E DETALHADA */
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">TAG / Equipamento</th>
                    <th className="px-4 py-3">Falha & Solução</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Responsável</th>
                    <th className="px-4 py-3">Data / Hora</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      {/* TAG e Equipamento */}
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-black bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {item.tag}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {item.equipamentoNome}
                          </span>
                        </div>
                      </td>

                      {/* Falha & Solução (Texto completo legível) */}
                      <td className="px-4 py-3 align-top max-w-[320px]">
                        <div className="font-bold text-slate-800 dark:text-slate-100">
                          {item.falha}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-1">
                          {item.tipoFalha} • {item.area}
                        </div>
                        {item.solucao && (
                          <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 p-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50 text-[11px] font-medium">
                            <strong>Solução:</strong> {item.solucao}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 align-top">
                        <div className="space-y-1">
                          {getStatusBadge(item.status)}
                          <div>{getPriorityBadge(item.prioridade)}</div>
                        </div>
                      </td>

                      {/* Responsável */}
                      <td className="px-4 py-3 align-top font-semibold text-slate-700 dark:text-slate-300">
                        <div className="flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.responsavel}</span>
                        </div>
                      </td>

                      {/* Data / Hora Parada */}
                      <td className="px-4 py-3 align-top text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {format(new Date(item.dataHoraParada), 'dd/MM/yyyy HH:mm')}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3 align-top text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {onOpenTimeline && (
                            <button
                              onClick={() => {
                                onClose();
                                onOpenTimeline(item);
                              }}
                              className="inline-flex items-center px-2.5 py-1 bg-sky-50 dark:bg-sky-950 hover:bg-sky-100 text-sky-700 dark:text-sky-300 text-[11px] font-bold rounded-lg border border-sky-200 dark:border-sky-800 transition-colors cursor-pointer"
                            >
                              <span>Linha do Tempo</span>
                              <ChevronRight className="w-3 h-3 ml-1" />
                            </button>
                          )}

                          {onDeleteIncident && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Tem certeza que deseja excluir permanentemente a ocorrência da TAG [${item.tag}]?`)) {
                                  onDeleteIncident(item.id);
                                }
                              }}
                              title="Excluir / Apagar Ocorrência"
                              className="p-1 bg-rose-50 dark:bg-rose-950 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Registros mantidos e auditados com segurança</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
