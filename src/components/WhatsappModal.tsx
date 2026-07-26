'use client';

import React, { useState } from 'react';
import { IncidentType } from '@/types';
import { X, MessageSquare, Copy, Check } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';

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

  if (!isOpen || !incident) return null;

  const paradaDate = new Date(incident.dataHoraParada);
  const liberacaoDate = incident.dataHoraLiberacao ? new Date(incident.dataHoraLiberacao) : null;
  
  let tempoTotalStr = '';
  if (liberacaoDate) {
    const mins = differenceInMinutes(liberacaoDate, paradaDate);
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    tempoTotalStr = hours > 0 ? `${hours}h ${remMins}min` : `${remMins} min`;
  }

  const generateWhatsappText = () => {
    let text = `🚨 *AUTOMAÇÃO INDUSTRIAL*\n\n`;
    text += `🏷️ *TAG:* ${incident.tag}\n`;
    text += `⚙️ *Equipamento:* ${incident.equipamentoNome}\n`;
    text += `📍 *Área:* ${incident.area}\n`;
    text += `⚠️ *Prioridade:* ${incident.prioridade}\n\n`;
    text += `🔧 *Falha:*\n${incident.falha}\n\n`;
    text += `⏰ *Hora parada:*\n${format(paradaDate, 'HH:mm • dd/MM/yyyy')}\n\n`;
    text += `📋 *Status:*\n${incident.status}\n\n`;

    if (liberacaoDate) {
      text += `🏁 *Hora liberação:*\n${format(liberacaoDate, 'HH:mm • dd/MM/yyyy')}\n\n`;
      text += `⏳ *Tempo total de parada:*\n${tempoTotalStr}\n\n`;
    }

    if (incident.solucao) {
      text += `🛠️ *Solução aplicada:*\n${incident.solucao}\n\n`;
    }

    if (incident.motivoEspera) {
      text += `🟡 *Motivo do aguardo:*\n${incident.motivoEspera}\n\n`;
    }

    if (incident.proximaAcao) {
      text += `➡️ *Próxima ação:*\n${incident.proximaAcao}\n\n`;
    }

    text += `👤 *Responsável:*\n${incident.responsavel}`;

    return text;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateWhatsappText());
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
              <h3 className="text-base font-bold text-slate-800">Gerador de Mensagem WhatsApp</h3>
              <p className="text-xs text-slate-500">Texto formatado para envio no grupo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Text Area */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
          <pre className="text-xs font-mono text-emerald-900 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto pr-1 select-all">
            {generateWhatsappText()}
          </pre>
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
