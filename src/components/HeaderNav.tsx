'use client';

import React from 'react';
import { ShiftType } from '@/types';
import { 
  Plus, 
  UserCheck, 
  Clock, 
  User, 
  ShieldCheck, 
  LogOut, 
  Settings,
  Bell,
  Users,
  RotateCcw,
  BarChart3
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
  horarioTurno?: string;
  periodoTurno?: string;
  escala?: string;
  diaEscala?: string;
}

export interface HeaderNavProps {
  activeShift: ShiftType | null;
  onOpenNewIncident: () => void;
  onOpenAssumeShift: () => void;
  onOpenCloseShift: () => void;
  onOpenTwoHourReport?: () => void;
  onOpenTeamsCheck?: () => void;
  onOpenSettings: () => void;
  onOpenTurmaReports?: () => void;
  unacceptedCount?: number;
  onRestoreNotifications?: () => void;
  currentTheme?: ThemeMode;
  currentUser?: UserSession | null;
  onLogout?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: Date | null;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeShift,
  onOpenNewIncident,
  onOpenAssumeShift,
  onOpenCloseShift,
  onOpenTwoHourReport,
  onOpenTeamsCheck,
  onOpenSettings,
  onOpenTurmaReports,
  unacceptedCount = 0,
  onRestoreNotifications,
  currentTheme = 'light',
  currentUser,
  onLogout,
  onRefresh,
  isRefreshing = false,
  lastUpdated,
}) => {

  const [isUserDropdownOpen, setIsUserDropdownOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="theme-header sticky top-0 z-40 shadow-xs border-b">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between py-3 gap-3">
          
          {/* LADO ESQUERDO: Branding + Status do Turno Ativo */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Logo PASSATURNO */}
            <div className="flex items-center space-x-2.5">
              <div className="relative w-9 h-9 flex-shrink-0 bg-white rounded-xl shadow-xs border border-slate-200/80 p-1 flex items-center justify-center overflow-hidden">
                <img 
                  src="/icon.png" 
                  alt="PASSATURNO" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight leading-none">
                  <span className={currentTheme === 'light' ? 'text-slate-900' : 'text-white'}>
                    PASSA
                  </span>
                  <span className="text-emerald-500">
                    TURNO
                  </span>
                </h1>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Informação que continua o trabalho
                </p>
              </div>
            </div>



            
          </div>


          {/* LADO DIREITO: APENAS AS AÇÕES PRINCIPAIS & CONFIGURAÇÕES */}
          <div className="flex items-center gap-1.5 sm:gap-2 justify-end">

            
            {/* Alerta de Ativos Pendentes */}
            {unacceptedCount > 0 && (
              <button
                onClick={onRestoreNotifications}
                className="inline-flex items-center px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold text-[11px] rounded-lg border border-rose-200 dark:border-rose-800 animate-pulse cursor-pointer"
                title="Existem atividades da passagem de turno aguardando aceite"
              >
                <Bell className="w-3.5 h-3.5 mr-1 text-rose-600 animate-bounce" />
                <span>{unacceptedCount} Pendente{unacceptedCount > 1 ? 's' : ''}</span>
              </button>
            )}

            {/* Botão de Atualizar Sistema (Sem recarregar a página) */}
            {onRefresh && (
              <button
                suppressHydrationWarning
                onClick={onRefresh}
                disabled={isRefreshing}
                title={lastUpdated ? `Atualizar dados do sistema (Última: ${lastUpdated.toLocaleTimeString('pt-BR')} • Atalho: Alt+R)` : 'Atualizar dados do sistema (Atalho: Alt+R)'}
                className={`inline-flex items-center px-2.5 py-1.5 font-bold text-[11px] rounded-lg border transition-all cursor-pointer shadow-2xs ${
                  isRefreshing
                    ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-800 cursor-wait'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/50 text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-300 border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700'
                }`}
              >
                <RotateCcw className={`w-3.5 h-3.5 mr-1 text-sky-500 transition-transform ${isRefreshing ? 'animate-spin' : 'hover:rotate-180 duration-500'}`} />
                <span>{isRefreshing ? 'Atualizando...' : 'Atualizar'}</span>
              </button>
            )}



            {/* 1. Boletim de 2h */}
            {onOpenTwoHourReport && (
              <button
                onClick={onOpenTwoHourReport}
                title="Gerar e enviar Boletim de Automação de 2 Horas no WhatsApp"
                className="inline-flex items-center px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />
                <span>Boletim de 2h</span>
              </button>
            )}

            {/* 2. Iniciar / Fechar Turno */}
            <button
              onClick={activeShift ? onOpenCloseShift : onOpenAssumeShift}
              className="inline-flex items-center px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              <span>{activeShift ? 'Fechar Turno' : 'Iniciar Turno'}</span>
            </button>

            {/* 3. Sair do Sistema */}
            {currentUser && onLogout && (
              <button
                onClick={onLogout}
                title="Sair do Sistema"
                className="inline-flex items-center px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-bold text-[11px] rounded-lg border border-rose-200 dark:border-rose-900 transition-all cursor-pointer ml-1"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" />
                <span>Sair</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
