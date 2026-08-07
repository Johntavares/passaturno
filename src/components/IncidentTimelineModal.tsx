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
        
        {/* Header com Detalhes do Atendimento */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-3">
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="badge-tag text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-mono font-bold">
                {incident.tag}
              </span>
              <h3 className="text-sm font-black text-slate-800">{incident.equipamentoNome}</h3>

              {/* Especificação da Divisão de Atuação nos Detalhes */}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                incident.divisaoAtuacao === 'CORRETIVA_CAMPO'
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-cyan-50 text-cyan-900 border-cyan-300'
              }`}>
                {incident.divisaoAtuacao === 'CORRETIVA_CAMPO' ? '🔧 Corretiva de Campo' : '📺 Atuação Monitoramento (NOC)'}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-1">
              <strong>Falha:</strong> {incident.falha}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bloco de Destaque: Anotações do Turno & Solução Aplicada */}
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 mb-4 space-y-2 text-xs">
          <div>
            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
              💬 Anotações / Observação do Turno:
            </span>
            {incident.observacao ? (
              <p className="text-slate-800 font-medium italic mt-0.5">"{incident.observacao}"</p>
            ) : (
              <p className="text-slate-400 italic mt-0.5">Nenhuma anotação gravada ainda neste atendimento.</p>
            )}
          </div>

          {incident.solucao && (
            <div className="pt-2 border-t border-amber-200/60">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                ✅ Solução Aplicada:
              </span>
              <p className="text-emerald-950 font-bold mt-0.5">{incident.solucao}</p>
            </div>
          )}

          {incident.sintoma && (
            <div className="pt-1 text-[11px] text-slate-600">
              <strong>Sintoma:</strong> {incident.sintoma}
            </div>
          )}
        </div>

        {/* Linha do Tempo Cronológica */}
        <div className="mb-4 max-h-64 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
            <History className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
            Linha do Tempo & Histórico de Atualizações
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
