'use client';

import React, { useState } from 'react';
import { IncidentType, ShiftType } from '@/types';
import { FileText, Copy, Check, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface DailySummarySectionProps {
  incidents: IncidentType[];
  activeShift: ShiftType | null;
}

export const DailySummarySection: React.FC<DailySummarySectionProps> = ({
  incidents,
  activeShift,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const importanetes = incidents.filter(
    (i) => (i.prioridade === 'CRITICA' || i.prioridade === 'ALTA') && i.status !== 'FINALIZADO'
  );
  const emAndamento = incidents.filter(
    (i) => (i.status === 'EM_ANDAMENTO' || i.status === 'AGUARDANDO' || i.status === 'PENDENCIA_PROXIMO_TURNO') &&
      i.prioridade !== 'CRITICA' && i.prioridade !== 'ALTA'
  );
  const realizados = incidents.filter((i) => i.status === 'FINALIZADO');

  const todayStr = format(new Date(), 'dd/MM/yyyy');
  const monitoramentoNome = activeShift?.responsavelNome || 'Ronison';
  const turmaStr = activeShift?.turma || 'A';
  const horarioTurnoStr = activeShift?.horarioTurno || '07h às 19h';

  // Gerar o formato exato da mensagem de WhatsApp do usuário
  const generateRealWhatsappText = () => {
    let text = `RELATÓRIO DE PASSAGEM DE TURNO:\n`;
    text += `Data: ${todayStr}\n`;
    text += `Turma: ${turmaStr}\n`;
    text += `Monitoramento: ${monitoramentoNome}\n`;
    text += `Turno: ${horarioTurnoStr}\n\n`;

    text += `Checklist do Malão:\n`;
    text += `Status: ${activeShift?.checklistMalaoStatus || 'Realizado'}\n`;
    if (activeShift?.checklistMalaoFaltantes) {
      text += `Materiais faltantes: ${activeShift.checklistMalaoFaltantes}\n`;
    } else {
      text += `Materiais faltantes: N/A\n`;
    }
    text += `Responsável: ${activeShift?.checklistMalaoResponsavel || monitoramentoNome}\n\n`;

    text += `Solicitação de Material de Reposição:\n`;
    text += `Status: ${activeShift?.solicitacaoMaterialStatus || 'N/A'}\n`;
    text += `Responsável pela Solicitação: ${activeShift?.solicitacaoMaterialResponsavel || monitoramentoNome}\n\n`;

    text += `Anomalias Identificadas: ${activeShift?.anomaliasIdentificadas || 'Nenhuma'}\n\n`;

    text += `Pendências:\n\n`;

    text += `🔴 Importante:\n`;
    if (importanetes.length === 0) {
      text += `Nenhuma pendência crítica.\n`;
    } else {
      importanetes.forEach((item) => {
        text += `🔴 ${item.tag} - ${item.falha}\n`;
      });
    }

    text += `\n🟡 Em andamento:\n`;
    if (emAndamento.length === 0) {
      text += `Nenhum atendimento em andamento.\n`;
    } else {
      emAndamento.forEach((item) => {
        text += `🟡 ${item.tag} - ${item.falha}\n`;
      });
    }

    text += `\n🟢 Realizado:\n`;
    if (realizados.length === 0) {
      text += `Nenhum atendimento realizado no turno.\n`;
    } else {
      realizados.forEach((item) => {
        text += `🟢 ${item.tag} - ${item.falha}\n`;
      });
    }

    text += `\nObservações Gerais: ${activeShift?.observacoes || ''}\n`;

    return text;
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(generateRealWhatsappText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="mb-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden transition-all">
      
      {/* Header Bar */}
      <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              Resumo dos Atendimentos Diários & Passagem de Turno
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                Turma {turmaStr}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Formato padronizado de relatório para envio instantâneo no WhatsApp
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyReport}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Relatório Copiado!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Copiar Relatório WhatsApp
              </>
            )}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 bg-slate-50/30">
          
          {/* Coluna 1 & 2: Visualização dos Blocos Resumidos */}
          <div className="lg:col-span-2 space-y-3">
            
            {/* 🔴 Importante */}
            <div className="bg-white p-3.5 rounded-xl border border-rose-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-700 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-rose-500 mr-2"></span>
                  🔴 Importante (Críticos)
                </span>
                <span className="text-[11px] font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                  {importanetes.length}
                </span>
              </div>
              {importanetes.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Nenhuma pendência crítica registrada no momento.</p>
              ) : (
                <div className="space-y-1.5">
                  {importanetes.map((item) => (
                    <div key={item.id} className="text-xs font-medium text-slate-800 bg-rose-50/50 p-2 rounded-lg border border-rose-100 flex items-center justify-between">
                      <span><strong>{item.tag}</strong> — {item.falha}</span>
                      <span className="text-[10px] text-rose-600 font-bold uppercase">{item.prioridade}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 🟡 Em andamento */}
            <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-700 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
                  🟡 Em andamento
                </span>
                <span className="text-[11px] font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                  {emAndamento.length}
                </span>
              </div>
              {emAndamento.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Nenhum atendimento em andamento no momento.</p>
              ) : (
                <div className="space-y-1.5">
                  {emAndamento.map((item) => (
                    <div key={item.id} className="text-xs text-slate-700 bg-amber-50/40 p-2 rounded-lg border border-amber-100 flex items-center justify-between">
                      <span><strong>{item.tag}</strong> — {item.falha}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{item.responsavel}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 🟢 Realizado */}
            <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-700 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                  🟢 Realizado (Concluídos)
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {realizados.length}
                </span>
              </div>
              {realizados.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Nenhum atendimento concluído hoje ainda.</p>
              ) : (
                <div className="space-y-1.5">
                  {realizados.map((item) => (
                    <div key={item.id} className="text-xs text-slate-700 bg-emerald-50/40 p-2 rounded-lg border border-emerald-100 flex items-center justify-between">
                      <span><strong>{item.tag}</strong> — {item.falha}</span>
                      <span className="text-[10px] text-emerald-700 font-medium">{item.solucao ? 'Resolvido' : 'Concluído'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Coluna 3: Preview da Mensagem Exata do WhatsApp */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
            <span className="text-xs font-bold text-slate-700 mb-2 block font-mono">
              Preview da Mensagem (WhatsApp)
            </span>
            <pre className="flex-1 text-[11px] font-mono bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-slate-700 whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-80 select-all">
              {generateRealWhatsappText()}
            </pre>
          </div>

        </div>
      )}

    </div>
  );
};
