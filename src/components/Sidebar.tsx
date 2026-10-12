'use client';

import React, { useState, useEffect } from 'react';
import { UserSession } from './HeaderNav';
import {
  Plus,
  Settings,
  Users,
  Tags,
  Truck,
  Sun,
  BarChart3,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  currentUser?: UserSession | null;
  onOpenNewIncident: () => void;
  onOpenTeamsCheck?: () => void;
  onOpenTurmaReports?: () => void;
  onOpenSettings: (tab: 'profile' | 'equipe' | 'categories' | 'fleet' | 'reports' | 'theme') => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  onOpenNewIncident,
  onOpenTeamsCheck,
  onOpenTurmaReports,
  onOpenSettings,
  onLogout,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Em telas estreitas (< 1024px) inicia recolhido (apenas ícones) para não ocupar espaço
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsCollapsed(true);
    }
  }, []);

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-56'} theme-card flex flex-col justify-between flex-shrink-0 border-r relative z-30 transition-all duration-300`}>
      
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Expandir Menu" : "Recolher Menu"}
        className="absolute -right-3 top-6 w-6 h-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-sky-500 hover:border-sky-300 shadow-sm z-40 cursor-pointer transition-colors"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className={`p-4 space-y-5 ${isCollapsed ? 'px-2' : ''}`}>

        {/* User Info */}
        {currentUser && (
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-2'} pb-4 border-b border-[var(--card-border)]`}>
            <div className="w-10 h-10 bg-[var(--background)] rounded-full flex items-center justify-center flex-shrink-0 border border-[var(--card-border)]">
              <User className="w-5 h-5 text-[var(--text-muted)]" />
            </div>
            {!isCollapsed && (
              <div className="truncate overflow-hidden transition-all duration-300">
                <p className="text-sm font-bold truncate">{currentUser.nome}</p>
                <p className="text-[11px] text-[var(--text-muted)] font-medium">Turma {currentUser.turma}</p>
              </div>
            )}
          </div>
        )}

        {/* CTA Principal */}
        <button
          onClick={onOpenNewIncident}
          title={isCollapsed ? "Novo Atendimento" : undefined}
          className={`w-full flex items-center justify-center py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${isCollapsed ? 'px-0' : 'px-4'}`}
        >
          <Plus className={`w-5 h-5 stroke-[2.5] ${isCollapsed ? '' : 'mr-1.5 w-4 h-4'}`} />
          {!isCollapsed && <span>Novo Atendimento</span>}
        </button>

        {/* Links Principais */}
        <div className="space-y-1">
          {!isCollapsed && <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-2 mb-2">Operação</p>}
          {isCollapsed && <div className="h-px bg-[var(--card-border)] my-2" />}
          
          {onOpenTeamsCheck && (
            <button
              onClick={onOpenTeamsCheck}
              title={isCollapsed ? "Check de Equipes" : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2 text-sm font-semibold hover:bg-[var(--background)] hover:text-sky-500 rounded-lg transition-colors cursor-pointer`}
            >
              <Users className={`w-5 h-5 text-[var(--text-muted)] ${isCollapsed ? '' : 'mr-3 w-4 h-4'}`} />
              {!isCollapsed && <span>Check de Equipes</span>}
            </button>
          )}

          {onOpenTurmaReports && (
            <button
              onClick={onOpenTurmaReports}
              title={isCollapsed ? "Relatórios da Turma" : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2 text-sm font-semibold hover:bg-[var(--background)] hover:text-sky-500 rounded-lg transition-colors cursor-pointer`}
            >
              <BarChart3 className={`w-5 h-5 text-[var(--text-muted)] ${isCollapsed ? '' : 'mr-3 w-4 h-4'}`} />
              {!isCollapsed && <span>Relatórios da Turma</span>}
            </button>
          )}
        </div>

        {/* Configurações */}
        <div className="space-y-1 pt-4 border-t border-[var(--card-border)]">
          {!isCollapsed && <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-2 mb-2">Configurações</p>}
          
          <button
            onClick={() => onOpenSettings('profile')}
            title={isCollapsed ? "Minha Conta" : undefined}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2 text-sm font-semibold hover:bg-[var(--background)] hover:text-sky-500 rounded-lg transition-colors cursor-pointer`}
          >
            <Settings className={`w-5 h-5 text-[var(--text-muted)] ${isCollapsed ? '' : 'mr-3 w-4 h-4'}`} />
            {!isCollapsed && <span>Minha Conta</span>}
          </button>

          <button
            onClick={() => onOpenSettings('equipe')}
            title={isCollapsed ? "Perfil da Equipe" : undefined}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2 text-sm font-semibold hover:bg-[var(--background)] hover:text-sky-500 rounded-lg transition-colors cursor-pointer`}
          >
            <Users className={`w-5 h-5 text-[var(--text-muted)] ${isCollapsed ? '' : 'mr-3 w-4 h-4'}`} />
            {!isCollapsed && <span>Perfil da Equipe</span>}
          </button>

          <button
            onClick={() => onOpenSettings('categories')}
            title={isCollapsed ? "Categorias de Falha" : undefined}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2 text-sm font-semibold hover:bg-[var(--background)] hover:text-sky-500 rounded-lg transition-colors cursor-pointer`}
          >
            <Tags className={`w-5 h-5 text-[var(--text-muted)] ${isCollapsed ? '' : 'mr-3 w-4 h-4'}`} />
            {!isCollapsed && <span>Categorias de Falha</span>}
          </button>

          <button
            onClick={() => onOpenSettings('fleet')}
            title={isCollapsed ? "Frota e Ativos" : undefined}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2 text-sm font-semibold hover:bg-[var(--background)] hover:text-sky-500 rounded-lg transition-colors cursor-pointer`}
          >
            <Truck className={`w-5 h-5 text-[var(--text-muted)] ${isCollapsed ? '' : 'mr-3 w-4 h-4'}`} />
            {!isCollapsed && <span>Frota e Ativos</span>}
          </button>

          <button
            onClick={() => onOpenSettings('theme')}
            title={isCollapsed ? "Aparência" : undefined}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2 text-sm font-semibold hover:bg-[var(--background)] hover:text-sky-500 rounded-lg transition-colors cursor-pointer`}
          >
            <Sun className={`w-5 h-5 text-[var(--text-muted)] ${isCollapsed ? '' : 'mr-3 w-4 h-4'}`} />
            {!isCollapsed && <span>Aparência</span>}
          </button>
        </div>

      </div>
    </aside>
  );
};
