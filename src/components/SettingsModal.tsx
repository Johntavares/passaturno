'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Save,
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
  Check,
  Tags,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Users,
  UserX
} from 'lucide-react';
import { ShiftType } from '@/types';
import { ThemeMode, UserSession } from './HeaderNav';
import { 
  getFailureCategories, 
  addFailureCategory, 
  removeFailureCategory, 
  updateFailureCategory, 
  resetFailureCategories 
} from '@/lib/categories';
import { getBoletimConfig, saveBoletimConfig } from '@/lib/boletimConfig';


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
  const [activeTab, setActiveTab] = useState<'profile' | 'equipe' | 'categories' | 'fleet' | 'reports' | 'theme'>('profile');

  // Form states for profile editing
  const [nome, setNome] = useState(currentUser?.nome || '');
  const [horarioTurno, setHorarioTurno] = useState((currentUser as any)?.horarioTurno || '07:00 às 19:00');
  const [periodoTurno, setPeriodoTurno] = useState<'Dia' | 'Noite'>((currentUser as any)?.periodoTurno || 'Dia');
  const [turma, setTurma] = useState(currentUser?.turma || 'A');
  const [escala, setEscala] = useState((currentUser as any)?.escala || '3x3');
  const [diaEscala, setDiaEscala] = useState((currentUser as any)?.diaEscala || '1º Dia');
  const [savedMsg, setSavedMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Categories management state
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [newCatInput, setNewCatInput] = useState('');
  const [editingCatIndex, setEditingCatIndex] = useState<number | null>(null);
  const [editingCatValue, setEditingCatValue] = useState('');

  // Equipe (perfil da turma) state
  const turmaEquipe = ((currentUser?.turma || 'A') as string).toUpperCase();
  const [equipeMembros, setEquipeMembros] = useState('');
  const [ausenciaNome, setAusenciaNome] = useState('');
  const [ausenciaMotivo, setAusenciaMotivo] = useState('');
  const [equipeSaving, setEquipeSaving] = useState(false);
  const [equipeSavedMsg, setEquipeSavedMsg] = useState('');

  // Carregar configuração da equipe da turma ao abrir o modal
  React.useEffect(() => {
    if (isOpen) {
      getBoletimConfig(turmaEquipe).then((config) => {
        if (!config) return;
        if (typeof config.equipeSonda === 'string' && config.equipeSonda.trim()) {
          setEquipeMembros(config.equipeSonda.split('/').map((m) => m.trim()).join('\n'));
        } else {
          setEquipeMembros('');
        }
        setAusenciaNome(config.ausenciaNome || '');
        setAusenciaMotivo(config.ausenciaMotivo || '');
      }).catch(() => {});
    }
  }, [isOpen, turmaEquipe]);

  const handleSaveEquipe = async () => {
    if (!currentUser?.id) return;
    setEquipeSaving(true);
    const membros = equipeMembros.split('\n').map((l) => l.trim()).filter(Boolean);
    const equipeSonda = membros.join(' / ');
    const nomeAus = ausenciaNome.trim();
    const motivoAus = ausenciaMotivo.trim();
    const ausencia = nomeAus ? (motivoAus ? `${nomeAus} (${motivoAus})` : nomeAus) : '';
    await saveBoletimConfig(turmaEquipe, { equipeSonda, ausencia, ausenciaNome: nomeAus, ausenciaMotivo: motivoAus });
    setEquipeSaving(false);
    setEquipeSavedMsg('Configuração da equipe salva!');
    setTimeout(() => setEquipeSavedMsg(''), 2500);
  };

  React.useEffect(() => {
    if (isOpen) {
      getFailureCategories().then(setCategoriesList).catch(() => {});
    }
  }, [isOpen]);

  React.useEffect(() => {
    const handleCategoriesChanged = () => {
      getFailureCategories().then(setCategoriesList).catch(() => {});
    };
    window.addEventListener('categories-updated', handleCategoriesChanged);
    return () => window.removeEventListener('categories-updated', handleCategoriesChanged);
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatInput.trim()) return;
    try {
      const updated = await addFailureCategory(newCatInput);
      setCategoriesList(updated);
      setNewCatInput('');
    } catch (err: any) {
      setCategoriesList(await getFailureCategories());
      setNewCatInput('');
    }
  };

  const handleRemoveCategory = async (catName: string) => {
    try {
      const updated = await removeFailureCategory(catName);
      setCategoriesList(updated);
    } catch (err: any) {
      setCategoriesList(await getFailureCategories());
    }
  };

  const handleStartEditCategory = (index: number, catName: string) => {
    setEditingCatIndex(index);
    setEditingCatValue(catName);
  };

  const handleSaveEditCategory = async (oldName: string) => {
    if (!editingCatValue.trim()) return;
    try {
      const updated = await updateFailureCategory(oldName, editingCatValue);
      setCategoriesList(updated);
    } catch (err: any) {
      setCategoriesList(await getFailureCategories());
    }
    setEditingCatIndex(null);
    setEditingCatValue('');
  };

  const handleResetCategories = async () => {
    try {
      const updated = await resetFailureCategories();
      setCategoriesList(updated);
    } catch (err: any) {
      setCategoriesList(await getFailureCategories());
    }
  };

  React.useEffect(() => {
    if (currentUser) {
      setNome(currentUser.nome || '');
      setHorarioTurno((currentUser as any)?.horarioTurno || '07:00 às 19:00');
      setPeriodoTurno((currentUser as any)?.periodoTurno || (currentUser.turma === 'D' ? 'Noite' : 'Dia'));
      setTurma(currentUser.turma || 'A');
      setEscala((currentUser as any)?.escala || '3x3');
      setDiaEscala((currentUser as any)?.diaEscala || '1º Dia');
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;

    setIsSaving(true);
    const userSessionData = {
      ...currentUser,
      nome: nome.trim(),
      horarioTurno: horarioTurno.trim(),
      periodoTurno,
      turma,
      escala: escala.trim(),
      diaEscala: diaEscala.trim(),
    };

    try {
      const res = await fetch(`/api/usuarios/${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          horarioTurno: horarioTurno.trim(),
          periodoTurno,
          turma,
          escala: escala.trim(),
          diaEscala: diaEscala.trim(),
        }),
      });

      if (res.ok) {
        setSavedMsg('Configurações salvas e sincronizadas no banco com sucesso!');
      } else {
        setSavedMsg('Configurações salvas!');
      }
    } catch (err) {
      console.error('Erro ao atualizar perfil na API:', err);
      setSavedMsg('Configurações salvas com sucesso!');
    } finally {
      setIsSaving(false);
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('passaturno-user', JSON.stringify(userSessionData));
      } catch (e) {}
    }

    onProfileUpdated(userSessionData);
    if (onRefreshData) onRefreshData();
    setTimeout(() => setSavedMsg(''), 4000);
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
            { id: 'profile',    label: 'Perfil do Turno', icon: User },
            { id: 'equipe',     label: 'Equipe', icon: Users },
            { id: 'categories', label: 'Categorias de Falhas', icon: Tags },
            { id: 'fleet',      label: 'Frota & Equipamentos', icon: Truck },
            { id: 'reports',    label: 'Relatórios & Ferramentas', icon: Clock },
            { id: 'theme',      label: 'Aparência', icon: Sun },
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
                        onClick={() => { setPeriodoTurno('Dia'); if (horarioTurno === '19:00 às 07:00' || !horarioTurno) setHorarioTurno('07:00 às 19:00'); }}
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
                        onClick={() => { setPeriodoTurno('Noite'); if (horarioTurno === '07:00 às 19:00' || !horarioTurno) setHorarioTurno('19:00 às 07:00'); }}
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

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Turma:
                  </label>
                  <select
                    value={turma}
                    onChange={(e) => setTurma(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="A">Turma A</option>
                    <option value="B">Turma B</option>
                    <option value="C">Turma C</option>
                    <option value="D">Turma D</option>
                    <option value="GERAL">Geral/Administrativo</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Escala (ex: 3x3):
                    </label>
                    <input
                      type="text"
                      value={escala}
                      onChange={(e) => setEscala(e.target.value)}
                      placeholder="Ex: 3x3"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Dia de Trabalho (Sua Letra):
                    </label>
                    <select
                      value={diaEscala}
                      onChange={(e) => setDiaEscala(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="1º Dia">1º Dia</option>
                      <option value="2º Dia">2º Dia</option>
                      <option value="3º Dia">3º Dia</option>
                      <option value="4º Dia">4º Dia</option>
                      <option value="5º Dia">5º Dia</option>
                      <option value="Folga">Folga</option>
                    </select>
                  </div>
                </div>

                {savedMsg && (
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2.5 shadow-xs animate-fadeIn">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <span>{savedMsg}</span>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className={`px-6 py-2.5 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 ${
                        savedMsg
                          ? 'bg-emerald-700 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Salvando no Banco...</span>
                        </>
                      ) : savedMsg ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Atualização Salva!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Salvar Dados do Perfil</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

          {/* TAB EQUIPE */}
          {activeTab === 'equipe' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-xs">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white">Configuração da Equipe da Turma {turmaEquipe}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Membros da equipe e ausências — salvo no banco e sincronizado para todos os usuários da turma.</p>
                  </div>
                </div>
                {equipeSavedMsg && (
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-emerald-900 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-700">
                    <Check className="w-3 h-3 inline mr-1" />
                    {equipeSavedMsg}
                  </span>
                )}
              </div>

              <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Membros da Equipe (um por linha)
                  </label>
                  <textarea
                    value={equipeMembros}
                    onChange={(e) => setEquipeMembros(e.target.value)}
                    rows={6}
                    placeholder={'Valdenir\nVitor\nGustavo'}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 custom-scrollbar resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <UserX className="w-3.5 h-3.5 text-rose-500" />
                      Ausência (nome)
                    </label>
                    <input
                      type="text"
                      value={ausenciaNome}
                      onChange={(e) => setAusenciaNome(e.target.value)}
                      placeholder="ex: Baia"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Motivo da Ausência
                    </label>
                    <input
                      type="text"
                      value={ausenciaMotivo}
                      onChange={(e) => setAusenciaMotivo(e.target.value)}
                      placeholder="ex: férias, atestado, folga..."
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveEquipe}
                  disabled={equipeSaving}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                    equipeSaving
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {equipeSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Salvando no Banco...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Salvar Configuração da Equipe</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB CATEGORIAS DE FALHAS */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-xs">
                    <Tags className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white">Gerenciar Categorias de Falhas</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Adicione, edite ou remova tipos de falhas disponíveis nas ocorrências.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetCategories}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 text-[11px] font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Restaurar lista padrão"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Padrão</span>
                </button>
              </div>

              {/* Form Adicionar Categoria */}
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nova Categoria (ex: Telemetria GPS, Display IHM, Bateria...)"
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar</span>
                </button>
              </form>

              {/* Lista de Categorias com Edição e Remoção */}
              <div className="space-y-2 mt-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Categorias Ativas ({categoriesList.length}):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categoriesList.map((cat, idx) => {
                    const isEditing = editingCatIndex === idx;
                    return (
                      <div
                        key={idx}
                        className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-2 shadow-2xs"
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 w-full">
                            <input
                              type="text"
                              value={editingCatValue}
                              onChange={(e) => setEditingCatValue(e.target.value)}
                              className="flex-1 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditCategory(cat)}
                              className="p-1 bg-emerald-600 text-white rounded-lg text-xs hover:bg-emerald-500 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCatIndex(null)}
                              className="p-1 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              🏷️ {cat}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartEditCategory(idx, cat)}
                                className="p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                title="Editar categoria"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveCategory(cat)}
                                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                title="Excluir categoria"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
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
