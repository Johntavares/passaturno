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
  Users
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
  onOpenTwoHourReport?: () => void;
  onOpenTeamsCheck?: () => void;
  onOpenSettings: () => void;
  unacceptedCount?: number;
  onRestoreNotifications?: () => void;
  currentTheme?: ThemeMode;
  currentUser?: UserSession | null;
  onLogout?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeShift,
  onOpenNewIncident,
  onOpenAssumeShift,
  onOpenCloseShift,
  onOpenTwoHourReport,
  onOpenTeamsCheck,
  onOpenSettings,
  unacceptedCount = 0,
  onRestoreNotifications,
  currentTheme = 'light',
  currentUser,
  onLogout,
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

            {/* Separador Vertical */}
            <div className="hidden sm:block h-7 w-px bg-slate-200 dark:bg-slate-700" />

            {/* Card: Contexto do Turno Ativo */}
            <div className="flex items-center bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 gap-2 text-xs">
              <Clock className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Turno Ativo:</span>
                {activeShift ? (
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950 px-2 py-0.5 rounded text-[11px]">
                      Turma {activeShift.turma || activeShift.equipe}
                    </span>
                    <span className="text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {activeShift.responsavelNome}
                    </span>
                  </div>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-bold text-[11px] bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                    Nenhum turno em andamento
                  </span>
                )}
              </div>
            </div>

            {/* Card: Operador Autenticado */}
            {currentUser && (
              <div className="hidden md:flex items-center bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-1.5 gap-1.5 text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold text-emerald-900 dark:text-emerald-200 text-[11px]">
                  {currentUser.nome}
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/80 px-1.5 py-0.5 rounded font-mono font-bold">
                  {currentUser.equipe}
                </span>
              </div>
            )}
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

            {/* 0. Check de Equipes (Início de Turno) */}
            {onOpenTeamsCheck && (
              <button
                onClick={onOpenTeamsCheck}
                title="Relatório Inicial de Turno (Check das Equipes)"
                className="inline-flex items-center px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] rounded-lg border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span className="hidden sm:inline">Check de Equipes</span>
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

            {/* 3. Novo Atendimento (CTA Principal) */}
            <button
              onClick={onOpenNewIncident}
              className="inline-flex items-center px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] rounded-lg shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />
              <span>Novo Atendimento</span>
            </button>

            {/* 3. Central de Configurações */}
            <button
              onClick={onOpenSettings}
              title="Abrir Central de Configurações (Perfil, Frota, Turno, Relatórios)"
              className="inline-flex items-center px-2.5 py-1.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-[11px] rounded-lg shadow-xs transition-all cursor-pointer gap-1"
            >
              <Settings className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
              <span className="hidden sm:inline">Configurações</span>
            </button>

            {/* Sair / Logout */}
            {currentUser && onLogout && (
              <button
                onClick={onLogout}
                title="Sair da sessão"
                className="p-2 bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800 shadow-xs transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
