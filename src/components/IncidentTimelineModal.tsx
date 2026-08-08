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
  const [isUpdatingDivisao, setIsUpdatingDivisao] = useState(false);

  if (!isOpen || !incident) return null;

  const handleUpdateDivisao = async (newDivisao: 'MONITORAMENTO' | 'CORRETIVA_CAMPO') => {
    if (!incident || incident.divisaoAtuacao === newDivisao) return;

    setIsUpdatingDivisao(true);
    try {
      const labelDiv = newDivisao === 'CORRETIVA_CAMPO' ? 'Corretiva de Campo' : 'Monitoramento (NOC)';
      const res = await fetch(`/api/atendimentos/${incident.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          divisaoAtuacao: newDivisao,
          logDescription: `Divisão de atuação alterada para ${labelDiv}.`,
          logUsuario: logUser,
        }),
      });

      if (!res.ok) throw new Error('Erro ao atualizar divisão');

      onTimelineUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingDivisao(false);
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative my-6 text-slate-800 space-y-4">
        
        {/* HEADER COM STATUS, TAG E EQUIPAMENTO */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-900 border border-slate-200 shadow-xs">
                {incident.tag}
              </span>
              <h3 className="text-base font-black text-slate-900">{incident.equipamentoNome}</h3>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                incident.divisaoAtuacao === 'CORRETIVA_CAMPO'
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-cyan-50 text-cyan-900 border-cyan-300'
              }`}>
                {incident.divisaoAtuacao === 'CORRETIVA_CAMPO' ? '🔧 Corretiva de Campo' : '📺 Atuação NOC'}
              </span>

              <span className="text-[10px] font-bold bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md border border-sky-200">
                Turma {incident.turma || 'A'}
              </span>
            </div>

            <div className="flex items-center space-x-3 text-xs text-slate-600 font-medium">
              <span><strong>Falha:</strong> {incident.falha}</span>
              <span>•</span>
              <span><strong>Responsável:</strong> {incident.responsavel}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SELETOR INTERATIVO DE DIVISÃO DE ATUAÇÃO (MONITORAMENTO VS CORRETIVA) */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>Divisão de Atuação do Atendimento</span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium block">
              Alterne entre Monitoramento (NOC) e Corretiva de Campo com 1 clique:
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              disabled={isUpdatingDivisao}
              onClick={() => handleUpdateDivisao('MONITORAMENTO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                incident.divisaoAtuacao === 'MONITORAMENTO' || !incident.divisaoAtuacao
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              📺 Monitoramento (NOC)
            </button>
            <button
              type="button"
              disabled={isUpdatingDivisao}
              onClick={() => handleUpdateDivisao('CORRETIVA_CAMPO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                incident.divisaoAtuacao === 'CORRETIVA_CAMPO'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              🔧 Corretiva de Campo
            </button>
          </div>
        </div>

        {/* ANOTAÇÕES DO TURNO E SOLUÇÃO APLICADA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card de Anotações/Observação */}
          <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1">
              💬 Anotações / Observação do Turno
            </span>
            {incident.observacao ? (
              <p className="text-xs text-amber-950 font-medium leading-relaxed italic">
                "{incident.observacao}"
              </p>
            ) : (
              <p className="text-xs text-amber-700/70 italic">Nenhuma anotação gravada ainda.</p>
            )}
          </div>

          {/* Card de Solução Aplicada */}
          <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
              ✅ Solução / Ação Tomada
            </span>
            {incident.solucao ? (
              <p className="text-xs text-emerald-950 font-bold leading-relaxed">
                {incident.solucao}
              </p>
            ) : (
              <p className="text-xs text-emerald-700/70 italic">Aguardando registro da solução.</p>
            )}
          </div>
        </div>

        {/* LINHA DO TEMPO CRONOLÓGICA DE EVENTOS & COMENTÁRIOS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <History className="w-4 h-4 text-sky-600" />
              Linha do Tempo & Histórico de Comentários
            </h4>
            <span className="text-[11px] font-bold text-slate-400">
              {incident.historico?.length || 0} evento(s)
            </span>
          </div>

          <div className="max-h-56 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {incident.historico && incident.historico.length > 0 ? (
              <div className="relative border-l-2 border-slate-200 ml-3 pl-4 space-y-3">
                {incident.historico.map((h) => {
                  let dateStr = h.dataHora;
                  try {
                    const dateObj = new Date(h.dataHora);
                    dateStr = format(dateObj, 'HH:mm • dd/MM/yyyy');
                  } catch (e) {
                    dateStr = h.dataHora;
                  }

                  return (
                    <div key={h.id} className="relative group">
                      <div className="absolute -left-[23px] top-0.5 p-1 rounded-full bg-white border border-slate-200 shadow-xs">
                        {getEventIcon(h.tipoEvento)}
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {h.usuario}
                          </span>
                          <span className="font-mono text-slate-500 font-medium text-[10px]">
                            {dateStr}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">{h.descricao}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs font-bold text-slate-400">
                Nenhum evento gravado na linha do tempo ainda.
              </div>
            )}
          </div>
        </div>

        {/* FORMULÁRIO DE NOVA ATUALIZAÇÃO / NOVO COMENTÁRIO */}
        <form onSubmit={handleAddLog} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
          <label className="block text-xs font-extrabold text-slate-800">
            Adicionar Novo Comentário / Atualização de Campo
          </label>
          
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Digite o comentário ou atualização do atendimento..."
              value={newLogText}
              onChange={(e) => setNewLogText(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-500"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting || !newLogText.trim()}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1">
            <span>Registrado por:</span>
            <input
              type="text"
              value={logUser}
              onChange={(e) => setLogUser(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 text-right px-2 py-0.5 focus:outline-none focus:border-sky-500"
            />
          </div>
        </form>

      </div>
    </div>
  );
};
