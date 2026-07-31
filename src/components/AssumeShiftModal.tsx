'use client';

import React, { useState, useEffect } from 'react';
import { X, UserCheck, Check, ShieldAlert } from 'lucide-react';

interface AssumeShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShiftAssumed: () => void;
  currentUser?: any;
}

export const AssumeShiftModal: React.FC<AssumeShiftModalProps> = ({
  isOpen,
  onClose,
  onShiftAssumed,
  currentUser,
}) => {
  const [equipe, setEquipe] = useState('Automação A');
  const [responsavelNome, setResponsavelNome] = useState('');
  const [escala, setEscala] = useState('3x3');
  const [observacoes, setObservacoes] = useState('');
  const [activeShiftData, setActiveShiftData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setEquipe(currentUser.equipe || 'Automação A');
      setResponsavelNome(currentUser.nome || '');
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen) {
      fetchCurrentShift();
    }
  }, [isOpen]);

  const fetchCurrentShift = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/turnos/ativo');
      if (res.ok) {
        const data = await res.json();
        setActiveShiftData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const turmaDaEquipe = equipe.replace('Automação ', '').trim();
    const turmaEnvio = ['A', 'B', 'C', 'D'].includes(turmaDaEquipe)
      ? turmaDaEquipe
      : currentUser?.turma || 'A';

    try {
      const res = await fetch('/api/turnos/assumir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipe,
          responsavelNome,
          observacoes,
          turma: turmaEnvio,
          escala,
        }),
      });

      if (!res.ok) {
        console.warn('API /api/turnos/assumir retornou status não-200, assumindo turno localmente');
      }
    } catch (err) {
      console.error('Erro ao assumir turno:', err);
    } finally {
      setIsSubmitting(false);
      onShiftAssumed();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative my-8 text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Assumir Turno de Automação</h3>
              <p className="text-xs text-slate-500">Recepção de pendências operacionais</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo do Turno Anterior */}
        {isLoading ? (
          <div className="text-center py-6 text-xs text-sky-600">Verificando dados do turno anterior...</div>
        ) : activeShiftData ? (
          <div className="mb-5 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Último Turno Registrado:</span>
              <span className="font-bold text-sky-700">
                {activeShiftData.activeShift?.equipe || 'N/A'} (Resp: {activeShiftData.activeShift?.responsavelNome || 'N/A'})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center justify-between">
                <span className="text-rose-700 font-medium">🔴 Críticas:</span>
                <span className="font-bold text-rose-700 font-mono">{activeShiftData.criticalCount || 0}</span>
              </div>
              <div className="bg-sky-50 p-2.5 rounded-xl border border-sky-200 flex items-center justify-between">
                <span className="text-sky-700 font-medium">🔵 Herdadas:</span>
                <span className="font-bold text-sky-700 font-mono">{activeShiftData.openIncidentsCount || 0}</span>
              </div>
            </div>

            {activeShiftData.activeShift?.observacoes && (
              <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                <strong>Observação do Turno Anterior:</strong> {activeShiftData.activeShift.observacoes}
              </div>
            )}
          </div>
        ) : null}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Equipe que Assume</label>
              <select
                value={equipe}
                onChange={(e) => setEquipe(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-sky-500"
              >
                <option value="Automação A">Automação A</option>
                <option value="Automação B">Automação B</option>
                <option value="Automação C">Automação C</option>
                <option value="Automação Central">Automação Central</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Responsável pelo Turno</label>
              <input
                type="text"
                placeholder="ex: Silva Santos"
                value={responsavelNome}
                onChange={(e) => setResponsavelNome(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Observação de Início de Turno (Opcional)</label>
            <input
              type="text"
              placeholder="ex: Turno assumido com foco na inspeção da usina."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-800 flex items-start">
            <ShieldAlert className="w-4 h-4 mr-2 text-sky-600 flex-shrink-0 mt-0.5" />
            <span>
              Ao assumir o turno, todas as ocorrências pendentes serão marcadas automaticamente como 
              <strong> "Pendências Herdadas"</strong>.
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center"
            >
              {isSubmitting ? (
                <span>Processando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1.5" />
                  Confirmar e Assumir Turno
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
