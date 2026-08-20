'use client';

import React, { useState, useEffect } from 'react';
import { IncidentType } from '@/types';
import { X, MessageSquare, Copy, Check, Edit3 } from 'lucide-react';
import { differenceInMinutes } from 'date-fns';
import { parseStoredDate, formatBRTime } from '@/lib/turma';

interface WhatsappModalProps {
  incident: IncidentType | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsappModal: React.FC<WhatsappModalProps> = ({
  incident,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [editableText, setEditableText] = useState('');

  const generateWhatsappText = (inc: IncidentType) => {
    const paradaDate = parseStoredDate(inc.dataHoraParada);
    const liberacaoDate = inc.dataHoraLiberacao ? parseStoredDate(inc.dataHoraLiberacao) : null;

    let tempoTotalStr = '';
    if (liberacaoDate && paradaDate) {
      const mins = differenceInMinutes(liberacaoDate, paradaDate);
      const hours = Math.floor(mins / 60);
      const remMins = mins % 60;
      tempoTotalStr = hours > 0 ? `${hours}h ${remMins}min` : `${remMins} min`;
    }

    let text = `🚨 *AUTOMAÇÃO INDUSTRIAL*\n\n`;
    text += `🏷️ *TAG:* ${inc.tag}\n`;
    text += `⚙️ *Equipamento:* ${inc.equipamentoNome}\n`;
    text += `📍 *Área:* ${inc.area}\n`;
    text += `⚠️ *Prioridade:* ${inc.prioridade}\n\n`;
    text += `🔧 *Falha:*\n${inc.falha}\n\n`;
    text += `⏰ *Hora parada:*\n${paradaDate ? formatBRTime(paradaDate, { day: '2-digit', month: '2-digit', year: 'numeric' }) : '--:--'}\n\n`;
    text += `📋 *Status:*\n${inc.status}\n\n`;

    if (liberacaoDate) {
      text += `🏁 *Hora liberação:*\n${formatBRTime(liberacaoDate, { day: '2-digit', month: '2-digit', year: 'numeric' })}\n\n`;
      text += `⏳ *Tempo total de parada:*\n${tempoTotalStr}\n\n`;
    }

    if (inc.solucao) {
      text += `🛠️ *Solução aplicada:*\n${inc.solucao}\n\n`;
    }

    if (inc.motivoEspera) {
      text += `🟡 *Motivo do aguardo:*\n${inc.motivoEspera}\n\n`;
    }

    if (inc.proximaAcao) {
      text += `➡️ *Próxima ação:*\n${inc.proximaAcao}\n\n`;
    }

    text += `👤 *Responsável:*\n${inc.responsavel}`;

    return text;
  };

  useEffect(() => {
    if (isOpen && incident) {
      setEditableText(generateWhatsappText(incident));
    }
  }, [isOpen, incident]);

  if (!isOpen || !incident) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(editableText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8 text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                Gerador de Mensagem WhatsApp
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Edit3 className="w-2.5 h-2.5" /> Editável
                </span>
              </h3>
              <p className="text-xs text-slate-500">Texto totalmente editável para personalização antes de copiar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Text Area (Editável pelo Operador) */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-4">
          <textarea
            value={editableText}
            onChange={(e) => setEditableText(e.target.value)}
            rows={12}
            className="w-full text-xs font-mono text-slate-800 bg-white p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed custom-scrollbar resize-y"
            placeholder="Edite a mensagem antes de copiar..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-400 font-mono">Pronto para colar</span>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={handleCopy}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1.5" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1.5" />
                  Copiar Mensagem
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
