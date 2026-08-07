'use client';

import React from 'react';
import { IncidentType } from '@/types';
import { 
  CalendarDays, 
  Clock, 
  CheckCircle2, 
  ArrowRightLeft 
} from 'lucide-react';

interface DashboardStatsProps {
  incidents: IncidentType[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ incidents }) => {
  // 1. Atividades do dia (Total de atendimentos registrados)
  const atividadesDoDia = incidents.length;

  // 2. Veio do turno passado (Pendências herdadas não finalizadas ou retroagidas)
  const vindoTurnoPassado = incidents.filter(
    (i) => i.isPendenciaHerdada && i.status !== 'FINALIZADO' && i.status !== 'RETROAGIDO'
  ).length;

  // 3. Em Andamento (Atendimentos atualmente em intervenção)
  const emAndamento = incidents.filter((i) => i.status === 'EM_ANDAMENTO').length;

  // 4. Já Liberados / Retroagidos (Atendimentos concluídos ou retroagidos)
  const jaLiberados = incidents.filter((i) => i.status === 'FINALIZADO' || i.status === 'RETROAGIDO').length;

  // Divisão de Atuações
  const countMonitoramento = incidents.filter((i) => i.divisaoAtuacao !== 'CORRETIVA_CAMPO').length;
  const countCampo = incidents.filter((i) => i.divisaoAtuacao === 'CORRETIVA_CAMPO').length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      
      {/* 1. Atividades do Dia */}
      <div className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-2.5 shadow-2xs hover:border-slate-300 transition-all flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Atividades do Dia
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-black text-slate-900 font-mono">{atividadesDoDia}</span>
            <span className="text-[10px] text-slate-400 font-medium">registradas</span>
          </div>
        </div>
        <div className="p-2 bg-indigo-50/80 text-indigo-600 rounded-lg border border-indigo-100/60">
          <CalendarDays className="w-4 h-4" />
        </div>
      </div>



      {/* 2. Veio do Turno Passado */}
      <div className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-2.5 shadow-2xs hover:border-slate-300 transition-all flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-sky-700 uppercase tracking-wider block">
            Turno Passado
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-black text-sky-700 font-mono">{vindoTurnoPassado}</span>
            <span className="text-[10px] text-sky-500 font-medium">herdadas</span>
          </div>
        </div>
        <div className="p-2 bg-sky-50 text-sky-600 rounded-lg border border-sky-100/60">
          <ArrowRightLeft className="w-4 h-4" />
        </div>
      </div>

      {/* 3. Em Andamento */}
      <div className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-2.5 shadow-2xs hover:border-slate-300 transition-all flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
            Em Andamento
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-black text-amber-600 font-mono">{emAndamento}</span>
            <span className="text-[10px] text-amber-500 font-medium">intervenção</span>
          </div>
        </div>
        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100/60">
          <Clock className="w-4 h-4" />
        </div>
      </div>

      {/* 4. Já Liberados */}
      <div className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-2.5 shadow-2xs hover:border-slate-300 transition-all flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
            Já Liberados
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-black text-emerald-600 font-mono">{jaLiberados}</span>
            <span className="text-[10px] text-emerald-500 font-medium">concluídos</span>
          </div>
        </div>
        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100/60">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      </div>

    </div>
  );
};

