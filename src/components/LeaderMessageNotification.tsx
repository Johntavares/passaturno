'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, ShieldCheck, ChevronDown, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ChatMessage } from './LiderTurmaModal';

export interface OperatorReply {
  id: string;
  sender: string;
  fromTurma: string;
  text: string;
  timestamp: string;
}

interface LeaderMessageNotificationProps {
  userTurma?: string;
  currentUser?: { nome?: string; cargo?: string } | null;
}

export const LeaderMessageNotification: React.FC<LeaderMessageNotificationProps> = ({
  userTurma = 'A',
  currentUser,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replies, setReplies] = useState<OperatorReply[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [replyText, setReplyText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Carrega mensagens do líder
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('passaturno-leader-chat-v1');
      if (saved) {
        const allMsgs: ChatMessage[] = JSON.parse(saved);
        setMessages(
          allMsgs.filter(
            (m) =>
              m.targetTurma === 'GERAL' ||
              m.targetTurma.toUpperCase().trim() === userTurma.toUpperCase().trim()
          )
        );
      }
    } catch (e) {
      console.error('Erro ao carregar mensagens da liderança:', e);
    }
  }, [userTurma]);

  // Carrega respostas dos operadores
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('passaturno-operator-replies-v1');
      if (saved) {
        const all: OperatorReply[] = JSON.parse(saved);
        setReplies(all.filter((r) => r.fromTurma === userTurma));
      }
    } catch (e) {
      console.error('Erro ao carregar respostas:', e);
    }
  }, [userTurma]);

  // Scrolla para baixo quando abre
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [isOpen]);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const reply: OperatorReply = {
      id: `reply-${Date.now()}`,
      sender: currentUser?.nome || `Operador Turma ${userTurma}`,
      fromTurma: userTurma,
      text: replyText.trim(),
      timestamp: new Date().toISOString(),
    };

    // Salva junto com todas as respostas existentes (de todas as turmas)
    try {
      const saved = localStorage.getItem('passaturno-operator-replies-v1');
      const allReplies: OperatorReply[] = saved ? JSON.parse(saved) : [];
      const updated = [...allReplies, reply];
      localStorage.setItem('passaturno-operator-replies-v1', JSON.stringify(updated));
      setReplies((prev) => [...prev, reply]);
      setReplyText('');
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (e) {
      console.error('Erro ao salvar resposta:', e);
    }
  };

  const activeMessages = messages.filter((m) => !dismissedIds.includes(m.id));

  // Mescla mensagens do líder e respostas do operador por timestamp
  const chatItems = [
    ...activeMessages.map((m) => ({ ...m, type: 'leader' as const })),
    ...replies.map((r) => ({ ...r, type: 'operator' as const })),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const totalCount = activeMessages.length;
  if (totalCount === 0 && replies.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">

      {/* Painel de chat expandido */}
      {isOpen && (
        <div className="w-80 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col"
          style={{ maxHeight: '420px' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 leading-none">Liderança</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Turma {userTurma}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            {chatItems.map((item) => {
              const isLeader = item.type === 'leader';
              return (
                <div key={item.id} className={`flex flex-col ${isLeader ? 'items-start' : 'items-end'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                    isLeader
                      ? 'bg-slate-100 text-slate-800 rounded-tl-sm'
                      : 'bg-emerald-500 text-white rounded-tr-sm'
                  }`}>
                    {item.text}
                  </div>
                  <div className={`flex items-center gap-1.5 mt-1 px-1 ${isLeader ? '' : 'flex-row-reverse'}`}>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {isLeader ? (item as ChatMessage).sender : 'Você'}
                    </span>
                    <span className="text-[10px] text-slate-300 font-mono">
                      {format(new Date(item.timestamp), 'HH:mm')}
                    </span>
                    {isLeader && (
                      <button
                        onClick={() => setDismissedIds((prev) => [...prev, item.id])}
                        className="text-slate-300 hover:text-rose-400 transition-colors cursor-pointer ml-1"
                        title="Dispensar"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input de resposta */}
          <form
            onSubmit={handleSendReply}
            className="flex items-center gap-2 p-3 border-t border-slate-100 flex-shrink-0"
          >
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Responder à liderança..."
              className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-400 transition-colors"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Botão flutuante */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-lg hover:shadow-xl hover:border-slate-300 transition-all cursor-pointer group"
      >
        <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
          Liderança
        </span>
        {totalCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
            {totalCount}
          </span>
        )}
      </button>

    </div>
  );
};
