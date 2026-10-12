'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erro capturado pelo ErrorBoundary do Next.js:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-slate-800/80 border border-slate-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md space-y-5">
        <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        
        <div>
          <h2 className="text-xl font-black text-white">Falha ao carregar a página</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Ocorreu uma instabilidade temporária na interface. Clique no botão abaixo para restaurar a sessão sem perder seus dados.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            Tentar Novamente
          </button>
          
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    </div>
  );
}
