'use client';

import React, { useState } from 'react';
import { Lock, User as UserIcon, LogIn, AlertTriangle, ShieldCheck, CheckCircle2, KeyRound } from 'lucide-react';

interface UserSession {
  id: string;
  nome: string;
  email: string;
  matricula: string | null;
  equipe: string;
  cargo: string;
}

interface LoginModalProps {
  onLoginSuccess: (user: UserSession) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [loginInput, setLoginInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('passaturno2026');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const operatorPresets = [
    { nome: 'Silva Santos', matricula: '1001', equipe: 'Automação A', cargo: 'Eng. Automação' },
    { nome: 'John Doe', matricula: '1002', equipe: 'Automação B', cargo: 'Téc. Automação Sr.' },
    { nome: 'Carlos Oliveira', matricula: '1003', equipe: 'Automação C', cargo: 'Téc. Automação' },
    { nome: 'Supervisor CCO', matricula: 'admin', equipe: 'CCO Automação', cargo: 'Supervisor' },
  ];

  const handleSelectPreset = (matricula: string) => {
    setLoginInput(matricula);
    setSenhaInput('passaturno2026');
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginInput || !senhaInput) {
      setErrorMsg('Por favor, digite sua Matrícula ou E-mail e Senha.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: loginInput,
          senha: senhaInput,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Credenciais inválidas');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao autenticar');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-8 shadow-2xl relative my-8 text-slate-800 dark:text-slate-100 animate-fadeIn">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-md border border-slate-200 p-2 flex items-center justify-center">
            <img src="/icon.png" alt="PASSATURNO" className="w-full h-full object-contain" />
          </div>

          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              PASSA<span className="text-emerald-600 dark:text-emerald-400 font-black">TURNO</span>
            </h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Informação que continua o trabalho.
            </p>
          </div>

          <div className="inline-flex items-center px-3 py-1 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold rounded-full border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Autenticação de Operador de Automação
          </div>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-rose-600 flex-shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Formulário de Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Matrícula ou E-mail Corporativo
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="ex: 1001 ou silva@passaturno.com"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                spellCheck={false}
                data-gramm={false}
                autoComplete="off"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900 shadow-2xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Senha de Acesso
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                placeholder="Sua senha..."
                value={senhaInput}
                onChange={(e) => setSenhaInput(e.target.value)}
                spellCheck={false}
                data-gramm={false}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900 shadow-2xs"
                required
              />
            </div>
          </div>

          {/* Seleção Rápida de Operadores de Produção */}
          <div className="pt-2">
            <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">
              Acesso Rápido por Operador / Matrícula:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {operatorPresets.map((op) => (
                <button
                  key={op.matricula}
                  type="button"
                  onClick={() => handleSelectPreset(op.matricula)}
                  className={`p-2 rounded-xl text-left border text-[11px] transition-all cursor-pointer ${
                    loginInput === op.matricula
                      ? 'bg-sky-50 dark:bg-sky-950 border-sky-300 dark:border-sky-700 text-sky-900 dark:text-sky-200 font-bold ring-2 ring-sky-200 dark:ring-sky-800'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold truncate">{op.nome}</div>
                  <div className="text-[10px] opacity-75 truncate">{op.cargo} ({op.matricula})</div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-sky-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Autenticando Operador...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2 stroke-[2.5]" />
                Entrar no PASSATURNO
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Ambiente de Operação de Mina & CCO • PASSATURNO v2.0
          </p>
        </div>

      </div>
    </div>
  );
};
