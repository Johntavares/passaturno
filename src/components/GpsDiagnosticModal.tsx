'use client';

import React, { useState, useEffect } from 'react';
import { ShiftType } from '@/types';
import { 
  X, 
  Radio, 
  Copy, 
  Check, 
  Send, 
  CheckCircle2, 
  Wrench, 
  AlertTriangle,
  FileText
} from 'lucide-react';

interface GpsDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeShift: ShiftType | null;
}

export const GpsDiagnosticModal: React.FC<GpsDiagnosticModalProps> = ({
  isOpen,
  onClose,
  activeShift,
}) => {
  const [copied, setCopied] = useState(false);

  // Campos de Diagnóstico de GPS e Despacho
  const [equipManutencao, setEquipManutencao] = useState('PZ14, PZ47, TT56');
  const [equipPreventiva, setEquipPreventiva] = useState('EC17, PZ02, TT84, TT85');
  const [equipSemGps, setEquipSemGps] = useState('TT57');
  const [codigoAcidente, setCodigoAcidente] = useState('');
  const [paradaComSemPrevisao, setParadaComSemPrevisao] = useState('');
  const [equipSemDespacho, setEquipSemDespacho] = useState(
    'EC10, PZ15, PZ20, PZ21, PZ42, PZ43, TT52, TT53, TT81, TT84'
  );

  useEffect(() => {
    if (activeShift) {
      if (activeShift.equipamentosManutencao) setEquipManutencao(activeShift.equipamentosManutencao);
      if (activeShift.equipamentosPreventiva) setEquipPreventiva(activeShift.equipamentosPreventiva);
      if (activeShift.equipamentosSemGps) setEquipSemGps(activeShift.equipamentosSemGps);
      if (activeShift.equipamentosSemDespacho) setEquipSemDespacho(activeShift.equipamentosSemDespacho);
    }
  }, [activeShift]);

  if (!isOpen) return null;

  const generateGpsText = () => {
    let text = `Status de Operação – Diagnóstico de GPS\n`;
    text += `- Em manutenção: ${equipManutencao || 'Nenhum'}\n`;
    text += `- Em preventiva: ${equipPreventiva || 'Nenhum'}\n`;
    text += `- Operando com falha de GPS: ${equipSemGps || 'Nenhum'}\n`;
    text += `- Código de acidente: ${codigoAcidente}\n`;
    text += `- Parada Com/Sem previsão: ${paradaComSemPrevisao}\n\n`;

    if (equipSemDespacho) {
      text += `Observação:\n`;
      equipSemDespacho.split(',').forEach((e) => {
        if (e.trim()) text += `${e.trim()} - Fora do sistema do Despacho.\n`;
      });
      text += `\n`;
    }

    text += `Todos os demais equipamentos com status verde no gráfico estão operando normalmente e com GPS.`;

    return text;
  };

  const handleCopy = () => {
    const text = generateGpsText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsapp = () => {
    const text = generateGpsText();
    const encodedText = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative my-8 text-slate-800 dark:text-slate-100 animate-fadeIn">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-2xl border border-sky-200 dark:border-sky-800">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Reporte de Diagnóstico de GPS & Frota
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Relatório separado para disponibilidade de GPS, manutenção e sistema do Despacho
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário de Edição do Diagnóstico GPS */}
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                🛠️ Em Manutenção
              </label>
              <input
                type="text"
                value={equipManutencao}
                onChange={(e) => setEquipManutencao(e.target.value)}
                placeholder="ex: PZ14, PZ47, TT56"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ⚙️ Em Preventiva
              </label>
              <input
                type="text"
                value={equipPreventiva}
                onChange={(e) => setEquipPreventiva(e.target.value)}
                placeholder="ex: EC17, PZ02, TT84"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">
                ⚠️ Falha de GPS
              </label>
              <input
                type="text"
                value={equipSemGps}
                onChange={(e) => setEquipSemGps(e.target.value)}
                placeholder="ex: TT57"
                className="w-full bg-amber-50/70 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-1.5 text-xs text-amber-900 dark:text-amber-200 font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              📝 Equipamentos Fora do Sistema do Despacho (separados por vírgula)
            </label>
            <textarea
              rows={2}
              value={equipSemDespacho}
              onChange={(e) => setEquipSemDespacho(e.target.value)}
              placeholder="ex: EC10, PZ15, PZ20, PZ21, PZ42, PZ43, TT52, TT53, TT81, TT84"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white font-mono"
            />
          </div>
        </div>

        {/* Pré-visualização do Texto Limpo (Sem título / Sem ícones no corpo) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Texto Formatado para Cópia / Envio:
          </label>
          <div className="bg-slate-900 dark:bg-slate-950 text-slate-100 font-mono text-xs p-4 rounded-2xl border border-slate-800 max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
            {generateGpsText()}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-5">
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Copiado com Sucesso!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copiar Texto Diagnóstico</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSendWhatsapp}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
            <span>Enviar Diagnóstico GPS no WhatsApp</span>
          </button>
        </div>

      </div>
    </div>
  );
};
