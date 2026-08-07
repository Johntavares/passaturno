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
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { ChatMessage } from './LiderTurmaModal';
import { OperatorReply } from './LeaderMessageNotification';

interface LiderDashboardViewProps {
  incidents: IncidentType[];
  activeShift: ShiftType | null;
  currentUser: any;
  onLogout: () => void;
  onOpenTimeline: (incident: IncidentType) => void;
  onOpenCommentModal: (incident: IncidentType) => void;
  onDeleteIncident: (id: string) => void;
}

export const LiderDashboardView: React.FC<LiderDashboardViewProps> = ({
  incidents,
  activeShift,
  currentUser,
  onLogout,
  onOpenTimeline,
  onOpenCommentModal,
  onDeleteIncident,
}) => {
  // Navegação Lateral do Menu
  const [activeSection, setActiveSection] = useState<'dashboard' | 'team' | 'history' | 'notifications' | 'alerts'>('dashboard');

  // Filtros da Seção de Histórico
  const [historyTurmaTab, setHistoryTurmaTab] = useState<string>('TODAS');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('TODOS');
  const [historySearchTerm, setHistorySearchTerm] = useState<string>('');

  // Gestão de Usuários / Contas
  const [userList, setUserList] = useState<any[]>([]);
  const [newOpNome, setNewOpNome] = useState('');
  const [newOpMatricula, setNewOpMatricula] = useState('');
  const [newOpTurma, setNewOpTurma] = useState('A');
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

  // Estatísticas
  const totalIncidents = incidents.length;
  const concluidosCount = incidents.filter((i) => i.status === 'FINALIZADO' || i.status === 'RETROAGIDO').length;
  const pendenciasCount = incidents.filter((i) => i.status === 'PENDENCIA_PROXIMO_TURNO' || i.isPendenciaHerdada).length;
  const urgentesCount = incidents.filter(
    (i) => i.prioridade === 'CRITICA' || i.status === 'PENDENCIA_PROXIMO_TURNO' || i.isPendenciaHerdada
  ).length;

  const priorityAlerts = incidents.filter(
    (i) =>
      i.status === 'PENDENCIA_PROXIMO_TURNO' ||
      i.isPendenciaHerdada ||
      i.prioridade === 'CRITICA' ||
      i.prioridade === 'ALTA'
  );

  const currentActiveTurma = activeShift?.turma?.replace('Turma ', '')?.replace('TURMA ', '')?.trim() || 'A';
  
  const delayedAssets = incidents.filter(i => {
    const iTurma = (i.turma || '').toUpperCase().trim();
    if (iTurma !== currentActiveTurma) return false;
    if (i.status !== 'EM_ANDAMENTO') return false;
    
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

  // Histórico Filtrado
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

          {/* Logo */}
          <div className="pb-4 border-b border-slate-100">
            <img
              src="/logo.png"
              alt="PASSATURNO"
              className="h-14 w-auto object-contain"
            />
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
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'team',      label: 'Gestão de Turma', icon: Users },
              { id: 'history',   label: 'Histórico', icon: History },
              { id: 'notifications', label: 'Notificações', icon: Megaphone },
              { id: 'alerts',    label: 'Alertas Críticos', icon: AlertTriangle, badge: urgentesCount },
            ].map(({ id, label, icon: Icon, badge }) => (
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
                {badge != null && badge > 0 && (
                  <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                    {badge}
                  </span>
                )}
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
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Painel da Liderança — <span className="text-emerald-600">{currentUser?.nome || 'Líder da Turma'}</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {activeSection === 'dashboard' && 'Visão geral da equipe do dia, estatísticas e passagem de bastão'}
              {activeSection === 'team' && 'Gestão de Turma: Cadastro de contas e acessos para as turmas A, B, C, D'}
              {activeSection === 'history' && 'Histórico completo de atendimentos separado por letra (Turma A, B, C, D)'}
              {activeSection === 'notifications' && 'Página de transmissão de notificações e orientações gerais ou individuais'}
              {activeSection === 'alerts' && 'Ativos críticos e ocorrências pendentes na troca de turno'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              {currentTime}
            </span>

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
                    {activeShift?.turma ? activeShift.turma.replace('Turma ', '').replace('TURMA ', '') : '-'}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                      {activeShift?.turma ? (activeShift.turma.toLowerCase().includes('turma') ? activeShift.turma : `Turma ${activeShift.turma}`) : 'Sem Turno Iniciado'}
                      {activeShift && (
                        <span className="text-[10px] font-black uppercase bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-mono">
                          ATIVO
                        </span>
                      )}
                    </h2>
                    <p className="text-sm text-slate-300 mt-1">
                      Colaborador: <strong className="text-emerald-300">{activeShift?.responsavelNome || '-'}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs bg-slate-800/80 px-4 py-2.5 rounded-2xl border border-slate-700 font-mono">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Horário: {activeShift?.horarioTurno || '-'}</span>
                </div>
              </div>

              {/* ATIVOS COM MAIS DE 2 HORAS EM ANDAMENTO */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-200">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Ativos com mais de 2 horas em atendimento
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Ocorrências em andamento prolongado da Turma {currentActiveTurma}
                    </p>
                  </div>
                </div>

                {delayedAssets.length === 0 ? (
                  <div className="py-6 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                    🟢 Nenhum ativo da sua turma ultrapassou 2 horas em andamento.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {delayedAssets.map(item => {
                      const start = new Date(item.criadoEm);
                      const now = new Date();
                      const diffHours = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60));
                      const diffMinutes = Math.floor(((now.getTime() - start.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
                      
                      return (
                        <div key={item.id} className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2 relative overflow-hidden">
                          <div className="absolute top-0 right-0 bg-rose-600 text-white text-[10px] font-black px-2 py-1 rounded-bl-lg">
                            {diffHours}h {diffMinutes}m
                          </div>
                          <div className="font-mono text-sm font-black text-rose-900">{item.tag}</div>
                          <div className="text-xs font-bold text-slate-800 line-clamp-2">{item.falha}</div>
                          <div className="text-[10px] font-medium text-slate-600">Resp: {item.responsavel}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* GRID: TABELA DE BASTÃO + RESUMO DAS TURMAS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* CARD PRINCIPAL: ATIVOS EM ALERTA & PASSAGEM DE BASTÃO */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900 leading-tight">
                            Ativos em Alerta & Passagem de Bastão
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            Ocorrências pendentes e prioridades repassadas entre turmas
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
                        {priorityAlerts.length} {priorityAlerts.length === 1 ? 'ativo em atenção' : 'ativos em atenção'}
                      </span>
                    </div>

                    {priorityAlerts.length === 0 ? (
                      <div className="py-8 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        🟢 Nenhum ativo pendente na passagem de bastão.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {priorityAlerts.map((item) => {
                          const turmaOrigem = item.turma || 'A';
                          const turmaDestino = getTurmaDestino(turmaOrigem);
                          const isCampo = item.divisaoAtuacao === 'CORRETIVA_CAMPO';

                          return (
                            <div
                              key={item.id}
                              className="flex flex-col md:flex-row items-start md:items-center justify-between bg-amber-50/60 hover:bg-amber-50 border border-amber-200/80 rounded-2xl p-3 transition-all gap-2.5 shadow-2xs"
                            >
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
                                <span className="font-mono text-xs font-black bg-white text-slate-900 px-2 py-0.5 rounded-md border border-slate-300 shadow-2xs">
                                  {item.tag}
                                </span>

                                <span className="text-xs font-bold text-slate-900 truncate max-w-[220px]" title={item.equipamentoNome}>
                                  {item.equipamentoNome}
                                </span>

                                <span className="text-xs font-extrabold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300/80">
                                  {item.falha}
                                </span>

                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                  isCampo
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : 'bg-cyan-100 text-cyan-900 border-cyan-300'
                                }`}>
                                  {isCampo ? '🔧 Campo' : '📺 NOC'}
                                </span>

                                <span className="text-[10px] font-extrabold bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                                  Turma {turmaOrigem} ➔ {turmaDestino.startsWith('Turma') ? turmaDestino : `Turma ${turmaDestino}`}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
                                <button
                                  onClick={() => onOpenTimeline(item)}
                                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                                  title="Clique para ver o histórico e as anotações completas na Linha do Tempo"
                                >
                                  <History className="w-3.5 h-3.5" />
                                  <span>Linha do Tempo / Histórico</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    )}
                  </div>

                  {/* CARD DE ATENDIMENTOS DO DIA COM BOTÕES DE DETALHE */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
                    <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-200">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">
                          Atendimentos do Dia
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">Resumo dos status e acompanhamento de ocorrências</p>
                      </div>
                    </div>

                    <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {incidents.length === 0 ? (
                        <div className="py-6 text-center text-xs font-bold text-slate-400">
                          Nenhum atendimento registrado hoje.
                        </div>
                      ) : (
                        incidents.slice(0, 15).map(item => (
                          <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors gap-2">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-black bg-white text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                                {item.tag}
                              </span>
                              <div>
                                <p className="text-xs font-bold text-slate-800">{item.falha}</p>
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Resp: {item.responsavel} • Turma {item.turma || 'A'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wide border ${
                                item.status === 'FINALIZADO' || item.status === 'RETROAGIDO'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : item.status === 'EM_ANDAMENTO'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {item.status.replace(/_/g, ' ')}
                              </span>

                              <button
                                onClick={() => onOpenTimeline(item)}
                                className="px-2.5 py-1 bg-white hover:bg-sky-50 text-sky-700 border border-slate-200 hover:border-sky-300 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                title="Ver linha do tempo da atividade"
                              >
                                <History className="w-3 h-3 text-sky-600" />
                                <span>Detalhes</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-200">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900">
                            Desempenho das Turmas
                          </h3>
                          <p className="text-[11px] text-slate-500 font-medium">Resolução por letra (A, B, C, D)</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {['A', 'B', 'C', 'D'].map((letra) => {
                        const stats = getTurmaStats(letra);
                        return (
                          <div key={letra} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="font-mono bg-white px-2.5 py-0.5 rounded border border-slate-200 text-slate-800">
                                TURMA {letra}
                              </span>
                              <span className="text-sky-600 font-extrabold">{stats.taxa}% Resolução</span>
                            </div>

                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-sky-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${stats.taxa}%` }}
                              />
                            </div>

                            <div className="flex justify-between text-[11px] text-slate-500 font-medium pt-1">
                              <span>Total: <strong>{stats.total}</strong></span>
                              <span>Concluídos: <strong className="text-emerald-600">{stats.concluidos}</strong></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
                          <th className="px-4 py-3">Nome / Operador</th>
                          <th className="px-4 py-3">Matrícula</th>
                          <th className="px-4 py-3">E-mail</th>
                          <th className="px-4 py-3">Turma</th>
                          <th className="px-4 py-3">Senha</th>
                          <th className="px-4 py-3 text-right">Gerenciamento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {userList.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-bold text-slate-900">{u.nome}</td>
                            <td className="px-4 py-3 font-mono text-slate-700 font-bold">{u.matricula}</td>
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
                        ))}
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
                            placeholder="07:00 às 19:00"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                          />
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
          {/* TELA 3: 📜 HISTÓRICO DE ATENDIMENTOS SEPARADO POR TURMA */}
          {/* ========================================================================= */}
          {activeSection === 'history' && (
            <div className="space-y-6">
              
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-sky-500/10 text-sky-600 rounded-2xl flex items-center justify-center border border-sky-200">
                      <History className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900">
                        Histórico de Atendimentos Separado por Turma
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Selecione a aba da letra para auditar as ocorrências e observações registradas.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    <span>Exportar Relatório CSV</span>
                  </button>
                </div>

                {/* NAVEGAÇÃO POR ABAS DAS TURMAS (A, B, C, D) */}
                <div className="flex items-center gap-2 flex-wrap border-b border-slate-100 pb-3">
                  <button
                    onClick={() => setHistoryTurmaTab('TODAS')}
                    className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                      historyTurmaTab === 'TODAS'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    🌐 TODAS AS TURMAS
                  </button>

                  {['A', 'B', 'C', 'D'].map((letra) => (
                    <button
                      key={letra}
                      onClick={() => setHistoryTurmaTab(letra)}
                      className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                        historyTurmaTab === letra
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      TURMA {letra}
                    </button>
                  ))}
                </div>

                {/* BARRA DE FILTROS DE PESQUISA E STATUS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por TAG, equipamento, falha ou responsável..."
                      value={historySearchTerm}
                      onChange={(e) => setHistorySearchTerm(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 font-medium"
                    />
                  </div>

                  <div>
                    <select
                      value={historyStatusFilter}
                      onChange={(e) => setHistoryStatusFilter(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer"
                    >
                      <option value="TODOS">Todos os Status</option>
                      <option value="FINALIZADO">🟢 Concluídos</option>
                      <option value="EM_ANDAMENTO">🔴 Em Andamento</option>
                      <option value="AGUARDANDO">🟡 Aguardando</option>
                      <option value="PENDENCIA_PROXIMO_TURNO">🔵 Pendências Herdadas</option>
                    </select>
                  </div>
                </div>

                {/* TABELA DE AUDITORIA DO HISTÓRICO */}
                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">TAG / Equipamento</th>
                        <th className="px-4 py-3">Turma Origem ➔ Assumir</th>
                        <th className="px-4 py-3">Falha & Solução</th>
                        <th className="px-4 py-3">Anotações do Turno</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredHistory.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                            Nenhum atendimento registrado nesta turma com os filtros selecionados.
                          </td>
                        </tr>
                      ) : (
                        filteredHistory.map((item) => {
                          const turmaOrigem = item.turma || 'A';
                          const turmaDestino = getTurmaDestino(turmaOrigem);
                          return (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 font-bold align-top">
                                <div className="flex items-center space-x-2">
                                  <span className="font-mono bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-black text-[11px]">
                                    {item.tag}
                                  </span>
                                  <span className="text-slate-900">{item.equipamentoNome}</span>
                                </div>
                              </td>

                              <td className="px-4 py-3 font-bold align-top">
                                <div className="text-xs text-amber-600 flex items-center gap-1">
                                  <span>Turma {turmaOrigem}</span>
                                  <ArrowRight className="w-3 h-3 text-slate-400" />
                                  <span className="text-sky-600 font-extrabold">{turmaDestino}</span>
                                </div>
                              </td>

                              <td className="px-4 py-3 align-top max-w-[260px]">
                                <div className="font-bold text-slate-800">{item.falha}</div>
                                {item.solucao && (
                                  <div className="mt-1 bg-emerald-50 text-emerald-800 p-1.5 rounded-lg border border-emerald-200 text-[11px]">
                                    <strong>Solução:</strong> {item.solucao}
                                  </div>
                                )}
                              </td>

                              <td className="px-4 py-3 align-top max-w-[220px]">
                                {item.observacao ? (
                                  <div className="bg-amber-50 text-amber-800 p-1.5 rounded-lg border border-amber-200 text-[11px] font-medium">
                                    💬 {item.observacao}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">Sem anotações</span>
                                )}
                              </td>

                              <td className="px-4 py-3 font-bold align-top">
                                {item.status === 'FINALIZADO' && <span className="text-emerald-600">🟢 Concluído</span>}
                                {item.status === 'EM_ANDAMENTO' && <span className="text-rose-600">🔴 Em Andamento</span>}
                                {item.status === 'AGUARDANDO' && <span className="text-amber-600">🟡 Aguardando</span>}
                                {item.status === 'PENDENCIA_PROXIMO_TURNO' && <span className="text-sky-600">🔵 Pendência Herdada</span>}
                              </td>

                              <td className="px-4 py-3 align-top text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => onOpenCommentModal(item)}
                                    title="Adicionar anotação do líder"
                                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                  >
                                    <MessageSquare className="w-3 h-3 text-amber-700" />
                                    <span>Anotar</span>
                                  </button>

                                  <button
                                    onClick={() => onOpenTimeline(item)}
                                    title="Linha do Tempo e Histórico do Atendimento"
                                    className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                                  >
                                    <History className="w-3 h-3" />
                                    <span>Linha do Tempo</span>
                                  </button>
                                </div>
                              </td>

                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TELA 4: 📣 PÁGINA DE NOTIFICAÇÕES & COMUNICAÇÃO DIRETA COM AS TURMAS */}
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

          {/* ========================================================================= */}
          {/* TELA 5: 🚨 ALERTAS CRÍTICOS & PASSAGEM DE BASTÃO */}
          {/* ========================================================================= */}
          {activeSection === 'alerts' && (
            <div className="space-y-6">
              
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
                <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 bg-rose-500/10 text-rose-600 rounded-2xl flex items-center justify-center border border-rose-200">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      Alertas Críticos & Ativos em Atenção
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Ocorrências com prioridade crítica e trocas de turno pendentes.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {priorityAlerts.map((item) => {
                    const turmaOrigem = item.turma || 'A';
                    const turmaDestino = getTurmaDestino(turmaOrigem);
                    return (
                      <div
                        key={item.id}
                        className="bg-slate-50 border border-slate-200 hover:border-rose-300 rounded-2xl p-4 shadow-2xs space-y-3 transition-all"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <span className="font-mono text-xs font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                            {item.tag}
                          </span>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                            {item.prioridade}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm font-black text-slate-900">{item.equipamentoNome}</h3>
                          <p className="text-xs text-slate-600 mt-1 font-medium">{item.falha}</p>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-bold">
                          <div className="text-amber-600">Turma {turmaOrigem}</div>
                          <ArrowRight className="w-4 h-4 text-slate-400" />
                          <div className="text-sky-600">{turmaDestino}</div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                          <span className="text-slate-500 font-medium">{item.responsavel}</span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => onOpenCommentModal(item)}
                              className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onOpenTimeline(item)}
                              className="p-1.5 bg-sky-100 hover:bg-sky-200 text-sky-700 rounded-lg cursor-pointer"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
