'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { IncidentType, EquipmentType, ShiftType, IncidentStatusType, PriorityLevel } from '@/types';
import { HeaderNav, UserSession } from '@/components/HeaderNav';
import { DashboardStats } from '@/components/DashboardStats';
import { DailySummarySection } from '@/components/DailySummarySection';
import { CriticalPriorities } from '@/components/CriticalPriorities';
import { KanbanBoard } from '@/components/KanbanBoard';
import { NewIncidentModal } from '@/components/NewIncidentModal';
import { IncidentTimelineModal } from '@/components/IncidentTimelineModal';
import { EquipmentHistoryModal } from '@/components/EquipmentHistoryModal';
import { AssumeShiftModal } from '@/components/AssumeShiftModal';
import { CloseShiftModal } from '@/components/CloseShiftModal';
import { WhatsappModal } from '@/components/WhatsappModal';
import { EquipmentManagerModal } from '@/components/EquipmentManagerModal';
import { CommentModal } from '@/components/CommentModal';
import { LoginModal } from '@/components/LoginModal';
import { OneNoteRoutineModal } from '@/components/OneNoteRoutineModal';
import { TwoHourReportModal } from '@/components/TwoHourReportModal';
import { GpsDiagnosticModal } from '@/components/GpsDiagnosticModal';
import { IncidentHistoryTabModal } from '@/components/IncidentHistoryTabModal';

export default function Home() {
  const [incidents, setIncidents] = useState<IncidentType[]>([]);
  const [equipments, setEquipments] = useState<EquipmentType[]>([]);
  const [activeShift, setActiveShift] = useState<ShiftType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState(false);
  const [isAssumeShiftOpen, setIsAssumeShiftOpen] = useState(false);
  const [isCloseShiftOpen, setIsCloseShiftOpen] = useState(false);
  const [isEquipmentManagerOpen, setIsEquipmentManagerOpen] = useState(false);
  const [isOneNoteRoutineOpen, setIsOneNoteRoutineOpen] = useState(false);
  const [isTwoHourReportOpen, setIsTwoHourReportOpen] = useState(false);
  const [isGpsDiagnosticOpen, setIsGpsDiagnosticOpen] = useState(false);
  const [isHistoryTabOpen, setIsHistoryTabOpen] = useState(false);

  const [selectedTimelineIncident, setSelectedTimelineIncident] = useState<IncidentType | null>(null);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  const [selectedWhatsappIncident, setSelectedWhatsappIncident] = useState<IncidentType | null>(null);
  const [isWhatsappOpen, setIsWhatsappOpen] = useState(false);

  const [selectedCommentIncident, setSelectedCommentIncident] = useState<IncidentType | null>(null);
  const [isCommentOpen, setIsCommentOpen] = useState(false);

  const [selectedEquipmentTag, setSelectedEquipmentTag] = useState<string>('');
  const [isEquipmentHistoryOpen, setIsEquipmentHistoryOpen] = useState(false);

  const [selectedEditIncident, setSelectedEditIncident] = useState<IncidentType | null>(null);
  const [isEditIncidentOpen, setIsEditIncidentOpen] = useState(false);
  const [editSolucao, setEditSolucao] = useState('');
  const [editStatus, setEditStatus] = useState<IncidentStatusType>('EM_ANDAMENTO');

  // Função auxiliar para atualizar o estado de atendimentos e persistir no localStorage
  const updateIncidentsState = (updater: (prev: IncidentType[]) => IncidentType[]) => {
    setIncidents((prev) => {
      const updated = updater(prev);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('passaturno-incidents-v2', JSON.stringify(updated));
        } catch (e) {
          console.error('Erro ao persistir no localStorage:', e);
        }
      }
      return updated;
    });
  };

  // Buscar todos os dados com fusão e persistência resiliente no localStorage
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    let localSaved: IncidentType[] = [];
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('passaturno-incidents-v2');
        if (saved) localSaved = JSON.parse(saved);
      } catch (e) {
        console.error('Erro ao ler atendimentos salvos:', e);
      }
    }

    try {
      const [incRes, eqRes, shiftRes] = await Promise.all([
        fetch('/api/atendimentos'),
        fetch('/api/equipamentos'),
        fetch('/api/turnos/ativo'),
      ]);

      if (incRes.ok) {
        const incData: IncidentType[] = await incRes.json();
        const mergedMap = new Map<string, IncidentType>();
        
        (incData || []).forEach((item) => mergedMap.set(item.id, item));
        localSaved.forEach((item) => {
          if (!mergedMap.has(item.id)) {
            mergedMap.set(item.id, item);
          } else {
            const serverItem = mergedMap.get(item.id)!;
            const localTime = new Date(item.atualizadoEm || item.criadoEm).getTime();
            const serverTime = new Date(serverItem.atualizadoEm || serverItem.criadoEm).getTime();
            if (localTime > serverTime) {
              mergedMap.set(item.id, item);
            }
          }
        });

        const mergedArray = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
        );

        setIncidents(mergedArray);
        if (typeof window !== 'undefined') {
          localStorage.setItem('passaturno-incidents-v2', JSON.stringify(mergedArray));
        }
      } else if (localSaved.length > 0) {
        setIncidents(localSaved);
      }

      if (eqRes.ok) {
        const eqData = await eqRes.json();
        setEquipments(eqData);
      }

      if (shiftRes.ok) {
        const shiftData = await shiftRes.json();
        setActiveShift(shiftData.activeShift || null);
      }
    } catch (err) {
      console.error('Error loading CCO data:', err);
      if (localSaved.length > 0) setIncidents(localSaved);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Alterar status diretamente no Kanban
  const handleStatusChange = async (id: string, newStatus: IncidentStatusType) => {
    updateIncidentsState((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus, atualizadoEm: new Date().toISOString() } : item))
    );

    try {
      const res = await fetch(`/api/atendimentos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        updateIncidentsState((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Alterar prioridade diretamente no Kanban
  const handlePriorityChange = async (id: string, newPriority: PriorityLevel) => {
    updateIncidentsState((prev) =>
      prev.map((item) => (item.id === id ? { ...item, prioridade: newPriority, atualizadoEm: new Date().toISOString() } : item))
    );

    try {
      const res = await fetch(`/api/atendimentos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prioridade: newPriority }),
      });

      if (res.ok) {
        const updated = await res.json();
        updateIncidentsState((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Aceitar notificação de prioridade da passagem de turno e mover para a fila Em Andamento
  const handleAcceptPriority = async (incident: IncidentType) => {
    const targetPriority =
      incident.prioridade === 'CRITICA' || incident.prioridade === 'ALTA'
        ? incident.prioridade
        : 'ALTA';

    updateIncidentsState((prev) =>
      prev.map((item) =>
        item.id === incident.id
          ? {
              ...item,
              status: 'EM_ANDAMENTO',
              prioridade: targetPriority,
              isPendenciaHerdada: false,
              atualizadoEm: new Date().toISOString(),
            }
          : item
      )
    );

    try {
      const res = await fetch(`/api/atendimentos/${incident.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'EM_ANDAMENTO',
          prioridade: targetPriority,
          logDescription: `Notificação de prioridade da passagem de turno aceita. Atendimento movido para a fila de Em Andamento com status de Prioridade ${targetPriority}.`,
          logUsuario: activeShift?.responsavelNome || 'John Tavares',
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        updateIncidentsState((prev) =>
          prev.map((item) => (item.id === incident.id ? updated : item))
        );
      }
    } catch (err) {
      console.error('Erro ao aceitar atendimento:', err);
    }
  };

  // Editar Atendimento / Adicionar Solução
  const handleSaveEditIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditIncident) return;

    const incidentId = selectedEditIncident.id;
    const targetStatus = editStatus;
    const targetSolucao = editSolucao;

    // 1. Fechar o modal IMEDIATAMENTE (resposta instantânea na UI sem travar o operador)
    setIsEditIncidentOpen(false);
    setSelectedEditIncident(null);

    // 2. Atualizar estado local + localStorage (garante a integridade e persistência de 100% dos dados!)
    updateIncidentsState((prev) =>
      prev.map((item) =>
        item.id === incidentId
          ? { ...item, status: targetStatus, solucao: targetSolucao, atualizadoEm: new Date().toISOString() }
          : item
      )
    );

    // 3. Persistir no servidor em segundo plano
    try {
      await fetch(`/api/atendimentos/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          solucao: targetSolucao,
        }),
      });
    } catch (err) {
      console.error('Erro ao salvar alteração de atendimento:', err);
    }
  };

  // Excluir Atendimento permanentemente
  const handleDeleteIncident = async (id: string) => {
    updateIncidentsState((prev) => prev.filter((item) => item.id !== id));
    try {
      await fetch(`/api/atendimentos/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Erro ao excluir atendimento:', err);
    }
  };

  // Contagem de itens de prioridade da passagem de turno pendentes de aceite (apenas pendências herdadas / próximo turno)
  const unacceptedCount = incidents.filter((i) => {
    const isShiftHandoffPending = i.isPendenciaHerdada || i.status === 'PENDENCIA_PROXIMO_TURNO';
    const isNotYetAccepted = i.status !== 'FINALIZADO' && i.status !== 'RETROAGIDO' && i.status !== 'EM_ANDAMENTO';

    return isShiftHandoffPending && isNotYetAccepted;
  }).length;

  const handleRestoreNotifications = () => {
    try {
      localStorage.removeItem('dismissed_shift_notifications');
      window.dispatchEvent(new Event('storage'));
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  type ThemeMode = 'light' | 'dark' | 'mina';
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  const applyTheme = (newTheme: ThemeMode) => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.remove('dark', 'theme-mina');
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'mina') {
      document.documentElement.classList.add('theme-mina');
    }
  };

  // Carregar usuário salvo no localStorage
  useEffect(() => {
    const savedUserStr = localStorage.getItem('passaturno-user');
    if (savedUserStr) {
      try {
        const u = JSON.parse(savedUserStr) as UserSession;
        setCurrentUser(u);
        const userKey = `passaturno-theme-${u.id}`;
        const userTheme = (localStorage.getItem(userKey) as ThemeMode) || 'light';
        setTheme(userTheme);
        applyTheme(userTheme);
      } catch (e) {
        console.error('Erro ao carregar sessão do usuário:', e);
      }
    } else {
      const guestTheme = (localStorage.getItem('passaturno-theme-guest') as ThemeMode) || 'light';
      setTheme(guestTheme);
      applyTheme(guestTheme);
    }
  }, []);

  // Ao trocar de operador ou realizar login, carregar as preferências individuais daquele operador
  const handleLoginSuccess = (user: UserSession) => {
    setCurrentUser(user);
    localStorage.setItem('passaturno-user', JSON.stringify(user));
    const userKey = `passaturno-theme-${user.id}`;
    const userSavedTheme = (localStorage.getItem(userKey) as ThemeMode) || 'light';
    setTheme(userSavedTheme);
    applyTheme(userSavedTheme);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('passaturno-user');
    const guestTheme = (localStorage.getItem('passaturno-theme-guest') as ThemeMode) || 'light';
    setTheme(guestTheme);
    applyTheme(guestTheme);
  };

  // Salvar a alteração de tema estritamente no perfil do usuário logado
  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    const userKey = currentUser ? `passaturno-theme-${currentUser.id}` : 'passaturno-theme-guest';
    localStorage.setItem(userKey, newTheme);
    applyTheme(newTheme);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col selection:bg-sky-500 selection:text-white transition-colors duration-300">
      
      {/* Modal de Login (bloqueia o sistema caso o operador não esteja autenticado) */}
      {!currentUser && (
        <LoginModal onLoginSuccess={handleLoginSuccess} />
      )}

      {/* Top Navbar */}
      <HeaderNav
        activeShift={activeShift}
        onOpenNewIncident={() => setIsNewIncidentOpen(true)}
        onOpenAssumeShift={() => setIsAssumeShiftOpen(true)}
        onOpenCloseShift={() => setIsCloseShiftOpen(true)}
        onOpenEquipmentManager={() => setIsEquipmentManagerOpen(true)}
        onOpenOneNoteRoutine={() => setIsOneNoteRoutineOpen(true)}
        onOpenTwoHourReport={() => setIsTwoHourReportOpen(true)}
        onOpenGpsDiagnostic={() => setIsGpsDiagnosticOpen(true)}
        onOpenHistoryTab={() => setIsHistoryTabOpen(true)}
        onRefreshData={loadData}
        isRefreshing={isRefreshing}
        unacceptedCount={unacceptedCount}
        onRestoreNotifications={handleRestoreNotifications}
        currentTheme={theme}
        onThemeChange={handleThemeChange}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-semibold text-slate-500 tracking-wider">CARREGANDO AUTOMATION CONTROL...</p>
          </div>
        ) : (
          <>
            {/* 1. Dashboard Stats */}
            <DashboardStats incidents={incidents} />

            {/* 2. Prioridades Críticas / Notificação da Passagem de Turno */}
            <CriticalPriorities
              incidents={incidents}
              onOpenWhatsapp={(inc) => {
                setSelectedWhatsappIncident(inc);
                setIsWhatsappOpen(true);
              }}
              onOpenTimeline={(inc) => {
                setSelectedTimelineIncident(inc);
                setIsTimelineOpen(true);
              }}
              onAcceptPriority={handleAcceptPriority}
            />

            {/* 3. Quadro Kanban Estilo Trello */}
            <KanbanBoard
              incidents={incidents}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onOpenWhatsapp={(inc) => {
                setSelectedWhatsappIncident(inc);
                setIsWhatsappOpen(true);
              }}
              onOpenTimeline={(inc) => {
                setSelectedTimelineIncident(inc);
                setIsTimelineOpen(true);
              }}
              onOpenEquipmentHistory={(tag) => {
                setSelectedEquipmentTag(tag);
                setIsEquipmentHistoryOpen(true);
              }}
              onOpenEditIncident={(inc) => {
                setSelectedEditIncident(inc);
                setEditSolucao(inc.solucao || '');
                setEditStatus(inc.status);
                setIsEditIncidentOpen(true);
              }}
              onOpenCommentModal={(inc) => {
                setSelectedCommentIncident(inc);
                setIsCommentOpen(true);
              }}
              onDeleteIncident={handleDeleteIncident}
            />

            {/* 4. Resumo dos Atendimentos Diários & Passagem de Turno (Posicionado na parte inferior) */}
            <DailySummarySection incidents={incidents} activeShift={activeShift} />
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400 font-medium">
        <p>Automation Control • Gestão de Ocorrências e Continuidade Operacional</p>
      </footer>

      {/* Modals */}
      <NewIncidentModal
        isOpen={isNewIncidentOpen}
        onClose={() => setIsNewIncidentOpen(false)}
        equipments={equipments}
        onIncidentCreated={loadData}
      />

      <IncidentTimelineModal
        incident={selectedTimelineIncident}
        isOpen={isTimelineOpen}
        onClose={() => {
          setIsTimelineOpen(false);
          setSelectedTimelineIncident(null);
        }}
        onTimelineUpdated={loadData}
      />

      <EquipmentHistoryModal
        initialTag={selectedEquipmentTag}
        isOpen={isEquipmentHistoryOpen}
        onClose={() => {
          setIsEquipmentHistoryOpen(false);
          setSelectedEquipmentTag('');
        }}
        equipments={equipments}
      />

      <AssumeShiftModal
        isOpen={isAssumeShiftOpen}
        onClose={() => setIsAssumeShiftOpen(false)}
        onShiftAssumed={loadData}
      />

      <CloseShiftModal
        isOpen={isCloseShiftOpen}
        onClose={() => setIsCloseShiftOpen(false)}
        activeShift={activeShift}
        incidents={incidents}
        onShiftClosed={loadData}
      />

      <WhatsappModal
        incident={selectedWhatsappIncident}
        isOpen={isWhatsappOpen}
        onClose={() => {
          setIsWhatsappOpen(false);
          setSelectedWhatsappIncident(null);
        }}
      />

      <EquipmentManagerModal
        isOpen={isEquipmentManagerOpen}
        onClose={() => setIsEquipmentManagerOpen(false)}
        equipments={equipments}
        onEquipmentCreated={loadData}
      />

      <CommentModal
        incident={selectedCommentIncident}
        isOpen={isCommentOpen}
        onClose={() => {
          setIsCommentOpen(false);
          setSelectedCommentIncident(null);
        }}
        onCommentSaved={loadData}
        currentUserName={activeShift?.responsavelNome || 'Técnico Automação'}
      />

      {/* Quick Edit Incident Modal */}
      {isEditIncidentOpen && selectedEditIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              Editar Atendimento [{selectedEditIncident.tag}]
            </h3>
            <p className="text-xs text-slate-500 mb-4">{selectedEditIncident.equipamentoNome}</p>

            <form onSubmit={handleSaveEditIncident} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as IncidentStatusType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                >
                  <option value="EM_ANDAMENTO">🔴 Em Andamento</option>
                  <option value="AGUARDANDO">🟡 Aguardando</option>
                  <option value="FINALIZADO">🟢 Concluído</option>
                  <option value="RETROAGIDO">🟣 Retroagido (Não era Automação)</option>
                  <option value="PENDENCIA_PROXIMO_TURNO">🔵 Pendência Herdada</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Solução Aplicada / Observação</label>
                <textarea
                  rows={3}
                  placeholder="Descreva a solução técnica aplicada..."
                  value={editSolucao}
                  onChange={(e) => setEditSolucao(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditIncidentOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rotina FMDS e OneNote */}
      <OneNoteRoutineModal
        isOpen={isOneNoteRoutineOpen}
        onClose={() => setIsOneNoteRoutineOpen(false)}
        activeShift={activeShift}
        onShiftUpdated={loadData}
      />

      {/* Modal Envio de Boletim de 2 Horas */}
      <TwoHourReportModal
        isOpen={isTwoHourReportOpen}
        onClose={() => setIsTwoHourReportOpen(false)}
        incidents={incidents}
        activeShift={activeShift}
      />

      {/* Modal Reporte de Diagnóstico de GPS */}
      <GpsDiagnosticModal
        isOpen={isGpsDiagnosticOpen}
        onClose={() => setIsGpsDiagnosticOpen(false)}
        activeShift={activeShift}
      />

      {/* Modal / Aba de Histórico Geral de Atendimentos */}
      <IncidentHistoryTabModal
        isOpen={isHistoryTabOpen}
        onClose={() => setIsHistoryTabOpen(false)}
        incidents={incidents}
        onOpenTimeline={(inc) => {
          setSelectedTimelineIncident(inc);
          setIsTimelineOpen(true);
        }}
        onDeleteIncident={handleDeleteIncident}
      />

    </div>
  );
}
