'use client';

import React, { useState } from 'react';
import { IncidentType } from '@/types';
import { UserSession } from './HeaderNav';
import {
  X, BarChart3, RotateCcw, FileSpreadsheet, Calendar, Search, 
  TrendingUp, FileText, History, PieChart
} from 'lucide-react';
import { format } from 'date-fns';
import { parseStoredDate, formatBRTime } from '@/lib/turma';

interface TurmaReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: IncidentType[];
  currentUser: UserSession | null;
  onOpenTimeline?: (incident: IncidentType) => void;
}

export const TurmaReportsModal: React.FC<TurmaReportsModalProps> = ({
  isOpen,
  onClose,
  incidents,
  currentUser,
  onOpenTimeline,
}) => {
  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [reportEndDate, setReportEndDate] = useState<string>('');
  const [reportPriorityFilter, setReportPriorityFilter] = useState<string>('TODAS');
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('TODOS');
  const [reportFalhaFilter, setReportFalhaFilter] = useState<string>('TODAS');
  const [reportSearchTerm, setReportSearchTerm] = useState<string>('');

  const [reportPage, setReportPage] = useState<number>(1);
  const [reportItemsPerPage, setReportItemsPerPage] = useState<number>(10);
  const [reportChartView, setReportChartView] = useState<'totalHours' | 'avgTime'>('totalHours');

  if (!isOpen) return null;

  const currentTurma = currentUser?.turma || 'A';

  const applyDatePreset = (preset: 'today' | '7days' | '30days' | 'thisMonth' | 'all') => {
    setReportPage(1);
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');

    if (preset === 'today') {
      setReportStartDate(todayStr);
      setReportEndDate(todayStr);
    } else if (preset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setReportStartDate(format(d, 'yyyy-MM-dd'));
      setReportEndDate(todayStr);
    } else if (preset === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setReportStartDate(format(d, 'yyyy-MM-dd'));
      setReportEndDate(todayStr);
    } else if (preset === 'thisMonth') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      setReportStartDate(format(d, 'yyyy-MM-dd'));
      setReportEndDate(todayStr);
    } else {
      setReportStartDate('');
      setReportEndDate('');
    }
  };

  const handleResetFilters = () => {
    setReportPage(1);
    setReportStartDate('');
    setReportEndDate('');
    setReportPriorityFilter('TODAS');
    setReportStatusFilter('TODOS');
    setReportFalhaFilter('TODAS');
    setReportSearchTerm('');
  };

  const normalizeFailureName = (raw: string): string => {
    if (!raw) return 'OUTROS';
    const clean = raw.trim().toUpperCase();
    if (clean.includes('CAMON') || clean.includes('COMUN')) {
      return 'COMUNICAÇÃO';
    }
    if (clean.includes('CAS') && clean.includes('GPS')) {
      return 'CAS/GPS';
    }
    return clean;
  };

  const availableFailureTypes = Array.from(
    new Set(incidents.map((i) => normalizeFailureName(i.tipoFalha || i.falha)))
  ).sort();

  const reportFilteredIncidents = incidents.filter((i) => {
    const itemTurma = (i.turma || 'A').toUpperCase().trim();
    if (itemTurma !== currentTurma.toUpperCase()) return false;

    if (reportPriorityFilter !== 'TODAS' && i.prioridade !== reportPriorityFilter) return false;
    if (reportStatusFilter !== 'TODOS' && i.status !== reportStatusFilter) return false;

    const itemFalhaKey = normalizeFailureName(i.tipoFalha || i.falha);
    if (reportFalhaFilter !== 'TODAS' && itemFalhaKey !== reportFalhaFilter) return false;

    if (reportStartDate) {
      const itemDate = parseStoredDate(i.criadoEm || i.dataHoraParada);
      const startDate = new Date(reportStartDate + 'T00:00:00');
      if (!itemDate || itemDate < startDate) return false;
    }

    if (reportEndDate) {
      const itemDate = parseStoredDate(i.criadoEm || i.dataHoraParada);
      const endDate = new Date(reportEndDate + 'T23:59:59');
      if (!itemDate || itemDate > endDate) return false;
    }

    if (reportSearchTerm.trim()) {
      const q = reportSearchTerm.toLowerCase().trim();
      const matches =
        i.tag.toLowerCase().includes(q) ||
        i.equipamentoNome.toLowerCase().includes(q) ||
        i.falha.toLowerCase().includes(q) ||
        i.responsavel.toLowerCase().includes(q) ||
        (i.tipoFalha && i.tipoFalha.toLowerCase().includes(q));
      if (!matches) return false;
    }

    return true;
  });

  const totalReportPages = Math.max(1, Math.ceil(reportFilteredIncidents.length / reportItemsPerPage));
  const currentReportPage = Math.min(reportPage, totalReportPages);
  const reportStartIndex = (currentReportPage - 1) * reportItemsPerPage;
  const reportEndIndex = Math.min(reportStartIndex + reportItemsPerPage, reportFilteredIncidents.length);
  const paginatedReportIncidents = reportFilteredIncidents.slice(reportStartIndex, reportEndIndex);

  const failureAnalyticsMap = reportFilteredIncidents.reduce((acc, item) => {
    const rawKey = normalizeFailureName(item.tipoFalha || item.falha);
    if (!acc[rawKey]) {
      acc[rawKey] = { tipo: rawKey, count: 0, totalMins: 0 };
    }
    acc[rawKey].count += 1;
    const start = parseStoredDate(item.dataHoraParada || item.criadoEm);
    const end = item.dataHoraLiberacao ? (parseStoredDate(item.dataHoraLiberacao) || new Date()) : new Date();
    const mins = start ? Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60))) : 0;
    acc[rawKey].totalMins += mins;
    return acc;
  }, {} as Record<string, { tipo: string; count: number; totalMins: number }>);

  const grandTotalMins = Object.values(failureAnalyticsMap).reduce((sum, f) => sum + f.totalMins, 0);

  const maxCategoryAvgMins = Math.max(
    ...Object.values(failureAnalyticsMap).map((f) => Math.round(f.totalMins / f.count)),
    1
  );

  const sortedFailureAnalytics = Object.values(failureAnalyticsMap)
    .map((f) => {
      const avgMins = Math.round(f.totalMins / f.count);
      return {
        ...f,
        avgMins,
        pctTime: grandTotalMins > 0 ? Math.round((f.totalMins / grandTotalMins) * 100) : 0,
        totalFormatted: `${Math.floor(f.totalMins / 60)}h ${f.totalMins % 60}m`,
        avgFormatted: `${Math.floor(avgMins / 60)}h ${avgMins % 60}m`,
      };
    })
    .sort((a, b) => b.totalMins - a.totalMins);

  const equipmentAnalyticsMap = reportFilteredIncidents.reduce((acc, item) => {
    const key = item.tag.trim().toUpperCase();
    if (!acc[key]) {
      acc[key] = { tag: key, nome: item.equipamentoNome, count: 0, totalMins: 0 };
    }
    acc[key].count += 1;
    const start = parseStoredDate(item.dataHoraParada || item.criadoEm);
    const end = item.dataHoraLiberacao ? (parseStoredDate(item.dataHoraLiberacao) || new Date()) : new Date();
    acc[key].totalMins += start ? Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60))) : 0;
    return acc;
  }, {} as Record<string, { tag: string; nome: string; count: number; totalMins: number }>);

  const sortedEquipments = Object.values(equipmentAnalyticsMap)
    .map((e) => ({
      ...e,
      totalFormatted: `${Math.floor(e.totalMins / 60)}h ${e.totalMins % 60}m`,
    }))
    .sort((a, b) => b.totalMins - a.totalMins)
    .slice(0, 5);

  const avgReportMins = reportFilteredIncidents.length > 0 ? Math.round(grandTotalMins / reportFilteredIncidents.length) : 0;
  const avgReportDurationFormatted = `${Math.floor(avgReportMins / 60)}h ${avgReportMins % 60}m`;
  const grandTotalHoursFormatted = `${Math.floor(grandTotalMins / 60)}h ${grandTotalMins % 60}m`;

  const handleExportCSV = () => {
    if (reportFilteredIncidents.length === 0) return;
    const headers = ['ID', 'TAG', 'Equipamento', 'Tipo Falha', 'Descrição Falha', 'Status', 'Prioridade', 'Responsável', 'Data Parada', 'Data Liberação'];
    const rows = reportFilteredIncidents.map((i) => [
      i.id, i.tag, `"${i.equipamentoNome}"`, `"${i.tipoFalha}"`, `"${i.falha.replace(/"/g, '""')}"`, i.status, i.prioridade, `"${i.responsavel}"`,
      formatBRTime(i.dataHoraParada, { day: '2-digit', month: '2-digit', year: 'numeric' }),
      i.dataHoraLiberacao ? formatBRTime(i.dataHoraLiberacao, { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Relatorio_Turma_${currentTurma}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-slate-900/60 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-6xl max-h-[90vh] flex flex-col relative animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* HEADER */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center border border-sky-100">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">Relatório de Atendimentos</h2>
              <p className="text-xs text-slate-500 font-medium">Análise de dados exclusiva da Turma {currentTurma}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50 custom-scrollbar space-y-4">
          
          {/* FILTERS */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  Período:
                </span>
                {[
                  { id: 'today', label: 'Hoje' },
                  { id: '7days', label: '7 Dias' },
                  { id: '30days', label: '30 Dias' },
                  { id: 'thisMonth', label: 'Mês Atual' },
                  { id: 'all', label: 'Tudo' },
                ].map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => applyDatePreset(btn.id as any)}
                    className="px-2.5 py-0.5 bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 font-bold text-[11px] rounded transition-colors border border-slate-200 hover:border-sky-300 cursor-pointer"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetFilters}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[11px] rounded transition-colors flex items-center gap-1 cursor-pointer border border-slate-200"
                >
                  <RotateCcw className="w-3 h-3" /> Limpar
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Exportar CSV
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">De</label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded text-xs px-2 py-1 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Até</label>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded text-xs px-2 py-1 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Tipo de Falha</label>
                <select
                  value={reportFalhaFilter}
                  onChange={(e) => setReportFalhaFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded text-xs px-2 py-1 font-bold focus:outline-none cursor-pointer focus:border-sky-500"
                >
                  <option value="TODAS">Todas as Falhas</option>
                  {availableFailureTypes.map((typeKey) => (
                    <option key={typeKey} value={typeKey}>{typeKey}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Status</label>
                <select
                  value={reportStatusFilter}
                  onChange={(e) => setReportStatusFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded text-xs px-2 py-1 font-bold focus:outline-none cursor-pointer focus:border-sky-500"
                >
                  <option value="TODOS">Todos Status</option>
                  <option value="FINALIZADO">Concluídos</option>
                  <option value="EM_ANDAMENTO">Em Andamento</option>
                  <option value="PENDENCIA_PROXIMO_TURNO">Pendência</option>
                  <option value="RETROAGIDO">Retroagido</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Buscar</label>
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="TAG, falha..."
                    value={reportSearchTerm}
                    onChange={(e) => setReportSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded text-xs pl-6 pr-2 py-1 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* KPIS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ocorrências</span>
                <span className="text-xl font-black text-slate-900">{reportFilteredIncidents.length}</span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Horas Paradas</span>
                <span className="text-xl font-black text-amber-600 font-mono">⏱️ {grandTotalHoursFormatted}</span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tempo Médio (MTTR)</span>
                <span className="text-xl font-black text-sky-600 font-mono">{avgReportDurationFormatted}</span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Taxa de Resolução</span>
                <span className="text-xl font-black text-emerald-600">
                  {reportFilteredIncidents.length > 0
                    ? Math.round((reportFilteredIncidents.filter((i) => i.status === 'FINALIZADO' || i.status === 'RETROAGIDO').length / reportFilteredIncidents.length) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* COLUNA ESQUERDA: GRÁFICO COMPACTO DE FALHAS E HORAS */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-200">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 leading-tight">
                      Distribuição de Horas & Tipos de Falhas
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium">Impacto em horas indisponíveis</p>
                  </div>
                </div>

                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-bold">
                  <button
                    onClick={() => setReportChartView('totalHours')}
                    className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                      reportChartView === 'totalHours' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    🍩 Rosca
                  </button>
                  <button
                    onClick={() => setReportChartView('avgTime')}
                    className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                      reportChartView === 'avgTime' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    ⏱️ Barras
                  </button>
                </div>
              </div>

              {/* VISTA 1: GRÁFICO DE ROSCA SVG + LEGENDA COMPACTA */}
              {reportChartView === 'totalHours' && (
                <div className="py-1">
                  {sortedFailureAnalytics.length === 0 ? (
                    <div className="py-8 text-center text-xs font-bold text-slate-400">
                      Nenhum dado para o período.
                    </div>
                  ) : (
                    (() => {
                      let cumulativeOffset = 0;
                      const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];
                      const circumference = 251.327; // 2 * PI * 40

                      return (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
                            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                              {sortedFailureAnalytics.map((item, idx) => {
                                const strokeDasharray = `${(item.pctTime / 100) * circumference} ${circumference}`;
                                const strokeDashoffset = -cumulativeOffset;
                                cumulativeOffset += (item.pctTime / 100) * circumference;
                                const color = colors[idx % colors.length];

                                return (
                                  <circle
                                    key={item.tipo}
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="transparent"
                                    stroke={color}
                                    strokeWidth="14"
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                                  >
                                    <title>{`${item.tipo}: ${item.totalFormatted} (${item.pctTime}%)`}</title>
                                  </circle>
                                );
                              })}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Horas</span>
                              <span className="text-xs font-black text-slate-900 font-mono">{grandTotalHoursFormatted}</span>
                            </div>
                          </div>

                          <div className="flex-1 space-y-1 text-xs font-bold w-full">
                            {sortedFailureAnalytics.map((item, idx) => {
                              const color = colors[idx % colors.length];
                              return (
                                <div key={item.tipo} className="flex items-center justify-between bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[10.5px]">
                                  <span className="flex items-center gap-1.5 truncate max-w-[150px]">
                                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                                    <span className="truncate">{item.tipo}</span>
                                  </span>
                                  <span className="font-mono text-slate-700">
                                    ⏱️ {item.totalFormatted} ({item.pctTime}%)
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              )}

              {/* VISTA 2: BARRAS COMPACTAS (MTTR & TEMPO) */}
              {reportChartView === 'avgTime' && (
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                  {sortedFailureAnalytics.length === 0 ? (
                    <div className="py-8 text-center text-xs font-bold text-slate-400">
                      Sem registros no período.
                    </div>
                  ) : (
                    sortedFailureAnalytics.map((item, idx) => {
                      const barWidth = Math.max(8, Math.round((item.avgMins / maxCategoryAvgMins) * 100));

                      return (
                        <div key={item.tipo} className="space-y-0.5">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-800 truncate max-w-[150px]">{idx + 1}. {item.tipo}</span>
                            <span className="font-mono text-sky-700">⏱️ {item.avgFormatted} avg</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                            <div className="h-full bg-sky-500 rounded-full" style={{ width: `${barWidth}%` }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* COLUNA DIREITA: TOP TAGS PARADAS */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-black text-slate-900 leading-tight">
                    Maior Paralisação por TAG
                  </h3>
                </div>
              </div>

              <div className="space-y-1">
                {sortedEquipments.length === 0 ? (
                   <div className="py-4 text-center text-xs font-bold text-slate-400">Sem registros no período.</div>
                ) : (
                   sortedEquipments.map((eq) => (
                     <div key={eq.tag} className="flex items-center justify-between text-[11px] bg-slate-50 px-2 py-1.5 rounded border border-slate-200 font-bold">
                       <span className="font-mono text-slate-900 truncate max-w-[120px]">{eq.tag}</span>
                       <span className="font-mono text-rose-700 shrink-0">⏱️ {eq.totalFormatted}</span>
                     </div>
                   ))
                )}
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-black text-slate-900">Histórico de Atendimentos</h3>
            </div>
            <div className="overflow-x-auto min-h-[250px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">TAG / Equip.</th>
                    <th className="px-4 py-3">Falha</th>
                    <th className="px-4 py-3">Duração</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportFilteredIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center font-bold text-slate-400">Nenhum atendimento para os filtros selecionados.</td>
                    </tr>
                  ) : (
                    paginatedReportIncidents.map((item) => {
                      const start = parseStoredDate(item.dataHoraParada || item.criadoEm);
                      const end = item.dataHoraLiberacao ? (parseStoredDate(item.dataHoraLiberacao) || new Date()) : new Date();
                      const mins = start ? Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60))) : 0;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 align-top">
                            <span className="font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-900 block w-fit mb-0.5">{item.tag}</span>
                            <span className="text-[10px] text-slate-500 font-medium line-clamp-1">{item.equipamentoNome}</span>
                          </td>
                          <td className="px-4 py-2.5 align-top font-bold text-slate-900 max-w-xs truncate">{item.falha}</td>
                          <td className="px-4 py-2.5 align-top font-mono font-bold text-slate-700">{`${Math.floor(mins / 60)}h ${mins % 60}m`}</td>
                          <td className="px-4 py-2.5 align-top font-bold text-[11px]">
                            {item.status === 'FINALIZADO' && <span className="text-emerald-600">🟢 Concluído</span>}
                            {item.status === 'EM_ANDAMENTO' && <span className="text-sky-600">🔵 Andamento</span>}
                            {item.status === 'PENDENCIA_PROXIMO_TURNO' && <span className="text-amber-600">🟠 Pendência</span>}
                            {item.status === 'AGUARDANDO' && <span className="text-purple-600">🟣 Aguardando</span>}
                            {item.status === 'RETROAGIDO' && <span className="text-slate-500">⚪ Retroagido</span>}
                          </td>
                          <td className="px-4 py-2.5 align-top text-right">
                            {onOpenTimeline && (
                              <button
                                onClick={() => onOpenTimeline(item)}
                                className="px-2 py-1 bg-white hover:bg-sky-50 text-sky-700 border border-slate-200 hover:border-sky-300 font-bold text-[10px] rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                <History className="w-3 h-3 text-sky-600" />
                                <span className="hidden sm:inline">Detalhes</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Exibindo <strong className="text-slate-900">{reportFilteredIncidents.length > 0 ? reportStartIndex + 1 : 0}-{reportEndIndex}</strong> de <strong className="text-slate-900">{reportFilteredIncidents.length}</strong></span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setReportPage((p) => Math.max(p - 1, 1))}
                  disabled={currentReportPage === 1}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded font-bold text-slate-700 disabled:opacity-50"
                >‹ Ant</button>
                <span className="px-2 font-bold text-slate-600">{currentReportPage} / {totalReportPages || 1}</span>
                <button
                  onClick={() => setReportPage((p) => Math.min(p + 1, totalReportPages))}
                  disabled={currentReportPage === totalReportPages || totalReportPages === 0}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded font-bold text-slate-700 disabled:opacity-50"
                >Próx ›</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
