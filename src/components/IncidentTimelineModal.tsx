'use client';

import React, { useState } from 'react';
import { IncidentType } from '@/types';
import { 
  X, 
  History, 
  Send, 
  CheckCircle2, 
  User, 
  AlertCircle, 
  RefreshCw, 
  ArrowRightLeft, 
  Wrench 
} from 'lucide-react';
import { format } from 'date-fns';

interface IncidentTimelineModalProps {
  incident: IncidentType | null;
  isOpen: boolean;
  onClose: () => void;
  onTimelineUpdated: () => void;
}

export const IncidentTimelineModal: React.FC<IncidentTimelineModalProps> = ({
  incident,
  isOpen,
  onClose,
  onTimelineUpdated,
}) => {
  const [newLogText, setNewLogText] = useState('');
  const [logUser, setLogUser] = useState(incident?.responsavel || 'Técnico Automação');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !incident) return null;

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogText.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/atendimentos/${incident.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logDescription: newLogText,
          logUsuario: logUser,
        }),
      });

      if (!res.ok) throw new Error('Erro ao adicionar evento');

      setNewLogText('');
      onTimelineUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEventIcon = (tipo: string) => {
    switch (tipo) {
      case 'ABERTURA':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case 'LIBERACAO':
      case 'SOLUCAO':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'ALTERACAO_STATUS':
        return <RefreshCw className="w-4 h-4 text-amber-500" />;
      case 'TRANSFERENCIA_TURNO':
        return <ArrowRightLeft className="w-4 h-4 text-sky-500" />;
      case 'ATUALIZACAO':
      default:
        return <Wrench className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative my-8 text-slate-800">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="badge-tag text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                {incident.tag}
              </span>
              <h3 className="text-base font-bold text-slate-800">{incident.equipamentoNome}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              <strong>Falha:</strong> {incident.falha}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Linha do Tempo Cronológica */}
        <div className="mb-6 max-h-72 overflow-y-auto pr-2 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
            <History className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
            Linha do Tempo da Ocorrência
          </h4>

          {incident.historico && incident.historico.length > 0 ? (
            <div className="relative border-l-2 border-slate-200 ml-3 pl-5 space-y-3.5">
              {incident.historico.map((h) => {
                const dateObj = new Date(h.dataHora);
                return (
                  <div key={h.id} className="relative group">
                    <div className="absolute -left-[27px] top-0.5 p-1 rounded-full bg-white border border-slate-200 shadow-xs">
                      {getEventIcon(h.tipoEvento)}
                    </div>

                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span className="font-semibold text-slate-700 flex items-center">
                          <User className="w-3 h-3 mr-1 text-slate-400" />
                          {h.usuario}
                        </span>
                        <span className="font-mono text-slate-500">
                          {format(dateObj, 'HH:mm • dd/MM')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-snug">{h.descricao}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Nenhum evento registrado ainda.</p>
          )}
        </div>

        {/* Form para adicionar atualização */}
        <form onSubmit={handleAddLog} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
          <label className="block text-xs font-semibold text-slate-700 mb-2">Nova Atualização de Campo</label>
          
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Descreva a intervenção realizada..."
              value={newLogText}
              onChange={(e) => setNewLogText(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting || !newLogText.trim()}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              Enviar
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>Usuário:</span>
            <input
              type="text"
              value={logUser}
              onChange={(e) => setLogUser(e.target.value)}
              className="bg-transparent border-b border-slate-300 text-[11px] text-slate-700 text-right focus:outline-none focus:border-sky-500 px-1"
            />
          </div>
        </form>

      </div>
    </div>
  );
};
