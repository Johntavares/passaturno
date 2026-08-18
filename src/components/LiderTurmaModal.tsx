'use client';

import React, { useState, useEffect } from 'react';
import { IncidentType, ShiftType } from '@/types';
import { 
  X, 
  ShieldCheck, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Layers, 
  TrendingUp, 
  Filter, 
  FileSpreadsheet,
  Award,
  ChevronRight,
  MessageSquare,
  Send,
  User,
  Megaphone,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';

export interface ChatMessage {
  id: string;
  sender: string;
  targetTurma: string; // 'A' | 'B' | 'C' | 'D' | 'GERAL'
  text: string;
  timestamp: string;
}

interface LiderTurmaModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: IncidentType[];
  activeShift: ShiftType | null;
  selectedTurmaFilter: string;
  onSelectTurmaFilter: (turma: string) => void;
}

export const LiderTurmaModal: React.FC<LiderTurmaModalProps> = ({
  isOpen,
  onClose,
  incidents,
  activeShift,
  selectedTurmaFilter,
  onSelectTurmaFilter,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'chat'>('chat');
  const [chatChannel, setChatChannel] = useState<string>('GERAL');
  const [newMsgText, setNewMsgText] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Carregar mensagens do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('passaturno-leader-chat-v1');
        if (saved) {
          setChatMessages(JSON.parse(saved));
        } else {
          // Mensagens iniciais de demonstração da liderança
          const initialMsgs: ChatMessage[] = [
            {
              id: 'msg-1',
              sender: 'Líder da Turma',
              targetTurma: 'GERAL',
              text: '📢 Comunicado Geral: Atenção a todas as equipes (A, B, C, D) no alinhamento das pendências de passagem de turno.',
              timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
            },
            {
              id: 'msg-2',
              sender: 'Líder da Turma',
              targetTurma: 'A',
              text: 'Turma A: Favor dar prioridade máxima no atendimento dos equipamentos de carregamento da Mina.',
              timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
            },
            {
              id: 'msg-3',
              sender: 'Líder da Turma',
              targetTurma: 'B',
              text: 'Turma B: Excelente taxa de resolução nas ocorrências de rádio e GPS no turno anterior.',
              timestamp: new Date(Date.now() - 3600000).toISOString(),
            },
          ];
          setChatMessages(initialMsgs);
          localStorage.setItem('passaturno-leader-chat-v1', JSON.stringify(initialMsgs));
        }
      } catch (e) {
        console.error('Erro ao ler mensagens do chat:', e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const turmasList = ['A', 'B', 'C', 'D'];

  // Agrupamento por Turma/Letra
  const getTurmaStats = (turmaLetra: string) => {
    const list = incidents.filter(
      (i) => (i.turma || 'A').toUpperCase().trim() === turmaLetra
    );
    const concluidos = list.filter((i) => i.status === 'FINALIZADO' || i.status === 'RETROAGIDO').length;
    const emAndamento = list.filter((i) => i.status === 'EM_ANDAMENTO').length;
    const aguardando = list.filter((i) => i.status === 'AGUARDANDO').length;
    const pendencias = list.filter((i) => i.status === 'PENDENCIA_PROXIMO_TURNO' || i.isPendenciaHerdada).length;

    return {
      total: list.length,
      concluidos,
      emAndamento,
      aguardando,
      pendencias,
      taxaConclusao: list.length > 0 ? Math.round((concluidos / list.length) * 100) : 0,
    };
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsgText.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: activeShift?.responsavelNome || 'Líder da Turma',
      targetTurma: chatChannel,
      text: newMsgText.trim(),
      timestamp: new Date().toISOString(),
    };

    const updated = [newMsg, ...chatMessages];
    setChatMessages(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('passaturno-leader-chat-v1', JSON.stringify(updated));
      } catch (e) {
        console.error('Erro ao salvar mensagem:', e);
      }
    }
    setNewMsgText('');
  };

  const handleExportLeadershipReport = () => {
    const headers = ['Turma', 'Total Ocorrências', 'Concluídos', 'Em Andamento', 'Aguardando', 'Próximo Turno', 'Taxa Resolução'];
    const rows = turmasList.map((t) => {
      const stats = getTurmaStats(t);
      return [`Turma ${t}`, stats.total, stats.concluidos, stats.emAndamento, stats.aguardando, stats.pendencias, `${stats.taxaConclusao}%`];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Relatorio_Gestao_Lider_Turma_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredChatMsgs = chatMessages.filter(
    (m) => chatChannel === 'GERAL' || m.targetTurma === chatChannel || m.targetTurma === 'GERAL'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl relative my-4 text-slate-800 dark:text-slate-100 animate-fadeIn flex flex-col max-h-[92vh]">
        
        {/* Header do Painel do Líder */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-gradient-to-tr from-amber-600 to-amber-400 text-white rounded-2xl flex items-center justify-center shadow-md shadow-amber-500/20 flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Ponto de Conexão & Chat da Liderança
                </h2>
                <span className="text-[10px] uppercase font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                  Perfil Líder da Turma
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acompanhamento em tempo real e envio de orientações para cada letra (Turma A, B, C e D)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleExportLeadershipReport}
              className="inline-flex items-center px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              <span>Exportar Dados</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Seletor Rápido de Turma Foco */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Filter className="w-4 h-4 text-amber-500" />
            <span>Filtrar Visão do Kanban por Letra:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
            <button
              onClick={() => onSelectTurmaFilter('TODAS')}
              className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                selectedTurmaFilter === 'TODAS'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              🌐 TODAS AS TURMAS
            </button>

            {turmasList.map((letra) => (
              <button
                key={letra}
                onClick={() => onSelectTurmaFilter(letra)}
                className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  selectedTurmaFilter === letra
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                TURMA {letra}
              </button>
            ))}
          </div>
        </div>

        {/* Abas Internas de Navegação do Líder */}
        <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>💬 Chat & Orientação por Letra</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>📊 Resumo por Turma</span>
          </button>

          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'comparison'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>⚔️ Comparativo das Letras (A, B, C, D)</span>
          </button>
        </div>

        {/* Conteúdo Principal do Modal */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'chat' ? (
            /* 💬 ABA DE CHAT E COMUNICAÇÃO DO LÍDER COM AS LETRAS */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full min-h-[380px]">
              
              {/* Coluna 1: Seleção de Canal de Chat (Letras) */}
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4 text-amber-500" />
                  Canais de Comunicação
                </h4>

                <button
                  onClick={() => setChatChannel('GERAL')}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    chatChannel === 'GERAL'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Megaphone className="w-4 h-4" />
                    <span>📢 Mural Geral (Todas)</span>
                  </div>
                </button>

                {turmasList.map((letra) => {
                  const count = chatMessages.filter((m) => m.targetTurma === letra).length;
                  return (
                    <button
                      key={letra}
                      onClick={() => setChatChannel(letra)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        chatChannel === letra
                          ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {letra}
                        </span>
                        <span>💬 Chat Turma {letra}</span>
                      </div>
                      {count > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Coluna 2 e 3: Área de Mensagens e Formulário de Envio */}
              <div className="md:col-span-2 flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                    {chatChannel === 'GERAL' ? (
                      <>📢 Mural de Avisos Gerais para Todas as Turmas</>
                    ) : (
                      <>💬 Canal Direto com a <span className="font-mono bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 px-2 py-0.5 rounded">TURMA {chatChannel}</span></>
                    )}
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {filteredChatMsgs.length} Mensagen{filteredChatMsgs.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Lista de Mensagens */}
                <div className="flex-1 max-h-[260px] overflow-y-auto space-y-2.5 pr-1">
                  {filteredChatMsgs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 space-y-1">
                      <MessageSquare className="w-8 h-8 opacity-40" />
                      <p className="text-xs font-semibold">Nenhuma orientação enviada para este canal ainda.</p>
                    </div>
                  ) : (
                    filteredChatMsgs.map((m) => (
                      <div
                        key={m.id}
                        className={`p-3 rounded-2xl border text-xs space-y-1 ${
                          m.targetTurma === 'GERAL'
                            ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
                            : 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/50'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                          <span className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-bold">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                            {m.sender}
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                              Para: {m.targetTurma === 'GERAL' ? 'Todas as Turmas' : `Turma ${m.targetTurma}`}
                            </span>
                          </span>
                          <span className="font-mono text-slate-400">{format(new Date(m.timestamp), 'dd/MM HH:mm')}</span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                          {m.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Formulário para Enviar Mensagem */}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <input
                    type="text"
                    placeholder={`Enviar orientação ou aviso para ${chatChannel === 'GERAL' ? 'Todas as Turmas' : `Turma ${chatChannel}`}...`}
                    value={newMsgText}
                    onChange={(e) => setNewMsgText(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={!newMsgText.trim()}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar</span>
                  </button>
                </form>
              </div>

            </div>
          ) : activeTab === 'overview' ? (
            /* 📊 RESUMO GERAL DAS TURMAS */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {turmasList.map((letra) => {
                  const stats = getTurmaStats(letra);
                  return (
                    <div
                      key={letra}
                      className={`p-4 rounded-2xl border transition-all ${
                        selectedTurmaFilter === letra
                          ? 'bg-sky-50/90 dark:bg-sky-950/40 border-sky-400 dark:border-sky-700 ring-2 ring-sky-400/20'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-black bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2.5 py-0.5 rounded-lg">
                          TURMA {letra}
                        </span>
                        <span className="text-xs font-extrabold text-sky-600 dark:text-sky-400">
                          {stats.taxaConclusao}% Resolução
                        </span>
                      </div>

                      <div className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                        {stats.total} <span className="text-xs font-medium text-slate-400">Ocorrência{stats.total !== 1 ? 's' : ''}</span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex justify-between">
                          <span>🟢 Concluídos:</span>
                          <strong className="text-emerald-600">{stats.concluidos}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>🔴 Em Andamento:</span>
                          <strong className="text-rose-600">{stats.emAndamento}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>🟡 Aguardando:</span>
                          <strong className="text-amber-600">{stats.aguardando}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>🔵 Próximo Turno:</span>
                          <strong className="text-sky-600">{stats.pendencias}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ⚔️ TABELA COMPARATIVA DE DESEMPENHO */
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Letra / Turma</th>
                    <th className="px-4 py-3">Total Ocorrências</th>
                    <th className="px-4 py-3">🟢 Concluídos</th>
                    <th className="px-4 py-3">🔴 Em Andamento</th>
                    <th className="px-4 py-3">🔵 Próximo Turno</th>
                    <th className="px-4 py-3 text-right">Taxa Resolução</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {turmasList.map((letra) => {
                    const stats = getTurmaStats(letra);
                    return (
                      <tr key={letra} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-bold">
                          <span className="font-mono bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 px-2.5 py-1 rounded-lg border border-sky-300 dark:border-sky-800">
                            TURMA {letra}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{stats.total}</td>
                        <td className="px-4 py-3 text-emerald-600 font-bold">{stats.concluidos}</td>
                        <td className="px-4 py-3 text-rose-600 font-bold">{stats.emAndamento}</td>
                        <td className="px-4 py-3 text-sky-600 font-bold">{stats.pendencias}</td>
                        <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-white">
                          {stats.taxaConclusao}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Ponto de Conexão da Liderança • Comunicação & Auditoria</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Fechar Painel
          </button>
        </div>

      </div>
    </div>
  );
};
