'use client';

import React, { useState } from 'react';
import { 
  Lock, 
  User as UserIcon, 
  LogIn, 
  AlertTriangle, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  UserPlus, 
  Building2, 
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { X } from 'lucide-react';

interface UserSession {
  id: string;
  nome: string;
  email: string;
  matricula: string | null;
  equipe: string;
  cargo: string;
  turma?: string;
}

interface LoginModalProps {
  onLoginSuccess: (user: UserSession) => void;
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess, onClose }) => {
  const [mode, setMode] = useState<'signin' | 'signup_leader'>('signin');


  // Sign In Form States
  const [loginInput, setLoginInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up Leader Form States
  const [leaderNome, setLeaderNome] = useState('');
  const [leaderMatricula, setLeaderMatricula] = useState('');
  const [leaderEmail, setLeaderEmail] = useState('');
  const [leaderSenha, setLeaderSenha] = useState('');
  const [leaderSenhaConfirm, setLeaderSenhaConfirm] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Login Submit
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginInput.trim() || !senhaInput.trim()) {
      setErrorMsg('Por favor, informe sua Matrícula/E-mail e Senha.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Tentar autenticação via API
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: loginInput.trim(),
          senha: senhaInput.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        onLoginSuccess(data.user);
        return;
      }

      throw new Error(data.error || 'Credenciais inválidas. Verifique sua Matrícula e Senha.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao realizar login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Leader Sign Up Submit
  const handleLeaderSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!leaderNome.trim() || !leaderMatricula.trim() || !leaderSenha.trim()) {
      setErrorMsg('Preencha Nome, Matrícula e Senha do Líder.');
      return;
    }

    if (leaderSenha !== leaderSenhaConfirm) {
      setErrorMsg('As senhas digitadas não coincidem.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: leaderNome.trim(),
          matricula: leaderMatricula.trim(),
          senha: leaderSenha.trim(),
          turma: 'GERAL',
          criadoPor: 'system',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao criar conta');
      }

      const created = await res.json();

      setSuccessMsg('Conta de Líder criada com sucesso! Faça login abaixo com sua nova conta.');
      setMode('signin');
      setLoginInput(created.matricula);
      setSenhaInput('');
    } catch (err: any) {
      setErrorMsg('Não foi possível criar a conta do Líder.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      
      {/* CARD SPLIT-SCREEN INSPIRADO NO LAYOUT DA IMAGEM DE REFERÊNCIA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden my-4 grid grid-cols-1 md:grid-cols-2 animate-fadeIn min-h-[520px]">
        
        {/* COLUNA ESQUERDA: PAINEL DECORATIVO DE BRANDING (VERDE / ESMERALDA) */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 p-8 text-white flex flex-col justify-between relative overflow-hidden hidden md:flex">
          
          {/* Formas Onduladas Decorativas de Fundo */}
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

          {/* Header Branding */}
          <div className="relative z-10 space-y-3">
            <div className="w-12 h-12 bg-white rounded-2xl p-1.5 shadow-md flex items-center justify-center">
              <img src="/icon.png" alt="PASSATURNO" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                PASSA<span className="text-emerald-200">TURNO</span>
              </h1>
              <p className="text-xs text-emerald-100 font-medium">
                Informação que continua o trabalho.
              </p>
            </div>
          </div>

          {/* Texto de Boas-Vindas Central */}
          <div className="relative z-10 space-y-4 my-auto py-6">
            <h2 className="text-2xl font-black leading-snug tracking-tight">
              Bem-vindo ao Controle de Turno!
            </h2>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              Plataforma unificada para Gestão de Ocorrências, Alertas de Prioridade e Passagem de Turno.
            </p>
          </div>

          {/* Rodapé do Painel Decorativo */}
          <div className="relative z-10 text-[11px] text-emerald-200/80 font-medium border-t border-white/10 pt-4 flex items-center justify-between">
            <span>Controle de Turno Seguro</span>
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
          </div>

        </div>

        {/* COLUNA DIREITA: FORMULÁRIO SEGURO E ELEGANTE */}
        <div className="p-8 flex flex-col justify-between bg-white dark:bg-slate-900">
          
          {/* Modal Header & Alternador de Modo */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {mode === 'signin' ? 'Acessar Conta' : 'Criar Conta da Liderança'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {mode === 'signin'
                    ? 'Insira suas credenciais para entrar no painel'
                    : 'Cadastre sua conta gerencial como Líder da Turma'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Botão para alternar entre Login e Cadastro do Líder */}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'signin' ? 'signup_leader' : 'signin');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline cursor-pointer flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-all"
                >
                  {mode === 'signin' ? (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Cadastrar Líder</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Fazer Login</span>
                    </>
                  )}
                </button>

                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-colors cursor-pointer"
                    title="Fechar modal de login"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Mensagem de Erro */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-rose-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Mensagem de Sucesso */}
            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* FORMULÁRIO 1: SIGN IN (LOGIN SEGURO) */}
            {mode === 'signin' ? (
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                
                {/* Campo 1: Matrícula / E-mail */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Matrícula ou E-mail
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Digite sua Matrícula ou E-mail"
                      value={loginInput}
                      onChange={(e) => setLoginInput(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Campo 2: Senha (Com ícone de olho para exibir/ocultar) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Senha de Acesso
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={senhaInput}
                      onChange={(e) => setSenhaInput(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Botão Entrar */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isSubmitting ? 'Autenticando...' : 'Entrar no Sistema'}</span>
                </button>


              </form>
            ) : (
              /* FORMULÁRIO 2: SIGN UP DO LÍDER (PRIMEIRO ACESSO DA LIDERANÇA) */
              <form onSubmit={handleLeaderSignUpSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nome Completo do Líder
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: John Tavares"
                    value={leaderNome}
                    onChange={(e) => setLeaderNome(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Matrícula
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 9001"
                      value={leaderMatricula}
                      onChange={(e) => setLeaderMatricula(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      E-mail (Opcional)
                    </label>
                    <input
                      type="email"
                      placeholder="lider@passaturno.com"
                      value={leaderEmail}
                      onChange={(e) => setLeaderEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Criar Senha
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={leaderSenha}
                      onChange={(e) => setLeaderSenha(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Confirmar Senha
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={leaderSenhaConfirm}
                      onChange={(e) => setLeaderSenhaConfirm(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Cadastrando...' : 'Cadastrar Líder da Turma'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Rodapé Informativo */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Primeiro Acesso do Líder</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Controle de Turno
            </span>
          </div>

        </div>

      </div>

    </div>
  );
};
