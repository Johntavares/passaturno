'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { IncidentType, EquipmentType, ShiftType, IncidentStatusType, PriorityLevel, IncidentHistoryType } from '@/types';
import { HeaderNav, UserSession, ThemeMode } from '@/components/HeaderNav';
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
import { DesktopAdBanner } from '@/components/DesktopAdBanner';
import { LiderTurmaModal } from '@/components/LiderTurmaModal';
import { LiderDashboardView } from '@/components/LiderDashboardView';
import { LeaderMessageNotification } from '@/components/LeaderMessageNotification';
import { EditTurmaProfileModal } from '@/components/EditTurmaProfileModal';
import { SettingsModal } from '@/components/SettingsModal';
import { TeamsCheckModal } from '@/components/TeamsCheckModal';
import { normalizeTurma, getNextTurma, isSameDayAsToday, isIncidentFromToday } from '@/lib/turma';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
  const [incidents, setIncidents] = useState<IncidentType[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cacheKey = 'passaturno-cache-incidents-GLOBAL';
        const saved = localStorage.getItem(cacheKey);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });
  const [equipments, setEquipments] = useState<EquipmentType[]>([]);
  const [activeShift, setActiveShift] = useState<ShiftType | null>(null);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [loggedInUsers, setLoggedInUsers] = useState<UserSession[]>([]);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'mina'>('light');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState(false);
  const [isAssumeShiftOpen, setIsAssumeShiftOpen] = useState(false);
  const [isCloseShiftOpen, setIsCloseShiftOpen] = useState(false);
  const [isEquipmentManagerOpen, setIsEquipmentManagerOpen] = useState(false);
  const [isOneNoteRoutineOpen, setIsOneNoteRoutineOpen] = useState(false);
  const [isTwoHourReportOpen, setIsTwoHourReportOpen] = useState(false);
  const [isTeamsCheckOpen, setIsTeamsCheckOpen] = useState(false);
  const [isGpsDiagnosticOpen, setIsGpsDiagnosticOpen] = useState(false);
  const [isHistoryTabOpen, setIsHistoryTabOpen] = useState(false);
  const [isLiderTurmaOpen, setIsLiderTurmaOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedTurmaFilter, setSelectedTurmaFilter] = useState<string>('TODAS');

  // Refs para evitar recriação do loadData a cada mudança de estado (previne loop infinito)
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;
  const selectedTurmaFilterRef = useRef(selectedTurmaFilter);
  selectedTurmaFilterRef.current = selectedTurmaFilter;

  // Guarda atualizações otimistas em voo para o polling NÃO sobrescrevê-las
  // com dados antigos do servidor enquanto o PATCH ainda não confirmou.
  const pendingOverridesRef = useRef<Map<string, { patch: Record<string, unknown>; ts: number }>>(new Map());

  const markPending = useCallback((id: string, patch: Record<string, unknown>) => {
    pendingOverridesRef.current.set(id, { patch, ts: Date.now() });
  }, []);

  const confirmPending = useCallback((id: string) => {
    pendingOverridesRef.current.delete(id);
  }, []);

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

  const saveLocalCache = (incData: IncidentType[], turmaKey?: string) => {
    if (typeof window === 'undefined') return;
    try {
      const cacheKey = `passaturno-cache-incidents-${turmaKey || 'GLOBAL'}`;
      localStorage.setItem(cacheKey, JSON.stringify(incData));
    } catch (e) {
      console.error('Erro ao salvar cache local:', e);
    }
  };

  const loadLocalCache = (turmaKey?: string): IncidentType[] => {
    if (typeof window === 'undefined') return [];
    try {
      const cacheKey = `passaturno-cache-incidents-${turmaKey || 'GLOBAL'}`;
      const saved = localStorage.getItem(cacheKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Erro ao ler cache local:', e);
    }
    return [];
  };

  const getDeletedIds = (): Set<string> => {
    const ids = new Set<string>();
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('passaturno-deleted-incidents-v3');
        if (saved) (JSON.parse(saved) as string[]).forEach((d) => ids.add(d.toUpperCase().trim()));
      } catch (e) {
        console.error('Erro ao ler excluídos:', e);
      }
    }
    return ids;
  };

  const getCurrentTurmaKey = () => {
    const t = (currentUser?.turma || activeShift?.turma || '').toUpperCase().trim();
    return t && t !== 'GERAL' ? t : 'TODAS';
  };

  const updateIncidentsState = (updater: (prev: IncidentType[]) => IncidentType[]) => {
    setIncidents((prev) => {
      const updated = updater(prev);
      saveLocalCache(updated, 'GLOBAL');
      return updated;
    });
  };

  const loadData = useCallback(async (turmaOverride?: string) => {
    setIsRefreshing(true);
    const deletedIds = getDeletedIds();

    const savedUserStr = typeof window !== 'undefined' ? localStorage.getItem('passaturno-user') : null;
    let savedUserTurma = '';
    if (savedUserStr) {
      try {
        const u = JSON.parse(savedUserStr);
        savedUserTurma = u.turma || '';
      } catch (e) {}
    }

    const userTurmaClean = normalizeTurma(turmaOverride) || normalizeTurma(currentUserRef.current?.turma) || normalizeTurma(savedUserTurma) || normalizeTurma(selectedTurmaFilterRef.current);
    const isLeaderUser = currentUserRef.current?.cargo === 'LÍDER DE TURMA';
    const shiftApiUrl = (userTurmaClean && !isLeaderUser) ? `/api/turnos/ativo?turma=${encodeURIComponent(userTurmaClean)}` : '/api/turnos/ativo';

    try {
      const [incRes, eqRes, shiftRes] = await Promise.all([
        fetch('/api/atendimentos'),
        fetch('/api/equipamentos'),
        fetch(shiftApiUrl),
      ]);

      if (incRes.ok) {
        const rawInc = (await incRes.json()) as IncidentType[];
        // O banco (Supabase) é a fonte de verdade: exibe exatamente o que ele retornou,
        // removendo apenas IDs excluídos localmente. Nada é preservado/reinserido da cache local.
        let serverIncData = rawInc.filter(
          (item) => !deletedIds.has(item.id.toUpperCase().trim())
        );

        // Reaplica mudanças otimistas ainda pendentes (PATCH em voo) por cima dos dados do servidor,
        // evitando que uma resposta de polling defasada "desfaça" um clique recente (ex.: No Código).
        const pending = pendingOverridesRef.current;
        if (pending.size > 0) {
          const nowTs = Date.now();
          serverIncData = serverIncData.map((item) => {
            const p = pending.get(item.id);
            if (p && nowTs - p.ts < 8000) {
              return { ...item, ...p.patch, atualizadoEm: item.atualizadoEm };
            }
            return item;
          });
        }

        setIncidents(serverIncData);
        saveLocalCache(serverIncData, 'GLOBAL');
      } else {
        const cached = loadLocalCache('GLOBAL');
        if (cached.length > 0) {
          const validCached = cached.filter(
            (item) => !deletedIds.has(item.id.toUpperCase().trim())
          );
          setIncidents(validCached);
        }
      }

      if (eqRes.ok) {
        setEquipments(await eqRes.json());
      }

      if (shiftRes.ok) {
        const shiftData = await shiftRes.json();
        const activeS = shiftData.activeShift || null;
        if (activeS) {
          setActiveShift(activeS);
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(`passaturno-active-shift-${normalizeTurma(activeS.turma) || 'A'}`, JSON.stringify(activeS));
              localStorage.setItem('passaturno-active-shift-current', JSON.stringify(activeS));
            } catch (e) {}
          }
        } else {
          // O banco de dados confirmou que não há turno ativo para esta turma.
          // Limpar o estado do React e remover a cache antiga do localStorage para liberar o início de um novo turno.
          setActiveShift(null);
          if (typeof window !== 'undefined') {
            try {
              localStorage.removeItem(`passaturno-active-shift-${userTurmaClean || 'A'}`);
              localStorage.removeItem('passaturno-active-shift-current');
              localStorage.removeItem('passaturno-active-shift-v2');
              localStorage.removeItem('passaturno-active-shift');
            } catch (e) {}
          }
        }
      } else {
        let cachedShift: ShiftType | null = null;
        if (typeof window !== 'undefined') {
          try {
            const saved = localStorage.getItem(`passaturno-active-shift-${userTurmaClean || 'A'}`) || localStorage.getItem('passaturno-active-shift-current');
            if (saved) cachedShift = JSON.parse(saved);
          } catch (e) {}
        }
        if (cachedShift && cachedShift.status === 'ATIVO') {
          setActiveShift(cachedShift);
        } else {
          setActiveShift(null);
        }
      }
    } catch (err) {
      console.error('Error loading CCO data:', err);
      const cached = loadLocalCache('GLOBAL');
      if (cached.length > 0) setIncidents(cached);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-polling em tempo real (4s) para manter os dados 100% atualizados entre Operador e Líder
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 4000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Inscrição em Tempo Real (Supabase Realtime WebSockets: < 50ms sync entre Líder e Operadores)
  useEffect(() => {
    try {
      const channel = supabase
        .channel('passaturno-realtime-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'Incident' },
          (payload) => {
            console.log('⚡ Realtime update on Incident:', payload);
            loadData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'Shift' },
          (payload) => {
            console.log('⚡ Realtime update on Shift:', payload);
            loadData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.error('Realtime subscription error:', e);
    }
  }, [loadData]);

  const handleIncidentCreated = (newInc?: IncidentType) => {
    if (newInc) {
      updateIncidentsState((prev) => {
        const filtered = prev.filter((i) => i.id !== newInc.id);
        return [newInc, ...filtered];
      });
    }
    loadData();
  };

  // Limpeza de registros legados e inclusão preventiva de TAGs excluídas
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('passaturno-deleted-incidents-v2');
        const saved = JSON.parse(localStorage.getItem('passaturno-deleted-incidents-v3') || '[]');
        if (!saved.includes('TT92')) {
          localStorage.setItem('passaturno-deleted-incidents-v3', JSON.stringify([...saved, 'TT92']));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Excluir Atendimento permanentemente
  const handleDeleteIncident = async (id: string) => {
    if (typeof window !== 'undefined') {
      try {
        const savedDeleted = JSON.parse(localStorage.getItem('passaturno-deleted-incidents-v3') || '[]');
        const updatedDeleted = Array.from(new Set([...savedDeleted, String(id).toUpperCase().trim()]));
        localStorage.setItem('passaturno-deleted-incidents-v3', JSON.stringify(updatedDeleted));
      } catch (e) {
        console.error('Erro ao guardar ID excluido:', e);
      }
    }

    updateIncidentsState((prev) =>
      prev.filter((item) => item.id !== id)
    );

    try {
      await fetch(`/api/atendimentos/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Erro ao excluir atendimento:', err);
    }
  };

  // Contagem de itens herdados pendentes de aceite DIRECIONADOS PARA A TURMA DO OPERADOR LOGADO/ATIVO.
  const userTargetTurma = normalizeTurma(currentUser?.turma) || normalizeTurma(activeShift?.turma) || normalizeTurma(selectedTurmaFilter);

  const unacceptedCount = incidents.filter((i) => {
    const itemTurmaClean = normalizeTurma(i.turma);
    const matchesTurma = userTargetTurma && userTargetTurma !== 'GERAL'
      ? itemTurmaClean === userTargetTurma
      : true;

    return i.isPendenciaHerdada
      && matchesTurma
      && i.status !== 'FINALIZADO'
      && i.status !== 'RETROAGIDO'
      && i.status !== 'EM_ANDAMENTO';
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

  const applyTheme = (newTheme: ThemeMode) => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.remove('dark', 'theme-mina');
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'mina') {
      document.documentElement.classList.add('theme-mina');
    }
  };

  // Carregar lista de usuários salvos e usuário ativo (roda na montagem)
  useEffect(() => {
    try {
      const savedList = localStorage.getItem('passaturno-users-list');
      let usersList: UserSession[] = [];
      if (savedList) {
        usersList = JSON.parse(savedList) as UserSession[];
        setLoggedInUsers(usersList);
      }

      const savedUserStr = localStorage.getItem('passaturno-user');
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr) as UserSession;
        setCurrentUser(u);
        
        // Garantir que u está na lista de loggedInUsers
        if (!usersList.some((x) => x.id === u.id)) {
          const newList = [u, ...usersList];
          setLoggedInUsers(newList);
          localStorage.setItem('passaturno-users-list', JSON.stringify(newList));
        }

        setSelectedTurmaFilter('TODAS');
        const userKey = `passaturno-theme-${u.id}`;
        const userTheme = (localStorage.getItem(userKey) as ThemeMode) || 'light';
        setTheme(userTheme);
        applyTheme(userTheme);
        loadData();
        return;
      }
    } catch (e) {
      console.error('Erro ao carregar sessão do usuário:', e);
    }

    const guestTheme = (localStorage.getItem('passaturno-theme-guest') as ThemeMode) || 'light';
    setTheme(guestTheme);
    applyTheme(guestTheme);
    setSelectedTurmaFilter('TODAS');
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ao realizar login de um operador
  const handleLoginSuccess = (user: UserSession) => {
    setCurrentUser(user);
    setLoggedInUsers((prev) => {
      const filtered = prev.filter((u) => u.id !== user.id);
      const newList = [user, ...filtered];
      localStorage.setItem('passaturno-users-list', JSON.stringify(newList));
      return newList;
    });
    localStorage.setItem('passaturno-user', JSON.stringify(user));
    setIsAddUserModalOpen(false);

    setSelectedTurmaFilter('TODAS');
    const userKey = `passaturno-theme-${user.id}`;
    const userSavedTheme = (localStorage.getItem(userKey) as ThemeMode) || 'light';
    setTheme(userSavedTheme);
    applyTheme(userSavedTheme);
    loadData();
  };

  // Alternar para outro usuário que já está logado
  const handleSelectUser = (user: UserSession) => {
    setCurrentUser(user);
    localStorage.setItem('passaturno-user', JSON.stringify(user));
    const uTurma = normalizeTurma(user.turma) || user.turma?.toUpperCase().trim() || 'A';
    setSelectedTurmaFilter(uTurma);
    const userKey = `passaturno-theme-${user.id}`;
    const userSavedTheme = (localStorage.getItem(userKey) as ThemeMode) || 'light';
    setTheme(userSavedTheme);
    applyTheme(userSavedTheme);
    loadData(uTurma);
  };

  const handleLogout = () => {
    if (currentUser) {
      const updatedList = loggedInUsers.filter((u) => u.id !== currentUser.id);
      setLoggedInUsers(updatedList);
      localStorage.setItem('passaturno-users-list', JSON.stringify(updatedList));

      const nextUser = updatedList[0] || null;
      setCurrentUser(nextUser);

      if (nextUser) {
        localStorage.setItem('passaturno-user', JSON.stringify(nextUser));
        const uTurma = normalizeTurma(nextUser.turma) || 'A';
        setSelectedTurmaFilter(uTurma);
        loadData(uTurma);
      } else {
        localStorage.removeItem('passaturno-user');
        const guestTheme = (localStorage.getItem('passaturno-theme-guest') as ThemeMode) || 'light';
        setTheme(guestTheme);
        applyTheme(guestTheme);
        loadData();
      }
    }
  };

  // Alterar status diretamente no Kanban
  const handleStatusChange = async (id: string, newStatus: IncidentStatusType) => {
    const nowIso = new Date().toISOString();
    const isFin = newStatus === 'FINALIZADO' || newStatus === 'RETROAGIDO';
    const isInherited = newStatus === 'PENDENCIA_PROXIMO_TURNO';
    const activeTurma = normalizeTurma(currentUser?.turma) || normalizeTurma(activeShift?.turma) || normalizeTurma(selectedTurmaFilter) || 'A';
    const activeResp = activeShift?.responsavelNome || currentUser?.nome;

    // Quando envia para a fila do próximo turno, direciona para a PRÓXIMA turma (ex: C -> D)
    // Quando finaliza ou retroage, direciona para a TURMA ATUAL (ex: C)
    const targetTurma = newStatus === 'PENDENCIA_PROXIMO_TURNO'
      ? getNextTurma(activeTurma)
      : (newStatus === 'EM_ANDAMENTO' || isFin ? activeTurma : undefined);

    updateIncidentsState((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: newStatus,
              isPendenciaHerdada: isInherited,
              turma: targetTurma || item.turma,
              responsavel: activeResp && (newStatus === 'EM_ANDAMENTO' || isFin) ? (item.responsavel || activeResp) : item.responsavel,
              dataHoraLiberacao: isFin ? (item.dataHoraLiberacao || nowIso) : item.dataHoraLiberacao,
              atualizadoEm: nowIso,
            }
          : item
      )
    );

    try {
      const patchData: any = {
        status: newStatus,
        isPendenciaHerdada: isInherited,
      };
      if (targetTurma) patchData.turma = targetTurma;
      if (activeResp && (newStatus === 'EM_ANDAMENTO' || isFin)) patchData.responsavel = activeResp;
      markPending(id, patchData);

      const res = await fetch(`/api/atendimentos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchData),
      });
      confirmPending(id);

      if (res.ok) {
        const updated = await res.json();
        updateIncidentsState((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );
      }
    } catch (err) {
      confirmPending(id);
      console.error(err);
    }
  };

  // Alterar prioridade diretamente no Kanban
  const handlePriorityChange = async (id: string, newPriority: PriorityLevel) => {
    updateIncidentsState((prev) =>
      prev.map((item) => (item.id === id ? { ...item, prioridade: newPriority, atualizadoEm: new Date().toISOString() } : item))
    );

    try {
      const patchData = { prioridade: newPriority };
      markPending(id, patchData);

      const res = await fetch(`/api/atendimentos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchData),
      });
      confirmPending(id);

      if (res.ok) {
        const updated = await res.json();
        updateIncidentsState((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );
      }
    } catch (err) {
      confirmPending(id);
      console.error(err);
    }
  };

  // Alternar "No Código" / "Em Andamento" diretamente no Kanban
  const handleNoCodigoChange = async (id: string, noCodigo: boolean) => {
    const patchData: any = {
      noCodigo,
      status: 'EM_ANDAMENTO',
    };

    updateIncidentsState((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, ...patchData, atualizadoEm: new Date().toISOString() }
          : item
      )
    );

    try {
      markPending(id, patchData);

      const res = await fetch(`/api/atendimentos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchData),
      });
      confirmPending(id);

      if (res.ok) {
        const updated = await res.json();
        updateIncidentsState((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );
      }
    } catch (err) {
      confirmPending(id);
      console.error(err);
    }
  };

  // Alternar Divisão de Atuação (Monitoramento vs Corretiva de Campo) diretamente no Kanban/Detalhes
  const handleDivisaoChange = async (id: string, newDivisao: 'MONITORAMENTO' | 'CORRETIVA_CAMPO') => {
    updateIncidentsState((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, divisaoAtuacao: newDivisao, atualizadoEm: new Date().toISOString() }
          : item
      )
    );

    try {
      const activeResp = currentUser?.nome || 'Técnico';
      const labelDiv = newDivisao === 'CORRETIVA_CAMPO' ? 'Corretiva de Campo' : 'Monitoramento (NOC)';
      const patchData = {
        divisaoAtuacao: newDivisao,
        logDescription: `Divisão de atuação alterada para ${labelDiv}.`,
        logUsuario: activeResp,
      };
      markPending(id, { divisaoAtuacao: newDivisao });

      const res = await fetch(`/api/atendimentos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchData),
      });
      confirmPending(id);

      if (res.ok) {
        const updated = await res.json();
        updateIncidentsState((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );
      }
    } catch (err) {
      confirmPending(id);
      console.error('Erro ao alterar divisão de atuação:', err);
    }
  };

  // Aceitar notificação de prioridade da passagem de turno e mover para a fila Em Andamento
  const handleAcceptPriority = async (incident: IncidentType) => {
    // Preservar a prioridade original definida pelo operador (não forçar 'ALTA')
    const targetPriority = incident.prioridade || 'MEDIA';
    const activeTurma = normalizeTurma(activeShift?.turma) || normalizeTurma(currentUser?.turma) || normalizeTurma(incident.turma) || '';
    const activeResp = activeShift?.responsavelNome || currentUser?.nome || incident.responsavel;

    updateIncidentsState((prev) =>
      prev.map((item) =>
        item.id === incident.id
          ? {
              ...item,
              status: 'EM_ANDAMENTO',
              prioridade: targetPriority,
              isPendenciaHerdada: false,
              turma: activeTurma,
              responsavel: activeResp,
              atualizadoEm: new Date().toISOString(),
            }
          : item
      )
    );

    try {
      const patchData = {
        status: 'EM_ANDAMENTO',
        prioridade: targetPriority,
        isPendenciaHerdada: false,
        turma: activeTurma,
        responsavel: activeResp,
        logDescription: `Pendência da passagem de turno aceita pela Turma ${activeTurma} (${activeResp}). Movido para a fila Em Andamento.`,
        logUsuario: activeResp,
      };
      markPending(incident.id, patchData);

      const res = await fetch(`/api/atendimentos/${incident.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchData),
      });
      confirmPending(incident.id);

      if (res.ok) {
        const updated = await res.json();
        updateIncidentsState((prev) =>
          prev.map((item) => (item.id === incident.id ? updated : item))
        );
      }
    } catch (err) {
      confirmPending(incident.id);
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
    const nowIso = new Date().toISOString();
    const isFin = targetStatus === 'FINALIZADO' || targetStatus === 'RETROAGIDO';

    const activeTurma = normalizeTurma(currentUser?.turma) || normalizeTurma(activeShift?.turma) || normalizeTurma(selectedTurmaFilter) || 'A';
    const isInherited = targetStatus === 'PENDENCIA_PROXIMO_TURNO';
    const targetTurma = targetStatus === 'PENDENCIA_PROXIMO_TURNO'
      ? getNextTurma(activeTurma)
      : (isFin ? activeTurma : undefined);

    // 1. Fechar o modal IMEDIATAMENTE (resposta instantânea na UI sem travar o operador)
    setIsEditIncidentOpen(false);
    setSelectedEditIncident(null);

    // 2. Atualizar estado local + localStorage (garante a integridade e persistência de 100% dos dados!)
    updateIncidentsState((prev) =>
      prev.map((item) =>
        item.id === incidentId
          ? {
              ...item,
              status: targetStatus,
              solucao: targetSolucao,
              isPendenciaHerdada: isInherited,
              turma: targetTurma || item.turma,
              dataHoraLiberacao: isFin ? (item.dataHoraLiberacao || nowIso) : item.dataHoraLiberacao,
              atualizadoEm: nowIso,
            }
          : item
      )
    );

    // 3. Persistir no servidor em segundo plano
    try {
      const patchBody: any = {
        status: targetStatus,
        solucao: targetSolucao,
        isPendenciaHerdada: isInherited,
      };
      if (targetTurma) patchBody.turma = targetTurma;
      markPending(incidentId, patchBody);

      const res = await fetch(`/api/atendimentos/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchBody),
      });
      confirmPending(incidentId);
      if (res.ok) {
        const updated = await res.json();
        updateIncidentsState((prev) =>
          prev.map((item) => (item.id === incidentId ? updated : item))
        );
      }
    } catch (err) {
      confirmPending(incidentId);
      console.error('Erro ao salvar alteração de atendimento:', err);
    }
  };

  // Adicionar Anotação / Observação no Atendimento
  const handleSaveComment = async (incidentId: string, commentText: string, authorName: string) => {
    const nowIso = new Date().toISOString();
    const newLogItem: IncidentHistoryType = {
      id: `hist-${Date.now()}`,
      incidentId,
      tipoEvento: 'ATUALIZACAO',
      descricao: `Anotação do Turno: ${commentText}`,
      usuario: authorName || 'John Tavares',
      dataHora: nowIso,
    };

    // 1. Fechar o modal imediatamente (resposta instantânea sem travar)
    setIsCommentOpen(false);
    setSelectedCommentIncident(null);

    // 2. Atualizar estado local + localStorage (garante atualização imediata do card)
    let optimisticHistory: IncidentHistoryType[] = [newLogItem];
    updateIncidentsState((prev) =>
      prev.map((item) => {
        if (item.id === incidentId) {
          const currentHist = item.historico || [];
          optimisticHistory = [newLogItem, ...currentHist];
          return {
            ...item,
            observacao: commentText,
            atualizadoEm: nowIso,
            historico: optimisticHistory,
          };
        }
        return item;
      })
    );

    // 3. Persistir na API em segundo plano
    try {
      const patchData = {
        observacao: commentText,
        logDescription: `Anotação do Turno: ${commentText}`,
        logUsuario: authorName || 'John Tavares',
      };
      markPending(incidentId, { observacao: commentText, historico: optimisticHistory });

      const res = await fetch(`/api/atendimentos/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchData),
      });
      confirmPending(incidentId);
      if (res.ok) {
        const updated = await res.json();
        updateIncidentsState((prev) =>
          prev.map((item) => (item.id === incidentId ? updated : item))
        );
      }
    } catch (err) {
      confirmPending(incidentId);
      console.error('Erro ao salvar anotação:', err);
    }
  };



  // Salvar a alteração de tema estritamente no perfil do usuário logado
  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    const userKey = currentUser ? `passaturno-theme-${currentUser.id}` : 'passaturno-theme-guest';
    localStorage.setItem(userKey, newTheme);
    applyTheme(newTheme);
  };

  if (currentUser?.cargo === 'LÍDER DE TURMA') {
    return (
      <>
        <LiderDashboardView
          incidents={incidents}
          activeShift={activeShift}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenTimeline={(inc) => {
            setSelectedTimelineIncident(inc);
            setIsTimelineOpen(true);
          }}
          onOpenCommentModal={(inc) => {
            setSelectedCommentIncident(inc);
            setIsCommentOpen(true);
          }}
          onDeleteIncident={handleDeleteIncident}
          onStatusChange={handleStatusChange}
          onPriorityChange={handlePriorityChange}
          onNoCodigoChange={handleNoCodigoChange}
          onDivisaoChange={handleDivisaoChange}
          onOpenWhatsapp={(inc) => {
            setSelectedWhatsappIncident(inc);
            setIsWhatsappOpen(true);
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
        />

        {/* Modais de Linha do Tempo, Comentários, Histórico e Edição no Perfil do Líder */}
        <IncidentTimelineModal
          incident={selectedTimelineIncident}
          isOpen={isTimelineOpen}
          onClose={() => {
            setIsTimelineOpen(false);
            setSelectedTimelineIncident(null);
          }}
          onTimelineUpdated={loadData}
        />

        <CommentModal
          incident={selectedCommentIncident}
          isOpen={isCommentOpen}
          onClose={() => {
            setIsCommentOpen(false);
            setSelectedCommentIncident(null);
          }}
          onSaveComment={handleSaveComment}
          currentUserName={currentUser?.nome || activeShift?.responsavelNome || 'John Tavares'}
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

        <WhatsappModal
          incident={selectedWhatsappIncident}
          isOpen={isWhatsappOpen}
          onClose={() => {
            setIsWhatsappOpen(false);
            setSelectedWhatsappIncident(null);
          }}
        />

        {/* Modal de Edição Rápida no Perfil do Líder */}
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                  >
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="AGUARDANDO">Aguardando / Pausado</option>
                    <option value="PENDENCIA_PROXIMO_TURNO">Pendência Próximo Turno</option>
                    <option value="FINALIZADO">Finalizado / Concluído</option>
                    <option value="RETROAGIDO">Retroagido</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Solução Aplicada / Observações</label>
                  <textarea
                    rows={3}
                    placeholder="Descreva a solução..."
                    value={editSolucao}
                    onChange={(e) => setEditSolucao(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditIncidentOpen(false);
                      setSelectedEditIncident(null);
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-600 font-semibold text-xs rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-600 text-white font-semibold text-xs rounded-xl shadow-xs"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col selection:bg-sky-500 selection:text-white transition-colors duration-300">
      
      {/* Modal de Login (bloqueia se nenhum operador estiver autenticado) */}
      {!currentUser && (
        <LoginModal 
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Top Navbar */}
      <HeaderNav
        activeShift={activeShift}
        onOpenNewIncident={() => setIsNewIncidentOpen(true)}
        onOpenAssumeShift={() => setIsAssumeShiftOpen(true)}
        onOpenCloseShift={() => setIsCloseShiftOpen(true)}
        onOpenTwoHourReport={() => setIsTwoHourReportOpen(true)}
        onOpenTeamsCheck={() => setIsTeamsCheckOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        unacceptedCount={unacceptedCount}
        onRestoreNotifications={handleRestoreNotifications}
        currentTheme={theme}
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
        ) : (() => {
          const isToday = (dateStr?: string | null) => {
            if (!dateStr) return false;
            try {
              const d = new Date(dateStr);
              const today = new Date();
              return (
                d.getDate() === today.getDate() &&
                d.getMonth() === today.getMonth() &&
                d.getFullYear() === today.getFullYear()
              );
            } catch {
              return false;
            }
          };

                    const displayedIncidents = (() => {
            // Ao encerrar o turno (quando não há turno ativo), o painel fica 100% LIMPO!
            if (!activeShift) return [];

            const activeTurmaClean = normalizeTurma(activeShift.turma) || normalizeTurma(currentUser?.turma) || 'A';
            const filterTurma = (selectedTurmaFilter && selectedTurmaFilter !== 'TODAS')
              ? normalizeTurma(selectedTurmaFilter)
              : activeTurmaClean;

            return incidents.filter((item) => {
              const itemTurma = normalizeTurma(item.turma);

              // 1. Atendimento criado ou vinculado ao turno ativo atual
              const isDoTurnoAtivo =
                typeof item.shiftId === 'string' &&
                item.shiftId === activeShift.id;

              // 2. Ocorrências finalizadas ou retroagidas: exibe APENAS se concluídas no turno ativo atual
              if (item.status === 'FINALIZADO' || item.status === 'RETROAGIDO') {
                return isDoTurnoAtivo;
              }

              // 3. Ocorrências em aberto (EM_ANDAMENTO, AGUARDANDO, PENDENCIA_PROXIMO_TURNO, NO_CODIGO):
              // Exibe se pertencer ao turno ativo atual OU se for pertencente à mesma turma ativa do operador (ex: Turma C)
              const matchesTurma = itemTurma === filterTurma;
              return isDoTurnoAtivo || matchesTurma;
            });
          })();


          return (
          <>
            {/* 0. Notificações / Orientações enviadas pela Liderança da Turma */}
            <LeaderMessageNotification userTurma={activeShift?.turma || 'A'} currentUser={currentUser} />

            {/* 1. Dashboard Stats */}
            <DashboardStats incidents={displayedIncidents} />

            {/* 2. Prioridades Críticas / Notificação da Passagem de Turno */}
            <CriticalPriorities
              incidents={displayedIncidents}
              currentTurma={userTargetTurma || selectedTurmaFilter}
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
              incidents={displayedIncidents}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onNoCodigoChange={handleNoCodigoChange}
              onDivisaoChange={handleDivisaoChange}
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

            {/* Bloco de Anúncio Exclusivo para Desktop / Notebook */}
            <DesktopAdBanner />

            {/* 4. Resumo dos Atendimentos Diários & Passagem de Turno (Posicionado na parte inferior) */}
            <DailySummarySection incidents={displayedIncidents} activeShift={activeShift} currentUser={currentUser} />
          </>
          );
        })()}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400 font-medium">
        <p>Passaturno • Gestão de Ocorrências e Continuidade Operacional</p>
      </footer>

      {/* Modals */}
      <NewIncidentModal
        isOpen={isNewIncidentOpen}
        onClose={() => setIsNewIncidentOpen(false)}
        equipments={equipments}
        turma={normalizeTurma(activeShift?.turma) || normalizeTurma(currentUser?.turma) || (selectedTurmaFilter !== 'TODAS' ? normalizeTurma(selectedTurmaFilter) : null) || normalizeTurma(currentUser?.turma) || 'A'}
        currentUser={currentUser}
        onIncidentCreated={handleIncidentCreated}
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
        currentUser={currentUser}
      />

      <CloseShiftModal
        isOpen={isCloseShiftOpen}
        onClose={() => setIsCloseShiftOpen(false)}
        activeShift={activeShift}
        incidents={incidents}
        onShiftClosed={loadData}
        currentUser={currentUser}
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
        onSaveComment={handleSaveComment}
        currentUserName={activeShift?.responsavelNome || 'John Tavares'}
      />

      <LiderTurmaModal
        isOpen={isLiderTurmaOpen}
        onClose={() => setIsLiderTurmaOpen(false)}
        incidents={incidents}
        activeShift={activeShift}
        selectedTurmaFilter={selectedTurmaFilter}
        onSelectTurmaFilter={setSelectedTurmaFilter}
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
        currentUser={currentUser}
      />

      {/* Modal de Edição de Perfil do Turno / Letra */}
      <EditTurmaProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentUser={currentUser}
        onProfileUpdated={(updated) => {
          setCurrentUser(updated);
          if (typeof window !== 'undefined') {
            localStorage.setItem('passaturno-user', JSON.stringify(updated));
            try {
              const savedListStr = localStorage.getItem('passaturno-users-list');
              if (savedListStr) {
                const savedList = JSON.parse(savedListStr) as any[];
                const updatedList = savedList.map((u) => (u.id === updated.id || u.nome === updated.nome ? { ...u, ...updated } : u));
                localStorage.setItem('passaturno-users-list', JSON.stringify(updatedList));
                setLoggedInUsers(updatedList);
              }
            } catch (e) {
              console.error('Erro ao atualizar passaturno-users-list:', e);
            }
          }
          const updatedTurma = normalizeTurma(updated.turma) || updated.turma || 'A';
          setSelectedTurmaFilter(updatedTurma);
          loadData(updatedTurma);
        }}
      />

      {/* Central de Configurações */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser}
        activeShift={activeShift}
        currentTheme={theme}
        onThemeChange={handleThemeChange}
        onOpenAssumeShift={() => setIsAssumeShiftOpen(true)}
        onOpenCloseShift={() => setIsCloseShiftOpen(true)}
        onOpenEquipmentManager={() => setIsEquipmentManagerOpen(true)}
        onOpenTwoHourReport={() => setIsTwoHourReportOpen(true)}
        onOpenGpsDiagnostic={() => setIsGpsDiagnosticOpen(true)}
        onOpenHistoryTab={() => setIsHistoryTabOpen(true)}
        onRefreshData={loadData}
        onProfileUpdated={(updated) => {
          setCurrentUser(updated);
          if (typeof window !== 'undefined') {
            localStorage.setItem('passaturno-user', JSON.stringify(updated));
          }
          loadData();
        }}
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

      {/* Modal Check de Equipes (Início de Turno) */}
      <TeamsCheckModal
        isOpen={isTeamsCheckOpen}
        onClose={() => setIsTeamsCheckOpen(false)}
        activeShift={activeShift}
        currentUser={currentUser}
      />

    </div>
  );
}
