'use client';

import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  User, 
  Truck, 
  Clock, 
  Radio, 
  FileSpreadsheet, 
  Sun, 
  Moon, 
  Sparkles, 
  Lock, 
  UserCheck, 
  Activity, 
  RefreshCw,
  ShieldCheck,
  Check
} from 'lucide-react';
import { ShiftType } from '@/types';
import { ThemeMode, UserSession } from './HeaderNav';
import { userStore } from '@/lib/userStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession | null;
  activeShift: ShiftType | null;
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onOpenAssumeShift: () => void;
  onOpenCloseShift: () => void;
  onOpenEquipmentManager: () => void;
  onOpenTwoHourReport: () => void;
  onOpenGpsDiagnostic: () => void;
  onOpenHistoryTab: () => void;
  onRefreshData: () => void;
  onProfileUpdated: (updatedUser: any) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeShift,
  currentTheme,
  onThemeChange,
  onOpenAssumeShift,
  onOpenCloseShift,
  onOpenEquipmentManager,
  onOpenTwoHourReport,
  onOpenGpsDiagnostic,
  onOpenHistoryTab,
  onRefreshData,
  onProfileUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'fleet' | 'reports' | 'theme'>('profile');

  // Form states for profile editing
  const [nome, setNome] = useState(currentUser?.nome || '');
  const [horarioTurno, setHorarioTurno] = useState((currentUser as any)?.horarioTurno || '07:00 às 19:00');
  const [periodoTurno, setPeriodoTurno] = useState<'Dia' | 'Noite'>((currentUser as any)?.periodoTurno || 'Dia');
  const [savedMsg, setSavedMsg] = useState('');

  React.useEffect(() => {
    if (currentUser) {
      setNome(currentUser.nome || '');
      setHorarioTurno((currentUser as any)?.horarioTurno || '07:00 às 19:00');
      setPeriodoTurno((currentUser as any)?.periodoTurno || (currentUser.turma === 'D' ? 'Noite' : 'Dia'));
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;

    const updated = userStore.updateUser(currentUser.id, {
      nome: nome.trim(),
      horarioTurno: horarioTurno.trim(),
      periodoTurno,
    });

    const userSessionData = {
      ...currentUser,
      nome: nome.trim(),
      horarioTurno: horarioTurno.trim(),
      periodoTurno,
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('passaturno-current-user', JSON.stringify(userSessionData));
      } catch (err) {
        console.error('Erro ao atualizar usuário local:', err);
      }
    }

    onProfileUpdated(userSessionData);
    setSavedMsg('Perfil do turno salvo com sucesso!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleExportExcel = () => {
    window.open('/api/relatorio', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-6 animate-fadeIn flex flex-col max-h-[90vh]">
        
        {/* Header do Modal */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-xs">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-none">
                Central de Configurações
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Gerenciamento de perfil, turno, frota e relatórios
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas de Navegação das Configurações */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          {[
            { id: 'profile', label: 'Perfil do Turno', icon: User },
            { id: 'fleet',   label: 'Frota & Equipamentos', icon: Truck },
            { id: 'reports', label: 'Relatórios & Ferramentas', icon: Clock },
            { id: 'theme',   label: 'Aparência', icon: Sun },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === id
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Conteúdo da Aba Ativa */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* TAB 1: PERFIL DO TURNO */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Sessão Atual ({currentUser?.equipe || 'Operador'})</span>
                </div>
                <p className="text-xs text-slate-500">
                  Matrícula: <strong className="font-mono text-slate-700 dark:text-slate-300">{currentUser?.matricula}</strong> | Cargo: <strong className="text-slate-700 dark:text-slate-300">{currentUser?.cargo}</strong>
                </p>
              </div>

              {savedMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{savedMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome de Quem está no Turno (Operador):
                  </label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Período do Turno:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPeriodoTurno('Dia')}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                          periodoTurno === 'Dia'
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5" />
                        <span>Dia</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPeriodoTurno('Noite')}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                          periodoTurno === 'Noite'
                            ? 'bg-indigo-600 text-white border-indigo-500 font-black'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5" />
                        <span>Noite</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Horário da Escala:
                    </label>
                    <input
                      type="text"
                      value={horarioTurno}
                      onChange={(e) => setHorarioTurno(e.target.value)}
                      placeholder="Ex: 07:00 às 19:00"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 text-right">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Salvar Dados do Perfil
                  </button>
                </div>
              </form>

              {/* Botões de Gestão do Turno */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ações do Turno:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAssumeShift();
                    }}
                    className="flex items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-sky-600" />
                    <span>Assumir / Iniciar Turno</span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onOpenCloseShift();
                    }}
                    className="flex items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-400 transition-all cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-amber-500" />
                    <span>Passar e Fechar Turno</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FROTA & EQUIPAMENTOS */}
          {activeTab === 'fleet' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-sky-500/10 text-sky-600 rounded-xl">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white">Gerenciador de Frota e Equipamentos</h3>
                    <p className="text-[11px] text-slate-400">Cadastre novas máquinas, altere TAGs e acompanhe o status técnico.</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenEquipmentManager();
                  }}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  Abrir Gerenciador
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: RELATÓRIOS & FERRAMENTAS */}
          {activeTab === 'reports' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <button
                onClick={() => {
                  onClose();
                  onOpenGpsDiagnostic();
                }}
                className="p-4 bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-2xl text-left transition-all cursor-pointer space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-sky-600">Diagnóstico GPS & Frota</span>
                  <Radio className="w-4 h-4 text-sky-500" />
                </div>
                <p className="text-[11px] text-slate-400">Reporte de saúde de GPS, telemetria e despacho dos equipamentos.</p>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenHistoryTab();
                }}
                className="p-4 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-2xl text-left transition-all cursor-pointer space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-indigo-600">Histórico de Atendimentos</span>
                  <Activity className="w-4 h-4 text-indigo-500" />
                </div>
                <p className="text-[11px] text-slate-400">Consulta auditada de todas as ocorrências e manutenções registradas.</p>
              </button>

              <button
                onClick={() => {
                  handleExportExcel();
                }}
                className="p-4 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-2xl text-left transition-all cursor-pointer space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-emerald-600">Exportar Excel (.xlsx)</span>
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-[11px] text-slate-400">Baixa a planilha consolidada de atendimentos para análise.</p>
              </button>
            </div>
          )}

          {/* TAB 4: APARÊNCIA & TEMA */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Escolha o Tema Visual da Interface:</p>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'light', name: 'Claro (Padrão)', icon: Sun, color: 'text-amber-500' },
                  { id: 'dark',  name: 'Escuro CCO',     icon: Moon, color: 'text-indigo-400' },
                  { id: 'mina',  name: 'Mina Noturna',  icon: Sparkles, color: 'text-amber-400' },
                ].map(({ id, name, icon: Icon, color }) => (
                  <button
                    key={id}
                    onClick={() => onThemeChange(id as ThemeMode)}
                    className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
                      currentTheme === id
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${color}`} />
                    <span className="text-xs font-bold">{name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
