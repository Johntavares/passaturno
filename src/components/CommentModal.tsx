'use client';

import React, { useState, useEffect } from 'react';
import { IncidentType } from '@/types';
import { X, MessageSquare, Send, User, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface CommentModalProps {
  incident: IncidentType | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveComment: (incidentId: string, commentText: string, authorName: string) => void;
  currentUserName?: string;
}

export const CommentModal: React.FC<CommentModalProps> = ({
  incident,
  isOpen,
  onClose,
  onSaveComment,
  currentUserName = 'John Tavares',
}) => {
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState(currentUserName);

  useEffect(() => {
    if (incident) {
      setAuthorName(currentUserName || incident.responsavel || 'John Tavares');
      setCommentText('');
    }
  }, [incident, currentUserName]);

  if (!isOpen || !incident) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    onSaveComment(incident.id, commentText.trim(), authorName);
    setCommentText('');
    onClose();
  };

  // Histórico completo de anotações e atualizações do atendimento
  const notesHistory = incident.historico ? incident.historico : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-5 shadow-2xl relative my-8 text-slate-800 animate-fadeIn">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="badge-tag text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono font-bold border border-slate-200">
                  {incident.tag}
                </span>
                <h3 className="text-sm font-bold text-slate-800">{incident.equipamentoNome}</h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Anotações e comentários para registro do turno atual e próximo turno
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Anotação Atual em Destaque */}
        {incident.observacao && (
          <div className="mb-4 bg-amber-50/70 border border-amber-200/80 rounded-xl p-3">
            <h4 className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
              Última Anotação do Atendimento
            </h4>
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              {incident.observacao}
            </p>
          </div>
        )}

        {/* Histórico de Comentários Anteriores */}
        {notesHistory.length > 0 && (
          <div className="mb-4 max-h-48 overflow-y-auto pr-1 space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Histórico de Notas ({notesHistory.length})
            </h4>
            {notesHistory.map((h) => {
              const dateObj = new Date(h.dataHora);
              return (
                <div key={h.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                    <span className="font-semibold text-slate-700 flex items-center">
                      <User className="w-3 h-3 mr-1 text-slate-400" />
                      {h.usuario}
                    </span>
                    <span className="font-mono text-slate-400">
                      {format(dateObj, 'dd/MM HH:mm')}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-snug">{h.descricao}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Formulário para Nova Anotação */}
        <form onSubmit={handleSubmit} className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nova Anotação / Observação do Turno
            </label>
            <textarea
              rows={3}
              placeholder="Escreva detalhes técnicos, testes realizados ou observações importantes para o próximo turno..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500 font-medium leading-relaxed"
              required
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center space-x-1.5 text-xs text-slate-600">
              <span className="text-[11px] text-slate-400">Autor:</span>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-sky-500 font-medium w-36"
                placeholder="Seu nome"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={!commentText.trim()}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Salvar Anotação</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
