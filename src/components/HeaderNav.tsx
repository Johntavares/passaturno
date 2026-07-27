'use client';

import React from 'react';
import { ShiftType } from '@/types';
import { 
  Activity, 
  Plus, 
  UserCheck, 
  Lock, 
  Download, 
  Truck, 
  Clock, 
  RefreshCw,
  User,
  ShieldCheck,
  FileSpreadsheet,
  Bell,
  Sun,
  Moon,
  Sparkles,
  LogOut,
  Radio
} from 'lucide-react';

export type ThemeMode = 'light' | 'dark' | 'mina';

export interface UserSession {
  id: string;
  nome: string;
  email: string;
  matricula: string | null;
  equipe: string;
  cargo: string;
  turma?: string;
}

export interface HeaderNavProps {
  activeShift: ShiftType | null;
  onOpenNewIncident: () => void;
  onOpenAssumeShift: () => void;
  onOpenCloseShift: () => void;
  onOpenEquipmentManager: () => void;
  onOpenOneNoteRoutine?: () => void;
  onOpenTwoHourReport?: () => void;
  onOpenGpsDiagnostic?: () => void;
  onOpenHistoryTab?: () => void;
  onOpenLiderTurma?: () => void;
  onRefreshData: () => void;
  isRefreshing?: boolean;
  unacceptedCount?: number;
  onRestoreNotifications?: () => void;
  currentTheme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
  currentUser?: UserSession | null;
  onLogout?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeShift,
  onOpenNewIncident,
  onOpenAssumeShift,
  onOpenCloseShift,
  onOpenEquipmentManager,
  onOpenOneNoteRoutine,
  onOpenTwoHourReport,
  onOpenGpsDiagnostic,
  onOpenHistoryTab,
  onOpenLiderTurma,
  onRefreshData,
  isRefreshing = false,
  unacceptedCount = 0,
  onRestoreNotifications,
  currentTheme = 'light',
  onThemeChange,
  currentUser,
  onLogout,
}) => {
  const handleExportExcel = () => {
    window.open('/api/relatorio', '_blank');
  };

  const cycleTheme = () => {
    if (!onThemeChange) return;
    if (currentTheme === 'light') onThemeChange('dark');
    else if (currentTheme === 'dark') onThemeChange('mina');
    else onThemeChange('light');
  };

  const getThemeIcon = () => {
    switch (currentTheme) {
      case 'dark':
        return <Moon className="w-3.5 h-3.5 text-indigo-400" />;
      case 'mina':
        return <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />;
      case 'light':
      default:
        return <Sun className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  const getThemeLabel = () => {
    switch (currentTheme) {
      case 'dark':
        return 'Escuro CCO';
      case 'mina':
        return 'Mina Noturna';
      case 'light':
      default:
        return 'Claro';
    }
  };

  return (
    <header className="theme-header sticky top-0 z-40 shadow-xs border-b">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between py-3 gap-3.5">
          
          {/* LADO ESQUERDO: Branding + Status do Turno Ativo */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Logo PASSATURNO */}
            <div className="flex items-center space-x-3">
              <div className="relative w-10 h-10 flex-shrink-0 bg-white rounded-xl shadow-xs border border-slate-200/80 p-1 flex items-center justify-center overflow-hidden">
                <img 
                  src="/icon.png" 
                  alt="PASSATURNO" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black tracking-tight leading-none">
                    <span className={currentTheme === 'light' ? 'text-slate-900' : 'text-white font-black'}>
                      PASSA
                    </span>
                    <span className={currentTheme === 'light' ? 'text-emerald-600 font-black' : 'text-emerald-400 font-black'}>
                      TURNO
                    </span>
                  </h1>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    currentTheme === 'light'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                      : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                  }`}>
                    <span className="relative flex h-2 w-2 mr-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Operacional
                  </span>
                </div>
                <p className={`text-[11px] font-semibold mt-0.5 tracking-tight ${
                  currentTheme === 'light' ? 'text-slate-500' : 'text-slate-300'
                }`}>
                  Informação que continua o trabalho.
                </p>
              </div>
            </div>

            {/* Separador Vertical */}
            <div className="hidden sm:block h-8 w-px bg-slate-200/80 dark:bg-slate-700" />

            {/* Card/Pill: Contexto do Turno Ativo */}
            <div className="flex items-center bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl px-3.5 py-1.5 gap-2.5 text-xs transition-colors">
              <div className="p-1 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-lg">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Turno Ativo:</span>
                {activeShift ? (
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sky-700 dark:text-sky-300 bg-sky-100/80 dark:bg-sky-950 px-2 py-0.5 rounded-md border border-sky-200/60 dark:border-sky-800 text-[11px] tracking-wide">
                      {activeShift.equipe}
                    </span>
                    <span className="text-slate-700 dark:text-slate-200 font-semibold text-[11px] flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400 inline" />
                      {activeShift.responsavelNome}
                    </span>
                  </div>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px] bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800">
                    Nenhum turno em andamento
                  </span>
                )}
              </div>
            </div>

            {/* Card/Pill: Operador Autenticado */}
            {currentUser && (
              <div className="flex items-center bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 rounded-xl px-3 py-1.5 gap-2 text-xs">
                <div className="p-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 text-[11px]">
                    {currentUser.nome}
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-900/80 px-1.5 py-0.5 rounded font-mono">
                    {currentUser.equipe}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* LADO DIREITO: Ações Organizadas por Grupos */}
          <div className="flex items-center flex-wrap gap-2.5 justify-end">
            
            {/* Alerta de Ativos Pendentes de Aceite */}
            {unacceptedCount > 0 && (
              <button
                onClick={onRestoreNotifications}
                className="inline-flex items-center px-3 py-2 bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-800 shadow-xs transition-all animate-pulse cursor-pointer"
                title="Existem atividades da passagem de turno aguardando aceite"
              >
                <Bell className="w-4 h-4 mr-1.5 text-rose-600 animate-bounce" />
                <span>{unacceptedCount} Pendente{unacceptedCount > 1 ? 's' : ''} de Aceite</span>
              </button>
            )}

            {/* GRUPO 1: Ação Principal (CTA) */}
            <button
              onClick={onOpenNewIncident}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-sky-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
              Novo Atendimento
            </button>

            {onOpenHistoryTab && (
              <button
                onClick={onOpenHistoryTab}
                title="Abrir Histórico Geral de Atendimentos e Ocorrências"
                className="inline-flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Activity className="w-4 h-4 mr-1.5 text-sky-600 stroke-[2.5]" />
                Histórico de Atendimentos
              </button>
            )}

            {onOpenLiderTurma && (
              <button
                onClick={onOpenLiderTurma}
                title="Painel de Acompanhamento do Líder da Turma (Todas as Letras A, B, C, D)"
                className="inline-flex items-center px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                Líder da Turma
              </button>
            )}

            {/* Separador */}
            <div className="h-6 w-px bg-slate-200/80 dark:bg-slate-700 hidden sm:block" />

            {/* GRUPO 2: Gestão de Turno & Envio de 2h */}
            <div className="flex items-center bg-slate-100/70 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 gap-1">
              {onOpenTwoHourReport && (
                <button
                  onClick={onOpenTwoHourReport}
                  title="Gerar e enviar Boletim de Automação de 2 Horas no WhatsApp"
                  className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Clock className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" />
                  Boletim de 2h
                </button>
              )}

              {onOpenGpsDiagnostic && (
                <button
                  onClick={onOpenGpsDiagnostic}
                  title="Gerar e enviar Reporte de Diagnóstico de GPS e Frota"
                  className="inline-flex items-center px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Radio className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" />
                  Diagnóstico GPS
                </button>
              )}

              <button
                onClick={onOpenAssumeShift}
                title="Assumir o turno atual ou iniciar novo"
                className="inline-flex items-center px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg shadow-xs border border-slate-200/60 dark:border-slate-600 transition-all hover:text-sky-700 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 mr-1.5 text-slate-500 dark:text-slate-400" />
                Assumir Turno
              </button>

              <button
                onClick={onOpenCloseShift}
                title="Passar e fechar o turno atual"
                className="inline-flex items-center px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-amber-50/50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 hover:text-amber-700 text-xs font-semibold rounded-lg shadow-xs border border-slate-200/60 dark:border-slate-600 transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                Fechar Turno
              </button>
            </div>

            {/* Separador */}
            <div className="h-6 w-px bg-slate-200/80 dark:bg-slate-700 hidden sm:block" />

            {/* GRUPO 3: Ferramentas & Temas */}
            <div className="flex items-center gap-1.5">
              {/* Botão de Troca de Tema */}
              <button
                onClick={cycleTheme}
                title={`Tema atual: ${getThemeLabel()}. Clique para alterar.`}
                className="inline-flex items-center px-2.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-xs transition-all cursor-pointer gap-1.5"
              >
                {getThemeIcon()}
                <span className="hidden xl:inline">{getThemeLabel()}</span>
              </button>

              <button
                onClick={onOpenEquipmentManager}
                title="Gerenciador de Frota e Equipamentos"
                className="inline-flex items-center px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-xs transition-all hover:border-slate-300 cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5 mr-1.5 text-slate-500 dark:text-slate-400" />
                Frota
              </button>

              <button
                onClick={handleExportExcel}
                title="Exportar relatório consolidado em Excel"
                className="inline-flex items-center px-3 py-2 bg-emerald-50/80 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-200/80 dark:border-emerald-800 transition-all shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                Excel
              </button>

              <button
                onClick={onRefreshData}
                disabled={isRefreshing}
                title="Atualizar dados agora"
                className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
              </button>

              {/* Botão Sair / Logout */}
              {currentUser && onLogout && (
                <button
                  onClick={onLogout}
                  title="Sair da sessão do operador"
                  className="p-2 bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800 shadow-xs transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
