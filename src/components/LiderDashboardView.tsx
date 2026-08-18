'use client';

import React, { useState, useEffect } from 'react';
import { IncidentType, ShiftType } from '@/types';
import { 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight, 
  Clock, 
  User, 
  MessageSquare, 
  Send, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  History, 
  ChevronRight, 
  CheckCircle2, 
  LogOut, 
  Megaphone,
  Wrench,
  Tag,
  Layers,
  LayoutDashboard,
  Bell,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Users,
  CheckSquare,
  AlertTriangle,
  UserPlus,
  Radio,
  SlidersHorizontal,
  FolderOpen,
  X,
  Calendar,
  PieChart,
  FileText,
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { ChatMessage } from './LiderTurmaModal';
import { OperatorReply } from './LeaderMessageNotification';
import { normalizeTurma, isIncidentFromToday } from '@/lib/turma';
import { KanbanBoard } from './KanbanBoard';
import { IncidentStatusType, PriorityLevel } from '@/types';

interface LiderDashboardViewProps {
  incidents: IncidentType[];
  activeShift: ShiftType | null;
  currentUser: any;
  onLogout: () => void;
  onOpenTimeline: (incident: IncidentType) => void;
  onOpenCommentModal: (incident: IncidentType) => void;
  onDeleteIncident: (id: string) => void;
  onStatusChange?: (id: string, newStatus: IncidentStatusType) => void;
  onPriorityChange?: (id: string, newPriority: PriorityLevel) => void;
  onNoCodigoChange?: (id: string, noCodigo: boolean) => void;
  onDivisaoChange?: (id: string, newDivisao: 'MONITORAMENTO' | 'CORRETIVA_CAMPO') => void;
  onOpenWhatsapp?: (incident: IncidentType) => void;
  onOpenEquipmentHistory?: (tag: string) => void;
  onOpenEditIncident?: (incident: IncidentType) => void;
}

export const LiderDashboardView: React.FC<LiderDashboardViewProps> = ({
  incidents,
  activeShift,
  currentUser,
  onLogout,
  onOpenTimeline,
  onOpenCommentModal,
  onDeleteIncident,
  onStatusChange,
  onPriorityChange,
  onNoCodigoChange,
  onDivisaoChange,
  onOpenWhatsapp,
  onOpenEquipmentHistory,
  onOpenEditIncident,
}) => {
  // Navegação Lateral do Menu
  const [activeSection, setActiveSection] = useState<'dashboard' | 'reports' | 'team' | 'history' | 'notifications' | 'alerts'>('dashboard');

  // Filtros Avançados da Seção de Relatórios
  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [reportEndDate, setReportEndDate] = useState<string>('');
  const [reportTurmaFilter, setReportTurmaFilter] = useState<string>('TODAS');
  const [reportPriorityFilter, setReportPriorityFilter] = useState<string>('TODAS');
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('TODOS');
  const [reportFalhaFilter, setReportFalhaFilter] = useState<string>('TODAS');
  const [reportSearchTerm, setReportSearchTerm] = useState<string>('');
  const [reportChartView, setReportChartView] = useState<'totalHours' | 'avgTime' | 'topEquipments'>('totalHours');

  // Paginação da Tabela de Relatórios
  const [reportPage, setReportPage] = useState<number>(1);
  const [reportItemsPerPage, setReportItemsPerPage] = useState<number>(10);

  // Filtros da Seção de Histórico
  const [historyTurmaTab, setHistoryTurmaTab] = useState<string>('TODAS');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('TODOS');
  const [historySearchTerm, setHistorySearchTerm] = useState<string>('');

  // Gestão de Usuários / Contas
  const [userList, setUserList] = useState<any[]>([]);
  const [newOpNome, setNewOpNome] = useState('');
  const [newOpMatricula, setNewOpMatricula] = useState('');
  const [newOpTurma, setNewOpTurma] = useState('A');
  const [newOpEscala, setNewOpEscala] = useState('3x3');
  const [newOpDiaEscala, setNewOpDiaEscala] = useState('1º Dia');
  const [newOpSenha, setNewOpSenha] = useState('123456');
  const [userCreatedMsg, setUserCreatedMsg] = useState('');

  // Modal de Edição de Usuário pelo Líder
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editMatricula, setEditMatricula] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSenha, setEditSenha] = useState('');
  const [editTurma, setEditTurma] = useState('A');
  const [editHorario, setEditHorario] = useState('07:00 às 19:00');
  const [editPeriodo, setEditPeriodo] = useState<'Dia' | 'Noite'>('Dia');
  const [editEscala, setEditEscala] = useState('3x3');
  const [editDiaEscala, setEditDiaEscala] = useState('1º Dia');

  // Notificações / Chat State
  const [targetTurmaChannel, setTargetTurmaChannel] = useState<string>('GERAL');
  const [msgInput, setMsgInput] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [operatorReplies, setOperatorReplies] = useState<OperatorReply[]>([]);

  // Time clock
  const [currentTime, setCurrentTime] = useState<string>('');

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/usuarios');
      if (res.ok) setUserList(await res.json());
    } catch (e) {
      console.error('Erro ao carregar usuários:', e);
    }
  };

  const loadMessages = async () => {
    try {
      const res = await fetch('/api/lider/mensagens');
      if (res.ok) {
        const raw = (await res.json()) as any[];
        setMessages(raw.map((m) => ({ ...m, timestamp: m.timestamp || m.criadoEm || m.dataHora })));
      }
    } catch (e) {
      console.error('Erro ao carregar mensagens:', e);
    }
  };

  const loadReplies = async () => {
    try {
      const res = await fetch('/api/lider/respostas');
      if (res.ok) {
        const raw = (await res.json()) as any[];
        setOperatorReplies(raw.map((r) => ({ ...r, timestamp: r.timestamp || r.criadoEm || r.dataHora })));
      }
    } catch (e) {
      console.error('Erro ao carregar respostas:', e);
    }
  };

  useEffect(() => {
    loadUsers();
    loadMessages();
    loadReplies();
  }, []);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy • HH:mm:ss"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Polling de respostas a cada 10s
  useEffect(() => {
    const interval = setInterval(loadReplies, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSendLeaderMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim()) return;

    const body = {
      sender: currentUser?.nome || 'Líder da Turma',
      senderId: currentUser?.id || null,
      targetTurma: targetTurmaChannel,
      text: msgInput.trim(),
    };

    try {
      const res = await fetch('/api/lider/mensagens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => [newMsg, ...prev]);
      }
    } catch (e) {
      console.error('Erro ao enviar mensagem:', e);
    }
    setMsgInput('');
  };

  const handleCreateOperatorAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpNome.trim() || !newOpMatricula.trim() || !newOpSenha.trim()) return;

    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: newOpNome.trim(),
          matricula: newOpMatricula.trim(),
          senha: newOpSenha.trim(),
          turma: newOpTurma,
          criadoPor: currentUser?.nome || 'Líder da Turma',
        }),
      });

      if (res.ok) {
        await loadUsers();
        setUserCreatedMsg(`Conta da Turma ${newOpTurma} criada com sucesso para ${newOpNome.trim()}! (Matrícula: ${newOpMatricula.trim()})`);
        setNewOpNome('');
        setNewOpMatricula('');
        setNewOpSenha('123456');
      } else {
        const err = await res.json();
        setUserCreatedMsg(`Erro: ${err.error}`);
      }
    } catch (e) {
      console.error('Erro ao criar conta:', e);
      setUserCreatedMsg('Erro ao criar conta. Verifique o console.');
    }
    setTimeout(() => setUserCreatedMsg(''), 4000);
  };

  const handleOpenEditUser = (user: any) => {
    setEditingUser(user);
    setEditNome(user.nome);
    setEditMatricula(user.matricula);
    setEditEmail(user.email);
    setEditSenha(user.senha);
    setEditTurma(user.turma);
    setEditHorario(user.horarioTurno || '07:00 às 19:00');
    setEditPeriodo(user.periodoTurno || (user.turma === 'D' ? 'Noite' : 'Dia'));
    setEditEscala(user.escala || '3x3');
    setEditDiaEscala(user.diaEscala || '1º Dia');
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const res = await fetch(`/api/usuarios/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: editNome.trim(),
          matricula: editMatricula.trim(),
          email: editEmail.trim(),
          senha: editSenha.trim(),
          turma: editTurma,
          horarioTurno: editHorario.trim(),
          periodoTurno: editPeriodo,
          escala: editEscala.trim(),
          diaEscala: editDiaEscala.trim(),
        }),
      });

      if (res.ok) {
        await loadUsers();
        setUserCreatedMsg(`Conta de ${editNome.trim()} (Turma ${editTurma}) atualizada com sucesso!`);
      } else {
        const err = await res.json();
        setUserCreatedMsg(`Erro: ${err.error}`);
      }
    } catch (e) {
      console.error('Erro ao atualizar conta:', e);
      setUserCreatedMsg('Erro ao atualizar conta.');
    }
    setEditingUser(null);
    setTimeout(() => setUserCreatedMsg(''), 4000);
  };

  // Seletor de Turma e Mapeamento de Turnos Ativos de Todas as Turmas
  // Apenas a turma ativa é exibida na home do líder
  const [allActiveShifts, setAllActiveShifts] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchAllShifts = async () => {
      try {
        const turmasList = ['A', 'B', 'C', 'D'];
        const map: Record<string, any> = {};
        await Promise.all(
          turmasList.map(async (t) => {
            const res = await fetch(`/api/turnos/ativo?turma=${t}`);
            if (res.ok) {
              const data = await res.json();
              if (data.activeShift) {
                map[t] = data.activeShift;
              }
            }
          })
        );
        setAllActiveShifts(map);
      } catch (e) {
        console.error('Erro ao buscar turnos ativos das turmas:', e);
      }
    };
    fetchAllShifts();
    const interval = setInterval(fetchAllShifts, 20000);
    return () => clearInterval(interval);
  }, []);

  // Resolução Estável e Determinística da Turma Ativa Oficial do CCO
  const officialActiveTurma = (() => {
    // 1. Se o prop activeShift possuir um turno ATIVO, ele é a fonte da verdade oficial do CCO!
    if (activeShift?.status === 'ATIVO' && activeShift.turma) {
      return normalizeTurma(activeShift.turma) || 'C';
    }

    // 2. Se houver algum turno ativo no mapa, seleciona o mais recente cronologicamente
    const activeList = Object.values(allActiveShifts).filter((s) => s?.status === 'ATIVO');
    if (activeList.length > 0) {
      activeList.sort((a, b) => new Date(b.criadoEm || b.horaInicio || 0).getTime() - new Date(a.criadoEm || a.horaInicio || 0).getTime());
      return normalizeTurma(activeList[0].turma) || 'C';
    }

    // 3. Verifica a turma com atendimentos ativos no dia
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    incidents.forEach((i) => {
      if (i.status !== 'FINALIZADO' && i.status !== 'RETROAGIDO') {
        const t = normalizeTurma(i.turma) || 'C';
        if (counts[t] !== undefined) counts[t] += 1;
      }
    });

    const turmasComAtendimentos = Object.keys(counts).filter((t) => counts[t] > 0);
    if (turmasComAtendimentos.length > 0) {
      turmasComAtendimentos.sort((a, b) => counts[b] - counts[a]);
      return turmasComAtendimentos[0];
    }

    // 4. Fallback padrão: 'C'
    return 'C';
  })();

  const currentActiveTurma = officialActiveTurma;
  const effectiveKanbanTurma = currentActiveTurma;

  // Helper para buscar o nome do técnico responsavel de cada turma
  const getTechnicianForTurma = (turmaKey: string) => {
    const cleanTurma = normalizeTurma(turmaKey);
    if (!cleanTurma || cleanTurma === 'TODAS') return null;

    const shiftResp = allActiveShifts[cleanTurma]?.responsavelNome || (activeShift && normalizeTurma(activeShift.turma) === cleanTurma ? activeShift.responsavelNome : null);
    if (shiftResp && !shiftResp.toLowerCase().startsWith('operador turma') && shiftResp.toLowerCase() !== 'operador') {
      return shiftResp;
    }

    const lastTechIncident = incidents.find(
      (i) => normalizeTurma(i.turma) === cleanTurma && i.responsavel && !i.responsavel.toLowerCase().startsWith('operador turma')
    );
    if (lastTechIncident?.responsavel) return lastTechIncident.responsavel;

    const userForTurma = userList.find((u) => normalizeTurma(u.turma) === cleanTurma && u.nome && !u.nome.toLowerCase().startsWith('operador turma'));
    if (userForTurma?.nome) return userForTurma.nome;

    return shiftResp || 'Técnico de Automação';
  };

  const activeShiftFromApi = Object.values(allActiveShifts).find((s) => s?.status === 'ATIVO') || activeShift;

  // Turno a ser exibido no Card de Topo (Card da Equipe do Dia)
  const displayedShift = allActiveShifts[currentActiveTurma]
    || (normalizeTurma(activeShift?.turma) === currentActiveTurma ? activeShift : null)
    || activeShiftFromApi
    || activeShift;

  const displayedHoraInicioTxt = (() => {
    if (displayedShift?.criadoEm || displayedShift?.horaInicio) {
      try {
        const d = new Date(displayedShift.criadoEm || displayedShift.horaInicio);
        return isNaN(d.getTime()) ? null : format(d, 'HH:mm');
      } catch {
        return null;
      }
    }
    return null;
  })();

  // Atendimentos pertencentes à turma ativa no dia/turno
  const atendimentosDoDia = incidents.filter((i) => {
    const iTurma = normalizeTurma(i.turma) || 'A';

    // Apenas a turma ativa no momento
    const isDaTurma = iTurma === currentActiveTurma || (displayedShift && i.shiftId === displayedShift.id);
    if (!isDaTurma) return false;

    // Se o atendimento não está finalizado (No Código, Em Andamento, Aguardando, Pendência Herdada), exibe SEMPRE!
    if (i.status !== 'FINALIZADO' && i.status !== 'RETROAGIDO') return true;

    // Se é um atendimento concluído, exibe se for do turno ativo ou se criado no dia de hoje
    if (displayedShift && i.shiftId === displayedShift.id) return true;
    return isIncidentFromToday(i);
  });

  // Estatísticas
  const totalIncidents = atendimentosDoDia.length;
  const concluidosCount = atendimentosDoDia.filter((i) => i.status === 'FINALIZADO' || i.status === 'RETROAGIDO').length;

  // Ativos em Alerta (Exclui concluídos e itens de turnos antigos)
  const priorityAlerts = incidents.filter((i) => {
    if (i.status === 'FINALIZADO' || i.status === 'RETROAGIDO') return false;
    if (i.status === 'PENDENCIA_PROXIMO_TURNO' || i.isPendenciaHerdada) return true;
    const isDoTurno = activeShift ? i.shiftId === activeShift.id : isIncidentFromToday(i);
    if (isDoTurno && (i.prioridade === 'CRITICA' || i.prioridade === 'ALTA')) return true;
    return false;
  });

  const pendenciasCount = priorityAlerts.length;
  const urgentesCount = priorityAlerts.length;
  
  const delayedAssets = incidents.filter(i => {
    if (i.status !== 'EM_ANDAMENTO') return false;
    const iTurma = normalizeTurma(i.turma) || 'A';
    if (iTurma !== currentActiveTurma) return false;
    
    const isDoTurno = activeShift ? i.shiftId === activeShift.id : isIncidentFromToday(i);
    if (!isDoTurno) return false;

    const start = new Date(i.criadoEm);
    const now = new Date();
    const diffHours = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
    return diffHours >= 2;
  });

  const getTurmaDestino = (turmaOrigem: string) => {
    switch (turmaOrigem.toUpperCase().trim()) {
      case 'A': return 'Turma B';
      case 'B': return 'Turma C';
      case 'C': return 'Turma D';
      case 'D':
      default: return 'Turma A';
    }
  };

  const getTurmaStats = (turmaLetra: string) => {
    const list = incidents.filter((i) => (i.turma || 'A').toUpperCase().trim() === turmaLetra);
    const concl = list.filter((i) => i.status === 'FINALIZADO' || i.status === 'RETROAGIDO').length;
    return {
      total: list.length,
      concluidos: concl,
      taxa: list.length > 0 ? Math.round((concl / list.length) * 100) : 0,
    };
  };

  const horaInicioTxt = (() => {
    if (!activeShift?.horaInicio) return null;
    try {
      const d = new Date(activeShift.horaInicio);
      return isNaN(d.getTime()) ? null : format(d, 'HH:mm');
    } catch {
      return null;
    }
  })();

  // Funções de atalhos rápidos de período
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
    setReportTurmaFilter('TODAS');
    setReportPriorityFilter('TODAS');
    setReportStatusFilter('TODOS');
    setReportFalhaFilter('TODAS');
    setReportSearchTerm('');
  };

  // Funçao de normalização de nomes de falhas (corrige erros como CAMONUICAÇÃO -> COMUNICAÇÃO)
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

  // Lista única de tipos de falhas normalizadas
  const availableFailureTypes = Array.from(
    new Set(incidents.map((i) => normalizeFailureName(i.tipoFalha || i.falha)))
  ).sort();

  // Histórico & Análise de Relatórios Filtrado
  const reportFilteredIncidents = incidents.filter((i) => {
    // Filtro de Turma
    const itemTurma = (i.turma || 'A').toUpperCase().trim();
    if (reportTurmaFilter !== 'TODAS' && itemTurma !== reportTurmaFilter) {
      return false;
    }

    // Filtro por Prioridade
    if (reportPriorityFilter !== 'TODAS' && i.prioridade !== reportPriorityFilter) {
      return false;
    }

    // Filtro por Status
    if (reportStatusFilter !== 'TODOS' && i.status !== reportStatusFilter) {
      return false;
    }

    // Filtro por Tipo de Falha
    const itemFalhaKey = normalizeFailureName(i.tipoFalha || i.falha);
    if (reportFalhaFilter !== 'TODAS' && itemFalhaKey !== reportFalhaFilter) {
      return false;
    }

    // Filtro por Data Inicial
    if (reportStartDate) {
      const itemDate = new Date(i.criadoEm || i.dataHoraParada);
      const startDate = new Date(reportStartDate + 'T00:00:00');
      if (itemDate < startDate) return false;
    }

    // Filtro por Data Final
    if (reportEndDate) {
      const itemDate = new Date(i.criadoEm || i.dataHoraParada);
      const endDate = new Date(reportEndDate + 'T23:59:59');
      if (itemDate > endDate) return false;
    }

    // Filtro de Busca por Texto
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

  // Paginação dos dados do relatório
  const totalReportPages = Math.max(1, Math.ceil(reportFilteredIncidents.length / reportItemsPerPage));
  const currentReportPage = Math.min(reportPage, totalReportPages);
  const reportStartIndex = (currentReportPage - 1) * reportItemsPerPage;
  const reportEndIndex = Math.min(reportStartIndex + reportItemsPerPage, reportFilteredIncidents.length);
  const paginatedReportIncidents = reportFilteredIncidents.slice(reportStartIndex, reportEndIndex);

  // Estatísticas de Falhas Normalizadas & Duração em Horas
  const failureAnalyticsMap = reportFilteredIncidents.reduce((acc, item) => {
    const rawKey = normalizeFailureName(item.tipoFalha || item.falha);
    if (!acc[rawKey]) {
      acc[rawKey] = {
        tipo: rawKey,
        count: 0,
        totalMins: 0,
      };
    }
    acc[rawKey].count += 1;

    const start = new Date(item.dataHoraParada || item.criadoEm);
    const end = item.dataHoraLiberacao ? new Date(item.dataHoraLiberacao) : new Date();
    const mins = Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60)));
    acc[rawKey].totalMins += mins;

    return acc;
  }, {} as Record<string, { tipo: string; count: number; totalMins: number }>);

  const grandTotalMins = Object.values(failureAnalyticsMap).reduce((sum, f) => sum + f.totalMins, 0);
  const maxCategoryMins = Math.max(...Object.values(failureAnalyticsMap).map((f) => f.totalMins), 1);
  const maxCategoryAvgMins = Math.max(
    ...Object.values(failureAnalyticsMap).map((f) => Math.round(f.totalMins / f.count)),
    1
  );

  const sortedFailureAnalytics = Object.values(failureAnalyticsMap)
    .map((f) => {
      const avgMins = Math.round(f.totalMins / f.count);
      const totalHours = (f.totalMins / 60).toFixed(1);
      const avgHours = (avgMins / 60).toFixed(1);
      const pctTime = grandTotalMins > 0 ? Math.round((f.totalMins / grandTotalMins) * 100) : 0;
      const pctCount = reportFilteredIncidents.length > 0 ? Math.round((f.count / reportFilteredIncidents.length) * 100) : 0;

      return {
        ...f,
        avgMins,
        totalHours,
        avgHours,
        pctTime,
        pctCount,
        totalFormatted: `${Math.floor(f.totalMins / 60)}h ${f.totalMins % 60}m`,
        avgFormatted: `${Math.floor(avgMins / 60)}h ${avgMins % 60}m`,
      };
    })
    .sort((a, b) => b.totalMins - a.totalMins);

  // Top Equipamentos com Mais Horas de Parada
  const equipmentAnalyticsMap = reportFilteredIncidents.reduce((acc, item) => {
    const key = item.tag.trim().toUpperCase();
    if (!acc[key]) {
      acc[key] = { tag: key, nome: item.equipamentoNome, count: 0, totalMins: 0 };
    }
    acc[key].count += 1;
    const start = new Date(item.dataHoraParada || item.criadoEm);
    const end = item.dataHoraLiberacao ? new Date(item.dataHoraLiberacao) : new Date();
    acc[key].totalMins += Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60)));
    return acc;
  }, {} as Record<string, { tag: string; nome: string; count: number; totalMins: number }>);

  const maxEquipMins = Math.max(...Object.values(equipmentAnalyticsMap).map((e) => e.totalMins), 1);
  const sortedEquipments = Object.values(equipmentAnalyticsMap)
    .map((e) => ({
      ...e,
      totalHours: (e.totalMins / 60).toFixed(1),
      totalFormatted: `${Math.floor(e.totalMins / 60)}h ${e.totalMins % 60}m`,
      pctTime: grandTotalMins > 0 ? Math.round((e.totalMins / grandTotalMins) * 100) : 0,
    }))
    .sort((a, b) => b.totalMins - a.totalMins)
    .slice(0, 8);

  const totalReportMins = grandTotalMins;
  const avgReportMins = reportFilteredIncidents.length > 0 ? Math.round(totalReportMins / reportFilteredIncidents.length) : 0;
  const avgReportDurationFormatted = `${Math.floor(avgReportMins / 60)}h ${avgReportMins % 60}m`;
  const grandTotalHoursFormatted = `${Math.floor(grandTotalMins / 60)}h ${grandTotalMins % 60}m`;
  const filteredHistory = incidents.filter((i) => {
    const q = historySearchTerm.toLowerCase().trim();
    const itemTurma = (i.turma || 'A').toUpperCase().trim();

    const matchesTurma = historyTurmaTab === 'TODAS' || itemTurma === historyTurmaTab;
    const matchesStatus = historyStatusFilter === 'TODOS' || i.status === historyStatusFilter;
    const matchesSearch =
      !q ||
      i.tag.toLowerCase().includes(q) ||
      i.equipamentoNome.toLowerCase().includes(q) ||
      i.falha.toLowerCase().includes(q) ||
      i.responsavel.toLowerCase().includes(q) ||
      (i.solucao && i.solucao.toLowerCase().includes(q)) ||
      (i.observacao && i.observacao.toLowerCase().includes(q));

    return matchesTurma && matchesStatus && matchesSearch;
  });

  const handleExportCSV = () => {
    if (filteredHistory.length === 0) return;

    const headers = [
      'ID', 'TAG', 'Equipamento', 'Turma Origem', 'Turma Destino', 'Tipo Falha',
      'Descrição Falha', 'Status', 'Prioridade', 'Responsável', 'Data Parada',
      'Data Liberação', 'Anotação Turno', 'Solução'
    ];

    const rows = filteredHistory.map((i) => [
      i.id, i.tag, `"${i.equipamentoNome}"`, `Turma ${i.turma || 'A'}`, getTurmaDestino(i.turma || 'A'),
      `"${i.tipoFalha}"`, `"${i.falha.replace(/"/g, '""')}"`, i.status, i.prioridade, `"${i.responsavel}"`,
      i.dataHoraParada, i.dataHoraLiberacao || '', `"${(i.observacao || '').replace(/"/g, '""')}"`,
      `"${(i.solucao || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Historico_Atendimentos_Turmas_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-800 flex font-sans">
      
      {/* SIDEBAR — limpa e consistente com o restante da página */}
      <aside className="w-56 bg-white flex flex-col justify-between hidden lg:flex flex-shrink-0 min-h-screen border-r border-slate-200 relative z-30">
        <div className="p-4 space-y-5">

          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="w-9 h-9 bg-white rounded-xl shadow-xs border border-slate-200/80 p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src="/icon.png"
                alt="PASSATURNO"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 leading-none">
                PASSA<span className="text-emerald-600">TURNO</span>
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Portal da Liderança</p>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 border border-slate-200">
              <User className="w-4 h-4 text-slate-500" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-800 truncate">{currentUser?.nome || 'Líder da Turma'}</p>
              <p className="text-[10px] text-slate-400 font-medium truncate">{currentUser?.cargo || 'Líder de Turma'}</p>
            </div>
          </div>

          {/* Navegação */}
          <nav className="space-y-1">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest px-2 pb-1">Menu</p>

            {[
              { id: 'dashboard',     label: 'Dashboard', icon: LayoutDashboard },
              { id: 'reports',       label: 'Relatórios', icon: BarChart3 },
              { id: 'team',          label: 'Gestão de Turma', icon: Users },
              { id: 'notifications', label: 'Notificações', icon: Megaphone },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id as typeof activeSection)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeSection === id
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${activeSection === id ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {label}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* 2. ÁREA PRINCIPAL DINÂMICA BASEADA NO ITEM SELECIONADO NA SIDEBAR */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-2xl shadow-xs border border-slate-200 p-1.5 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src="/icon.png"
                alt="PASSATURNO"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Painel da Liderança — <span className="text-emerald-600">{currentUser?.nome || 'Líder da Turma'}</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {activeSection === 'dashboard' && 'Visão geral da equipe do dia, estatísticas e acompanhamento em tempo real'}
                {activeSection === 'reports' && 'Relatórios operacionais, indicador de falhas e histórico de atendimentos'}
                {activeSection === 'team' && 'Gestão de Turma: Cadastro de contas e acessos para as turmas A, B, C, D'}
                {activeSection === 'notifications' && 'Página de transmissão de notificações e orientações gerais ou individuais'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onLogout}
              className="lg:hidden p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* CONTEÚDO PRINCIPAL RENDERIZADO CONFORME A ABA ATIVA */}
        <div className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">
          
          {/* ========================================================================= */}
          {/* TELA 1: 📊 DASHBOARD PRINCIPAL (EQUIPE DO DIA & ATENDIMENTOS) */}
          {/* ========================================================================= */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              
              {/* CARD DA EQUIPE DO DIA (TURNO ATIVO) */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 shadow-lg border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center font-black text-xl border border-emerald-500/40">
                    {currentActiveTurma}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                      {displayedShift?.turma ? (displayedShift.turma.toLowerCase().includes('turma') ? displayedShift.turma : `Turma ${displayedShift.turma}`) : `Turma ${currentActiveTurma}`}
                      {displayedShift?.status === 'ATIVO' ? (
                        <span className="text-[10px] font-black uppercase bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-mono">
                          TURNO ATIVO
                        </span>
                      ) : displayedShift ? (
                        <span className="text-[10px] font-black uppercase bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
                          TURNO ENCERRADO
                        </span>
                      ) : null}
                    </h2>
                    <p className="text-sm text-slate-300 mt-1">
                      Responsável / Colaborador: <strong className="text-emerald-300">{displayedShift?.responsavelNome || (getTechnicianForTurma(currentActiveTurma) || '-')}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs bg-slate-800/80 px-4 py-2.5 rounded-2xl border border-slate-700 font-mono">
                  <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                    <span>Início do Turno: <strong className="text-emerald-300 font-bold">{displayedHoraInicioTxt ? `${displayedHoraInicioTxt}h` : '-'}</strong></span>
                    {displayedShift?.horarioTurno && (
                      <span className="text-slate-400">({displayedShift.horarioTurno})</span>
                    )}
                  </div>
                </div>
              </div>

              {/* QUADRO KANBAN DE ATENDIMENTOS DA TURMA ATIVA NO DIA */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-100 pb-3 gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-200">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 leading-tight">
                        Quadro Kanban de Atendimentos — Turma {currentActiveTurma}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Acompanhamento em colunas: No Código, Em Andamento, Concluídos e Herdados
                      </p>
                    </div>
                  </div>

                  {/* BADGE DA TURMA ATIVA */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-xl border border-emerald-300">
                      Turma Ativa ({currentActiveTurma})
                    </span>
                    <span className="text-xs font-bold bg-indigo-100 text-indigo-900 px-3 py-1 rounded-xl border border-indigo-300">
                      {atendimentosDoDia.length} {atendimentosDoDia.length === 1 ? 'atividade' : 'atividades'}
                    </span>
                  </div>
                </div>

                <KanbanBoard
                  incidents={atendimentosDoDia}
                  onStatusChange={onStatusChange || (() => {})}
                  onPriorityChange={onPriorityChange || (() => {})}
                  onNoCodigoChange={onNoCodigoChange || (() => {})}
                  onDivisaoChange={onDivisaoChange}
                  onOpenWhatsapp={onOpenWhatsapp || (() => {})}
                  onOpenTimeline={onOpenTimeline}
                  onOpenEquipmentHistory={onOpenEquipmentHistory || (() => {})}
                  onOpenEditIncident={onOpenEditIncident || (() => {})}
                  onOpenCommentModal={onOpenCommentModal}
                  onDeleteIncident={onDeleteIncident}
                />
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TELA DA ABA RELATÓRIOS: 📊 RELATÓRIOS OPERACIONAIS & ESTATÍSTICAS */}
          {/* ========================================================================= */}
          {activeSection === 'reports' && (
            <div className="space-y-4">
              
              {/* BARRA DE FILTROS COMPACTA DO RELATÓRIO */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-sky-50 text-sky-600 rounded-xl border border-sky-200">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-900 leading-tight">
                        Filtros de Relatório & Análise Operacional
                      </h2>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Selecione o período, turma e parâmetros para otimizar os dados
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                      onClick={handleResetFilters}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-slate-200"
                      title="Limpar todos os filtros"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Limpar</span>
                    </button>

                    <button
                      onClick={handleExportCSV}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Exportar CSV</span>
                    </button>
                  </div>
                </div>

                {/* ATALHOS RÁPIDOS DE DATA INLINE */}
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
                      className="px-2.5 py-0.5 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 font-bold text-[11px] rounded-md transition-colors border border-slate-200 hover:border-sky-300 cursor-pointer"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* GRID DE FILTROS DROPDOWN COMPACTOS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">De</label>
                    <input
                      type="date"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Até</label>
                    <input
                      type="date"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Turma</label>
                    <select
                      value={reportTurmaFilter}
                      onChange={(e) => setReportTurmaFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-sky-500 cursor-pointer"
                    >
                      <option value="TODAS">Todas (A,B,C,D)</option>
                      <option value="A">Turma A</option>
                      <option value="B">Turma B</option>
                      <option value="C">Turma C</option>
                      <option value="D">Turma D</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Tipo de Falha</label>
                    <select
                      value={reportFalhaFilter}
                      onChange={(e) => setReportFalhaFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-sky-500 cursor-pointer"
                    >
                      <option value="TODAS">Todas as Falhas</option>
                      {availableFailureTypes.map((typeKey) => (
                        <option key={typeKey} value={typeKey}>
                          {typeKey}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Status</label>
                    <select
                      value={reportStatusFilter}
                      onChange={(e) => setReportStatusFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-sky-500 cursor-pointer"
                    >
                      <option value="TODOS">Todos Status</option>
                      <option value="FINALIZADO">Concluídos</option>
                      <option value="EM_ANDAMENTO">Em Andamento</option>
                      <option value="PENDENCIA_PROXIMO_TURNO">Pendência</option>
                      <option value="RETROAGIDO">Retroagido</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Buscar</label>
                    <div className="relative">
                      <Search className="w-3 h-3 absolute left-2 top-2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="TAG, equipamento..."
                        value={reportSearchTerm}
                        onChange={(e) => setReportSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-6 pr-2 py-1 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* KPIS RESUMO COMPACTOS (LINHA ÚNICA SLIM) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ocorrências</span>
                    <span className="text-xl font-black text-slate-900 leading-none">{reportFilteredIncidents.length}</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Filtradas</span>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Horas Paradas</span>
                    <span className="text-xl font-black text-amber-600 leading-none font-mono">⏱️ {grandTotalHoursFormatted}</span>
                  </div>
                  <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Total</span>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tempo Médio (MTTR)</span>
                    <span className="text-xl font-black text-sky-600 leading-none font-mono">{avgReportDurationFormatted}</span>
                  </div>
                  <span className="text-[10px] font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">Média</span>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Taxa de Resolução</span>
                    <span className="text-xl font-black text-emerald-600 leading-none">
                      {reportFilteredIncidents.length > 0
                        ? Math.round((reportFilteredIncidents.filter((i) => i.status === 'FINALIZADO' || i.status === 'RETROAGIDO').length / reportFilteredIncidents.length) * 100)
                        : 0}%
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Concluídos</span>
                </div>
              </div>

              {/* LAYOUT LADO A LADO: GRÁFICO (ESQUERDA) + DESEMPENHO TURMAS & TOP TAGS (DIREITA) */}
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

                    {/* Seletor de Modo de Gráfico */}
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
                              {/* SVG Donut Chart */}
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

                              {/* Legenda compacta sem rolagem */}
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

                {/* COLUNA DIREITA: DESEMPENHO TURMAS & TOP TAGS PARADAS */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-black text-slate-900 leading-tight">
                        Desempenho das Turmas & TAGs
                      </h3>
                    </div>
                  </div>

                  {/* Resumo por Turma Slim */}
                  <div className="grid grid-cols-2 gap-2">
                    {['A', 'B', 'C', 'D'].map((letra) => {
                      const stats = getTurmaStats(letra);
                      return (
                        <div key={letra} className="bg-slate-50 p-2 rounded-xl border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">
                              Turma {letra}
                            </span>
                            <span className="text-sky-600 font-extrabold">{stats.taxa}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-sky-500 h-full rounded-full" style={{ width: `${stats.taxa}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Top TAGs paradas */}
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Maior Paralisação por TAG</span>
                    {sortedEquipments.slice(0, 3).map((eq) => (
                      <div key={eq.tag} className="flex items-center justify-between text-[11px] bg-slate-50 px-2 py-1 rounded border border-slate-200 font-bold">
                        <span className="font-mono text-slate-900">{eq.tag}</span>
                        <span className="font-mono text-rose-700">⏱️ {eq.totalFormatted}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* TABELA COMPLETA DE HISTÓRICO NO PERÍODO (ALTURA CONTROLADA COM SCROLL) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        Histórico de Atendimentos Detalhado
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {reportFilteredIncidents.length} registro(s) no relatório
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 min-h-[180px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-2.5">TAG / Equipamento</th>
                        <th className="px-3 py-2.5">Falha</th>
                        <th className="px-3 py-2.5">Turma</th>
                        <th className="px-3 py-2.5">Responsável</th>
                        <th className="px-3 py-2.5">Duração</th>
                        <th className="px-3 py-2.5">Status</th>
                        <th className="px-3 py-2.5 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportFilteredIncidents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-xs font-bold text-slate-400">
                            Nenhum atendimento encontrado para os filtros selecionados.
                          </td>
                        </tr>
                      ) : (
                        paginatedReportIncidents.map((item) => {
                          const start = new Date(item.dataHoraParada || item.criadoEm);
                          const end = item.dataHoraLiberacao ? new Date(item.dataHoraLiberacao) : new Date();
                          const mins = Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60)));
                          const durationFormatted = `${Math.floor(mins / 60)}h ${mins % 60}m`;

                          return (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-3 py-2 align-top">
                                <span className="font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-900 block w-fit mb-0.5">
                                  {item.tag}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium line-clamp-1">{item.equipamentoNome}</span>
                              </td>
                              <td className="px-3 py-2 align-top font-bold text-slate-900">{item.falha}</td>
                              <td className="px-3 py-2 align-top font-bold">
                                <span className="bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded border border-sky-200 text-[11px]">
                                  Turma {item.turma || 'A'}
                                </span>
                              </td>
                              <td className="px-3 py-2 align-top text-slate-600 font-medium">{item.responsavel}</td>
                              <td className="px-3 py-2 align-top font-mono font-bold text-slate-700">{durationFormatted}</td>
                              <td className="px-3 py-2 align-top font-bold text-[11px]">
                                {item.status === 'FINALIZADO' && <span className="text-emerald-600">🟢 Concluído</span>}
                                {item.status === 'EM_ANDAMENTO' && <span className="text-sky-600">🔵 Em Andamento</span>}
                                {item.status === 'PENDENCIA_PROXIMO_TURNO' && <span className="text-amber-600">🟠 Pendência</span>}
                                {item.status === 'AGUARDANDO' && <span className="text-purple-600">🟣 Aguardando</span>}
                                {item.status === 'RETROAGIDO' && <span className="text-slate-500">⚪ Retroagido</span>}
                              </td>
                              <td className="px-3 py-2 align-top text-right">
                                <button
                                  onClick={() => onOpenTimeline(item)}
                                  className="px-2 py-0.5 bg-white hover:bg-sky-50 text-sky-700 border border-slate-200 hover:border-sky-300 font-bold text-[10px] rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <History className="w-3 h-3 text-sky-600" />
                                  <span>Detalhes</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* CONTROLE DE PAGINAÇÃO DA TABELA */}
                <div className="flex flex-col sm:flex-row items-center justify-between pt-2.5 border-t border-slate-100 gap-3 text-xs">
                  <div className="flex items-center space-x-3 text-slate-500 font-medium">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[11px] font-bold text-slate-600">Exibir:</span>
                      <select
                        value={reportItemsPerPage}
                        onChange={(e) => {
                          setReportItemsPerPage(Number(e.target.value));
                          setReportPage(1);
                        }}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white cursor-pointer"
                      >
                        <option value={5}>5 por página</option>
                        <option value={10}>10 por página</option>
                        <option value={15}>15 por página</option>
                        <option value={25}>25 por página</option>
                        <option value={50}>50 por página</option>
                      </select>
                    </div>

                    <span>
                      Exibindo <strong className="text-slate-900 font-black">{reportFilteredIncidents.length > 0 ? reportStartIndex + 1 : 0}-{reportEndIndex}</strong> de <strong className="text-slate-900 font-black">{reportFilteredIncidents.length}</strong> registros
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setReportPage(1)}
                      disabled={currentReportPage === 1}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      title="Primeira Página"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setReportPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentReportPage === 1}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      ‹ Anterior
                    </button>

                    {Array.from({ length: totalReportPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalReportPages || Math.abs(p - currentReportPage) <= 1)
                      .reduce<(number | string)[]>((acc, page, idx, array) => {
                        if (idx > 0 && page - (array[idx - 1] as number) > 1) {
                          acc.push('...');
                        }
                        acc.push(page);
                        return acc;
                      }, [])
                      .map((item, index) => {
                        if (item === '...') {
                          return <span key={`ellipsis-${index}`} className="px-1 text-slate-400 font-bold">...</span>;
                        }

                        const isCurrent = item === currentReportPage;
                        return (
                          <button
                            key={item}
                            onClick={() => setReportPage(Number(item))}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {item}
                          </button>
                        );
                      })}

                    <button
                      onClick={() => setReportPage((prev) => Math.min(prev + 1, totalReportPages))}
                      disabled={currentReportPage === totalReportPages || totalReportPages === 0}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Próximo ›
                    </button>
                    <button
                      onClick={() => setReportPage(totalReportPages)}
                      disabled={currentReportPage === totalReportPages || totalReportPages === 0}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      title="Última Página"
                    >
                      »
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TELA 2: 👥 GESTÃO DAS TURMAS & CONFIGURAÇÃO DA EQUIPE (CRIAR ACESSOS) */}
          {/* ========================================================================= */}
          {activeSection === 'team' && (
            <div className="space-y-6">
              
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-200">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900">
                        Gestão de Turma
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        O Líder cria e gerencia os acessos para os integrantes das letras A, B, C e D.
                      </p>
                    </div>
                  </div>
                </div>

                {userCreatedMsg && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" />
                    <span>{userCreatedMsg}</span>
                  </div>
                )}

                {/* FORMULÁRIO DE CRIAR CONTA PARA AS TURMAS */}
                <form onSubmit={handleCreateOperatorAccount} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-amber-500" />
                    <span>Cadastrar Novo Operador / Integrante da Turma</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Nome Completo</label>
                      <input
                        type="text"
                        placeholder="Ex: Carlos Silva"
                        value={newOpNome}
                        onChange={(e) => setNewOpNome(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Matrícula de Acesso</label>
                      <input
                        type="text"
                        placeholder="Ex: 1005"
                        value={newOpMatricula}
                        onChange={(e) => setNewOpMatricula(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Letra da Turma</label>
                      <select
                        value={newOpTurma}
                        onChange={(e) => setNewOpTurma(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="A">🅰️ Turma A</option>
                        <option value="B">🅱️ Turma B</option>
                        <option value="C">🅲 Turma C</option>
                        <option value="D">🅳 Turma D</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Senha Inicial</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newOpSenha}
                        onChange={(e) => setNewOpSenha(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="text-right pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Cadastrar Conta de Operador</span>
                    </button>
                  </div>
                </form>

                {/* TABELA DE CONTAS CADASTRADAS */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Contas Cadastradas das Turmas ({userList.length})
                  </h3>

                  <div className="rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Técnico / Responsável do Turno</th>
                          <th className="px-4 py-3">E-mail de Login</th>
                          <th className="px-4 py-3">Turma</th>
                          <th className="px-4 py-3">Senha</th>
                          <th className="px-4 py-3 text-right">Gerenciamento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {userList.map((u) => {
                          // Buscar o nome configurado pelo técnico no turno ativo ou nos atendimentos
                          const turmaKey = (u.turma || '').toUpperCase().trim();
                          let techName = u.nome;

                          if (activeShift && (activeShift.turma || 'A').toUpperCase().trim() === turmaKey && activeShift.responsavelNome) {
                            techName = activeShift.responsavelNome;
                          } else {
                            const lastTechIncident = incidents.find(
                              (i) => (i.turma || 'A').toUpperCase().trim() === turmaKey && i.responsavel && !i.responsavel.toLowerCase().startsWith('operador')
                            );
                            if (lastTechIncident) {
                              techName = lastTechIncident.responsavel;
                            }
                          }

                          return (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                                  <span>{techName}</span>
                                </div>
                                {techName !== u.nome && (
                                  <span className="text-[10px] text-slate-400 font-medium block ml-5">
                                    Conta: {u.nome}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-slate-500 font-mono">{u.email}</td>
                              <td className="px-4 py-3">
                                <span className="font-mono bg-sky-100 text-sky-800 px-2.5 py-1 rounded font-black text-[11px]">
                                  Turma {u.turma}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-mono text-slate-500 font-bold">•••••• ({u.senha})</td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => handleOpenEditUser(u)}
                                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] rounded-xl border border-amber-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                                >
                                  ✏️ Editar Login / Senha
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* MODAL DE EDIÇÃO DE CONTA DO OPERADOR / LÍDER */}
              {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
                  <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-8 border border-slate-200 animate-fadeIn text-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                          <UserPlus className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900">
                            Editar Credenciais da Conta ({editingUser.nome})
                          </h3>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Altere o e-mail, matrícula, senha ou turno da equipe.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setEditingUser(null)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveEditUser} className="space-y-3 text-xs">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Nome Completo</label>
                        <input
                          type="text"
                          value={editNome}
                          onChange={(e) => setEditNome(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Matrícula</label>
                          <input
                            type="text"
                            value={editMatricula}
                            onChange={(e) => setEditMatricula(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold"
                            required
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Senha de Acesso</label>
                          <input
                            type="text"
                            value={editSenha}
                            onChange={(e) => setEditSenha(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">E-mail de Login</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Turma / Letra</label>
                          <select
                            value={editTurma}
                            onChange={(e) => setEditTurma(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900"
                          >
                            <option value="GERAL">👑 Líder / Geral</option>
                            <option value="A">🅰️ Turma A</option>
                            <option value="B">🅱️ Turma B</option>
                            <option value="C">🅲 Turma C</option>
                            <option value="D">🅳 Turma D</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Horário do Turno</label>
                          <input
                            type="text"
                            value={editHorario}
                            onChange={(e) => setEditHorario(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
                            placeholder="07:00 às 19:00"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Escala (ex: 3x3)</label>
                          <input
                            type="text"
                            value={editEscala}
                            onChange={(e) => setEditEscala(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
                            placeholder="3x3"
                            required
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Dia do Turno</label>
                          <select
                            value={editDiaEscala}
                            onChange={(e) => setEditDiaEscala(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
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

                      <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingUser(null)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-xs"
                        >
                          Salvar Alterações
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* TELA 3: 📣 PÁGINA DE NOTIFICAÇÕES & COMUNICAÇÃO DIRETA COM AS TURMAS */}
          {/* ========================================================================= */}
          {activeSection === 'notifications' && (
            <div className="space-y-6">
              
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
                <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 bg-sky-500/10 text-sky-600 rounded-2xl flex items-center justify-center border border-sky-200">
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      Página de Notificações e Transmissão de Avisos
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Envie orientações gerais para o mural ou mensagens individuais para cada letra.
                    </p>
                  </div>
                </div>

                {/* FORMULÁRIO DE ENVIO DE MENSAGENS */}
                <form onSubmit={handleSendLeaderMessage} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Filter className="w-4 h-4 text-amber-500" />
                      <span>Selecione a Turma Destinatária:</span>
                    </label>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setTargetTurmaChannel('GERAL')}
                        className={`px-3.5 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                          targetTurmaChannel === 'GERAL'
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        📢 MURAL GERAL (TODAS)
                      </button>

                      {['A', 'B', 'C', 'D'].map((letra) => (
                        <button
                          key={letra}
                          type="button"
                          onClick={() => setTargetTurmaChannel(letra)}
                          className={`px-3.5 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                            targetTurmaChannel === letra
                              ? 'bg-sky-600 text-white shadow-xs'
                              : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          TURMA {letra}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={`Digite o aviso ou orientação para ${targetTurmaChannel === 'GERAL' ? 'Todas as Turmas' : `Turma ${targetTurmaChannel}`}...`}
                      value={msgInput}
                      onChange={(e) => setMsgInput(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 font-medium shadow-2xs"
                    />
                    <button
                      type="submit"
                      disabled={!msgInput.trim()}
                      className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Enviar Notificação</span>
                    </button>
                  </div>
                </form>

                {/* HISTÓRICO DAS MENSAGENS TRANSMITIDAS */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Histórico de Notificações Enviadas ({messages.length})
                  </h3>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                          m.targetTurma === 'GERAL'
                            ? 'bg-amber-50/80 border-amber-200'
                            : 'bg-sky-50/80 border-sky-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-amber-500" />
                            {m.sender} ➔ <strong className="uppercase bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">Para: {m.targetTurma === 'GERAL' ? 'Mural Geral' : `Turma ${m.targetTurma}`}</strong>
                          </span>
                          <span className="font-mono text-slate-500 font-medium">
                            {m.timestamp ? (() => { const d = new Date(m.timestamp); return isNaN(d.getTime()) ? '' : format(d, 'dd/MM/yyyy HH:mm'); })() : ''}
                          </span>
                        </div>
                        <p className="text-slate-800 font-medium leading-relaxed">
                          {m.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RESPOSTAS DAS TURMAS */}
                {operatorReplies.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-500" />
                      Respostas das Turmas ({operatorReplies.length})
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {operatorReplies
                        .slice()
                        .sort((a, b) => {
                          const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                          const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                          return tb - ta;
                        })
                        .map((r) => (
                          <div key={r.id} className="flex items-start gap-3 p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs">
                            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-[10px] font-black">{r.fromTurma}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="font-bold text-slate-800 text-[11px]">{r.sender}</span>
                                <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                                  {r.timestamp ? (() => { const d = new Date(r.timestamp); return isNaN(d.getTime()) ? '' : format(d, 'dd/MM HH:mm'); })() : ''}
                                </span>
                              </div>
                              <p className="text-slate-700 leading-relaxed">{r.text}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
