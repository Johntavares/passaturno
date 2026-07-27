'use client';

import React, { useState, useEffect } from 'react';
import { Megaphone, X, ShieldCheck, Clock, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ChatMessage } from './LiderTurmaModal';

interface LeaderMessageNotificationProps {
  userTurma?: string;
}

export const LeaderMessageNotification: React.FC<LeaderMessageNotificationProps> = ({
  userTurma = 'A',
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('passaturno-leader-chat-v1');
        if (saved) {
          const allMsgs: ChatMessage[] = JSON.parse(saved);
          const relevant = allMsgs.filter(
            (m) =>
              m.targetTurma === 'GERAL' ||
              m.targetTurma.toUpperCase().trim() === userTurma.toUpperCase().trim()
          );
          setMessages(relevant);
        }
      } catch (e) {
        console.error('Erro ao carregar mensagens da liderança:', e);
      }
    }
  }, [userTurma]);

  const activeMessages = messages.filter((m) => !dismissedIds.includes(m.id));

  if (activeMessages.length === 0) return null;

  const latestMsg = activeMessages[0];

  return (
    <>
      {/* Banner de Notificação da Liderança no Topo do Dashboard do Operador */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-950 p-3 rounded-2xl shadow-lg border border-amber-400 flex items-center justify-between gap-3 animate-fadeIn my-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-slate-950 text-amber-400 rounded-xl flex items-center justify-center flex-shrink-0 font-extrabold shadow-sm">
            <Megaphone className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase bg-slate-950 text-amber-300 px-2 py-0.5 rounded font-mono">
                Notificação da Liderança
              </span>
              <span className="text-xs font-black text-slate-950">
                {latestMsg.sender}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-950 line-clamp-1 mt-0.5">
              {latestMsg.text}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={() => setIsOpen(true)}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-amber-300 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Orientações ({activeMessages.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setDismissedIds((prev) => [...prev, latestMsg.id])}
            title="Dispensar este aviso"
            className="p-1.5 text-slate-900 hover:text-slate-950 rounded-lg hover:bg-amber-400/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal Completo de Leitura das Mensagens do Líder */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-8 text-slate-800 dark:text-slate-100 animate-fadeIn space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-xl">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Orientações e Mensagens da Liderança
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Instruções enviadas para a sua equipe (Turma {userTurma})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
              {activeMessages.map((m) => (
                <div key={m.id} className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-3.5 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-amber-900 dark:text-amber-300 font-bold">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      {m.sender} ➔ <strong className="uppercase">Para: {m.targetTurma === 'GERAL' ? 'Todas as Turmas' : `Turma ${m.targetTurma}`}</strong>
                    </span>
                    <span className="font-mono text-amber-700 dark:text-amber-400">{format(new Date(m.timestamp), 'dd/MM HH:mm')}</span>
                  </div>
                  <p className="text-amber-950 dark:text-amber-100 font-medium leading-relaxed">
                    {m.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-right">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Ciente
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
