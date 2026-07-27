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
  FolderOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { userStore, StoredUser } from '@/lib/userStore';
import { ChatMessage } from './LiderTurmaModal';

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
  const [userList, setUserList] = useState<StoredUser[]>([]);
  const [newOpNome, setNewOpNome] = useState('');
  const [newOpMatricula, setNewOpMatricula] = useState('');
  const [newOpTurma, setNewOpTurma] = useState('A');
  const [newOpSenha, setNewOpSenha] = useState('passaturno2026');
  const [userCreatedMsg, setUserCreatedMsg] = useState('');

  // Notificações / Chat State
  const [targetTurmaChannel, setTargetTurmaChannel] = useState<string>('GERAL');
  const [msgInput, setMsgInput] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Time clock
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    setUserList(userStore.getUsers());
  }, []);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy • HH:mm:ss"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Carregar mensagens enviadas
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('passaturno-leader-chat-v1');
        if (saved) {
          setMessages(JSON.parse(saved));
        } else {
          const defaultMsgs: ChatMessage[] = [
            {
              id: 'msg-1',
              sender: 'Líder da Turma',
              targetTurma: 'GERAL',
              text: '📢 Orientação da Liderança: Atenção especial na conferência das pendências de automação ao trocar de turno.',
              timestamp: new Date().toISOString(),
            },
          ];
          setMessages(defaultMsgs);
          localStorage.setItem('passaturno-leader-chat-v1', JSON.stringify(defaultMsgs));
        }
      } catch (e) {
        console.error('Erro ao ler mensagens:', e);
      }
    }
  }, []);

  const handleSendLeaderMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: currentUser?.nome || 'Líder da Turma',
      targetTurma: targetTurmaChannel,
      text: msgInput.trim(),
      timestamp: new Date().toISOString(),
    };

    const updated = [newMsg, ...messages];
    setMessages(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('passaturno-leader-chat-v1', JSON.stringify(updated));
      } catch (e) {
        console.error('Erro ao guardar mensagem do líder:', e);
      }
    }
    setMsgInput('');
  };

  const handleCreateOperatorAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpNome.trim() || !newOpMatricula.trim() || !newOpSenha.trim()) return;

    userStore.addUser({
      nome: newOpNome.trim(),
      matricula: newOpMatricula.trim(),
      email: `turma.${newOpTurma.toLowerCase()}.${newOpMatricula.trim()}@passaturno.com`,
      senha: newOpSenha.trim(),
      equipe: `Automação & CCO (Turma ${newOpTurma})`,
      cargo: `Técnico de Automação (Turma ${newOpTurma})`,
      turma: newOpTurma,
      criadoPor: currentUser?.nome || 'Líder da Turma',
    });

    setUserList(userStore.getUsers());
    setUserCreatedMsg(`Conta da Turma ${newOpTurma} criada com sucesso para ${newOpNome.trim()}! (Matrícula: ${newOpMatricula.trim()})`);
    setNewOpNome('');
    setNewOpMatricula('');
    setNewOpSenha('passaturno2026');
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
      
      {/* 1. ULTRA-MODERN EXECUTIVE GLASSMORPHIC SIDEBAR */}
      <aside className="w-72 bg-[#0f172a] text-slate-300 flex flex-col justify-between hidden lg:flex flex-shrink-0 min-h-screen shadow-2xl border-r border-slate-800/80 relative z-30">
        <div className="p-5 space-y-6">
          
          {/* Logo & Brand Header */}
          <div className="flex items-center space-x-3 pb-5 border-b border-slate-800/80">
            <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-emerald-500/25 border border-emerald-400/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight leading-none">
                PASSA<span className="text-emerald-400 font-black">TURNO</span>
              </h2>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mt-1">
                Portal da Liderança
              </span>
            </div>
          </div>

          {/* User Profile Box */}
          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 shadow-inner flex items-center space-x-3 relative overflow-hidden group">
            <div className="relative w-10 h-10 bg-gradient-to-tr from-amber-500 to-emerald-500 text-slate-950 rounded-xl flex items-center justify-center font-black shadow-md flex-shrink-0">
              <User className="w-5 h-5 text-slate-950" />
              <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-900"></span>
              </span>
            </div>
            <div className="truncate">
              <div className="text-xs font-black text-white truncate group-hover:text-emerald-400 transition-colors">
                {currentUser?.nome || 'Líder da Turma'}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] uppercase font-mono font-black bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                  {currentUser?.cargo || 'LÍDER DE TURMA'}
                </span>
              </div>
            </div>
          </div>

          {/* MENU LATERAL DE NAVEGAÇÃO EXECUTIVA (5 TELAS DEDICADAS) */}
          <nav className="space-y-6 text-xs font-bold">
            
            {/* SEÇÃO 1: PRINCIPAL */}
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-2 px-3 font-mono font-black">
                PAINEL OPERACIONAL
              </span>

              <div className="space-y-1">
                <button
                  onClick={() => setActiveSection('dashboard')}
                  className={`w-full relative flex items-center space-x-3 px-3.5 py-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                    activeSection === 'dashboard'
                      ? 'bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-transparent text-white font-black border border-emerald-500/30 shadow-md'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`}
                >
                  {activeSection === 'dashboard' && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-gradient-to-b from-emerald-400 to-amber-400 rounded-r-full shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                  )}
                  <div className={`p-1.5 rounded-xl ${activeSection === 'dashboard' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    <LayoutDashboard className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold">1. Dashboard Principal</span>
                </button>
              </div>
            </div>

            {/* SEÇÃO 2: GESTÃO DE TURMAS */}
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-2 px-3 font-mono font-black">
                GESTÃO DA EQUIPE
              </span>

              <div className="space-y-1.5">
                <button
                  onClick={() => setActiveSection('team')}
                  className={`w-full relative flex items-center space-x-3 px-3.5 py-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                    activeSection === 'team'
                      ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-transparent text-white font-black border border-amber-500/30 shadow-md'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`}
                >
                  {activeSection === 'team' && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-gradient-to-b from-amber-400 to-orange-400 rounded-r-full shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
                  )}
                  <div className={`p-1.5 rounded-xl ${activeSection === 'team' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold">2. Gestão de Turma</span>
                </button>

                <button
                  onClick={() => setActiveSection('history')}
                  className={`w-full relative flex items-center space-x-3 px-3.5 py-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                    activeSection === 'history'
                      ? 'bg-gradient-to-r from-sky-500/20 via-blue-500/10 to-transparent text-white font-black border border-sky-500/30 shadow-md'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`}
                >
                  {activeSection === 'history' && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-gradient-to-b from-sky-400 to-blue-400 rounded-r-full shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
                  )}
                  <div className={`p-1.5 rounded-xl ${activeSection === 'history' ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    <History className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold">3. Histórico por Turma</span>
                </button>
              </div>
            </div>

            {/* SEÇÃO 3: COMUNICAÇÃO */}
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-2 px-3 font-mono font-black">
                CENTRAL DE COMUNICAÇÃO
              </span>

              <div className="space-y-1.5">
                <button
                  onClick={() => setActiveSection('notifications')}
                  className={`w-full relative flex items-center space-x-3 px-3.5 py-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                    activeSection === 'notifications'
                      ? 'bg-gradient-to-r from-indigo-500/20 via-sky-500/10 to-transparent text-white font-black border border-indigo-500/30 shadow-md'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`}
                >
                  {activeSection === 'notifications' && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-gradient-to-b from-indigo-400 to-sky-400 rounded-r-full shadow-[0_0_12px_rgba(129,140,248,0.8)]" />
                  )}
                  <div className={`p-1.5 rounded-xl ${activeSection === 'notifications' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold">4. Notificações & Avisos</span>
                </button>

                <button
                  onClick={() => setActiveSection('alerts')}
                  className={`w-full relative flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                    activeSection === 'alerts'
                      ? 'bg-gradient-to-r from-rose-500/20 via-red-500/10 to-transparent text-white font-black border border-rose-500/30 shadow-md'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`}
                >
                  {activeSection === 'alerts' && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-gradient-to-b from-rose-400 to-red-400 rounded-r-full shadow-[0_0_12px_rgba(251,113,133,0.8)]" />
                  )}
                  <div className="flex items-center space-x-3">
                    <div className={`p-1.5 rounded-xl ${activeSection === 'alerts' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold">5. Alertas Críticos</span>
                  </div>
                  {urgentesCount > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse shadow-sm shadow-rose-500/50">
                      {urgentesCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

          </nav>

        </div>

        {/* Footer Logout Button */}
        <div className="p-5 border-t border-slate-800/80 bg-slate-950/40">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-slate-900 hover:bg-rose-950/80 text-rose-300 hover:text-rose-200 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer border border-slate-800 hover:border-rose-800/80 shadow-sm"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Encerrar Sessão</span>
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
                  <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center font-black text-lg border border-emerald-500/40">
                    {activeShift?.turma ? activeShift.turma.replace('Turma ', '') : 'A'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-mono">
                        Equipe do Dia Ativa
                      </span>
                      <span className="text-xs font-bold text-slate-300">
                        {activeShift?.equipe || 'Automação & CCO'}
                      </span>
                    </div>
                    <h2 className="text-lg font-black text-white mt-1">
                      {activeShift ? activeShift.turma : 'Turma A (Turno Diurno)'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Responsável: <strong className="text-emerald-300">{activeShift?.responsavelNome || 'John Tavares'}</strong> • Escala: {activeShift?.escala || '2x3'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs bg-slate-800/80 px-4 py-2.5 rounded-2xl border border-slate-700 font-mono">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Horário: {activeShift?.horarioTurno || '07h às 19h'}</span>
                </div>
              </div>

              {/* 4 CARDS COLORIDOS DE ESTATÍSTICAS DA OPERAÇÃO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-5 shadow-md flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-black">{totalIncidents}</div>
                    <div className="text-xs font-bold text-blue-100 mt-1 flex items-center gap-1">
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Total Ocorrências Hoje</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-xs">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl p-5 shadow-md flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-black">{concluidosCount}</div>
                    <div className="text-xs font-bold text-emerald-100 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Concluídos pelas Turmas</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-xs">
                    <CheckSquare className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-5 shadow-md flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-black">{pendenciasCount}</div>
                    <div className="text-xs font-bold text-amber-100 mt-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pendências de Bastão</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-xs">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-2xl p-5 shadow-md flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-black">{urgentesCount}</div>
                    <div className="text-xs font-bold text-rose-100 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Alertas Críticos Urgentes</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-xs">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* GRID: TABELA DE BASTÃO + RESUMO DAS TURMAS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900">
                          Ativos em Alerta & Passagem de Bastão
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          Identificação de <strong className="text-amber-600">Quem Passou</strong> ➔ <strong className="text-sky-600">Quem Deve Assumir</strong>
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-300">
                      {priorityAlerts.length} em atenção
                    </span>
                  </div>

                  {priorityAlerts.length === 0 ? (
                    <div className="py-10 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                      🟢 Nenhum ativo pendente na troca de bastão no momento.
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3">Equipamento / TAG</th>
                            <th className="px-4 py-3">Quem Passou ➔ Quem Assume</th>
                            <th className="px-4 py-3">Falha & Observações</th>
                            <th className="px-4 py-3">Prioridade</th>
                            <th className="px-4 py-3 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {priorityAlerts.map((item) => {
                            const turmaOrigem = item.turma || 'A';
                            const turmaDestino = getTurmaDestino(turmaOrigem);
                            return (
                              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-bold">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300 text-[11px]">
                                      {item.tag}
                                    </span>
                                    <span className="text-slate-900 text-xs font-extrabold">{item.equipamentoNome}</span>
                                  </div>
                                </td>

                                <td className="px-4 py-3 font-bold">
                                  <div className="text-xs text-amber-600 flex items-center gap-1">
                                    <span>Turma {turmaOrigem}</span>
                                    <ArrowRight className="w-3 h-3 text-slate-400" />
                                    <span className="text-sky-600 font-extrabold">{turmaDestino}</span>
                                  </div>
                                </td>

                                <td className="px-4 py-3">
                                  <div className="font-bold text-slate-800">{item.falha}</div>
                                  {item.observacao && (
                                    <div className="mt-1 bg-amber-50 text-amber-800 p-1.5 rounded-lg border border-amber-200 text-[11px] font-medium">
                                      💬 {item.observacao}
                                    </div>
                                  )}
                                </td>

                                <td className="px-4 py-3">
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                                    {item.prioridade}
                                  </span>
                                </td>

                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end space-x-1">
                                    <button
                                      onClick={() => onOpenCommentModal(item)}
                                      title="Anotações"
                                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => onOpenTimeline(item)}
                                      title="Histórico"
                                      className="p-1.5 bg-slate-100 hover:bg-sky-50 text-sky-600 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <History className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
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
                          <th className="px-4 py-3">Cargo / Função</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {userList.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-bold text-slate-900">{u.nome}</td>
                            <td className="px-4 py-3 font-mono text-slate-700 font-bold">{u.matricula}</td>
                            <td className="px-4 py-3 text-slate-500">{u.email}</td>
                            <td className="px-4 py-3">
                              <span className="font-mono bg-sky-100 text-sky-800 px-2.5 py-1 rounded font-black text-[11px]">
                                Turma {u.turma}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600 font-medium">{u.cargo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

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
                                <div className="flex items-center justify-end space-x-1">
                                  <button
                                    onClick={() => onOpenCommentModal(item)}
                                    title="Anotações"
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onOpenTimeline(item)}
                                    title="Linha do Tempo"
                                    className="p-1.5 bg-slate-100 hover:bg-sky-50 text-sky-600 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <History className="w-3.5 h-3.5" />
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

                  <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
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
                            {format(new Date(m.timestamp), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                        <p className="text-slate-800 font-medium leading-relaxed">
                          {m.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

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
