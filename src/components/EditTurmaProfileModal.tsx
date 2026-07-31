'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Clock, Sun, Moon, Check, Save } from 'lucide-react';


interface EditTurmaProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onProfileUpdated: (updatedUser: any) => void;
}

export const EditTurmaProfileModal: React.FC<EditTurmaProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
}) => {
  const [nome, setNome] = useState('');
  const [horarioTurno, setHorarioTurno] = useState('07:00 às 19:00');
  const [periodoTurno, setPeriodoTurno] = useState<'Dia' | 'Noite'>('Dia');
  const [escala, setEscala] = useState('3x3');
  const [diaEscala, setDiaEscala] = useState('1º Dia');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setNome(currentUser.nome || '');
      setHorarioTurno(currentUser.horarioTurno || '07:00 às 19:00');
      setPeriodoTurno(currentUser.periodoTurno || (currentUser.turma === 'D' ? 'Noite' : 'Dia'));
      setEscala(currentUser.escala || '3x3');
      setDiaEscala(currentUser.diaEscala || '1º Dia');
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;

    const userSessionData = {
      ...currentUser,
      nome: nome.trim(),
      horarioTurno: horarioTurno.trim(),
      periodoTurno,
      escala,
      diaEscala,
    };

    try {
      await fetch(`/api/usuarios/${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          horarioTurno: horarioTurno.trim(),
          periodoTurno,
          escala,
          diaEscala,
        }),
      });
    } catch (err) {
      console.error('Erro ao atualizar perfil na API:', err);
    }

    onProfileUpdated(userSessionData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative my-8 animate-fadeIn text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-200">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Editar Perfil do Turno ({currentUser?.turma ? `Turma ${currentUser.turma}` : 'Operador'})
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Configure os dados do operador e horário para o Boletim de 2h
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {savedSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Perfil Atualizado com Sucesso!</h4>
            <p className="text-xs text-slate-500">As informações já serão refletidas nos relatórios de 2h.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Campo 1: Nome do Responsável / Operador em Turno */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Nome do Operador em Turno:
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Carlos Silva"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
                required
              />
            </div>

            {/* Campo 2: Período do Turno (Dia ou Noite) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Período do Turno:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPeriodoTurno('Dia');
                    if (horarioTurno === '19:00 às 07:00') setHorarioTurno('07:00 às 19:00');
                  }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    periodoTurno === 'Dia'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-900" />
                  <span>Dia (Diurno)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPeriodoTurno('Noite');
                    if (horarioTurno === '07:00 às 19:00') setHorarioTurno('19:00 às 07:00');
                  }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    periodoTurno === 'Noite'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Moon className="w-4 h-4 text-indigo-200" />
                  <span>Noite (Noturno)</span>
                </button>
              </div>
            </div>

            {/* Campo 3: Horário do Turno */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Horário da Escala:
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={horarioTurno}
                  onChange={(e) => setHorarioTurno(e.target.value)}
                  placeholder="Ex: 07:00 às 19:00"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Escala (ex: 3x3):
                </label>
                <input
                  type="text"
                  value={escala}
                  onChange={(e) => setEscala(e.target.value)}
                  placeholder="Ex: 3x3"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Dia de Trabalho (Sua Letra):
                </label>
                <select
                  value={diaEscala}
                  onChange={(e) => setDiaEscala(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="1º Dia">1º Dia</option>
                  <option value="2º Dia">2º Dia</option>
                  <option value="3º Dia">3º Dia</option>
                  <option value="4º Dia">4º Dia</option>
                  <option value="5º Dia">5º Dia</option>
                  <option value="Folga">Folga</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Perfil</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
