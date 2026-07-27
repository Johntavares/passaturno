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
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';

interface IncidentHistoryTabModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: IncidentType[];
  onOpenTimeline?: (incident: IncidentType) => void;
}

export const IncidentHistoryTabModal: React.FC<IncidentHistoryTabModalProps> = ({
  isOpen,
  onClose,
  incidents,
  onOpenTimeline,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [areaFilter, setAreaFilter] = useState<string>('TODAS');

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

    return matchesSearch && matchesStatus && matchesArea;
  });

  const areasList = ['TODAS', ...Array.from(new Set(incidents.map((i) => i.area)))];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'FINALIZADO':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">🟢 Concluído</span>;
      case 'RETROAGIDO':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">🟣 Retroagido</span>;
      case 'EM_ANDAMENTO':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">🔴 Em Andamento</span>;
      case 'AGUARDANDO':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">🟡 Aguardando</span>;
      case 'PENDENCIA_PROXIMO_TURNO':
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">🔵 Pendência Herdada</span>;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-5xl w-full p-6 shadow-2xl relative my-6 text-slate-800 dark:text-slate-100 animate-fadeIn flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-sky-50 dark:bg-sky-950 rounded-2xl flex items-center justify-center border border-sky-200 dark:border-sky-800">
              <History className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                Histórico Geral de Atendimentos
                <span className="text-xs px-2 py-0.5 bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 font-bold rounded-full border border-sky-200 dark:border-sky-800">
                  {filteredHistory.length} Ocorrência{filteredHistory.length !== 1 ? 's' : ''}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Consulta completa e auditável de todos os registros de automação e passagens de turno.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              Exportar CSV
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="FINALIZADO">🟢 Concluídos</option>
              <option value="RETROAGIDO">🟣 Retroagidos (Não era Automação)</option>
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

        {/* Tabela de Atendimentos */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
              <History className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Nenhum atendimento encontrado para os filtros selecionados.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">TAG / Equipamento</th>
                  <th className="px-4 py-3">Tipo & Falha</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Responsável</th>
                  <th className="px-4 py-3">Data / Hora Parada</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    
                    {/* TAG e Equipamento */}
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {item.tag}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                          {item.equipamentoNome}
                        </span>
                      </div>
                    </td>

                    {/* Falha */}
                    <td className="px-4 py-3 max-w-[250px]">
                      <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {item.falha}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                        {item.tipoFalha} • {item.area}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Responsável */}
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                      <div className="flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.responsavel}</span>
                      </div>
                    </td>

                    {/* Data / Hora Parada */}
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {format(new Date(item.dataHoraParada), 'dd/MM/yyyy HH:mm')}
                    </td>

                    {/* Ação */}
                    <td className="px-4 py-3 text-right">
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
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Registros protegidos contra reinícios de sessão e alteração indevida</span>
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
