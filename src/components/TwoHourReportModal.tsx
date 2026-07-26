'use client';

import React, { useState, useEffect } from 'react';
import { IncidentType, ShiftType } from '@/types';
import { 
  X, 
  Clock, 
  Send, 
  Copy, 
  Check, 
  RefreshCw, 
  Share2, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  Users,
  Radio,
  FileText
} from 'lucide-react';

interface TwoHourReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: IncidentType[];
  activeShift: ShiftType | null;
}

export const TwoHourReportModal: React.FC<TwoHourReportModalProps> = ({
  isOpen,
  onClose,
  incidents,
  activeShift,
}) => {
  const [copied, setCopied] = useState(false);
  const [lastSentTime, setLastSentTime] = useState<string | null>(null);

  // Estados personalizáveis de GPS e Despacho
  const [equipSemDespacho, setEquipSemDespacho] = useState('EC10, PZ15, PZ20, PZ21, PZ42, PZ43, TT52, TT53, TT81, TT84');
  const [equipSemGps, setEquipSemGps] = useState('TT57, TT92');
  const [equipPreventiva, setEquipPreventiva] = useState('EC17, PZ02, TT84, TT85');
  const [equipManutencao, setEquipManutencao] = useState('PZ14, PZ47, TT56');

  // Equipes
  const [equipeSonda, setEquipeSonda] = useState('Valdenir / Vitor / Gustavo');
  const [liderVale, setLiderVale] = useState('Vinicius');
  const [ausencia, setAusencia] = useState('Baia (férias)');

  useEffect(() => {
    if (activeShift) {
      if (activeShift.equipeSonda) setEquipeSonda(activeShift.equipeSonda);
      if (activeShift.liderVale) setLiderVale(activeShift.liderVale);
      if (activeShift.ausencias) setAusencia(activeShift.ausencias);
      if (activeShift.equipamentosSemDespacho) setEquipSemDespacho(activeShift.equipamentosSemDespacho);
      if (activeShift.equipamentosSemGps) setEquipSemGps(activeShift.equipamentosSemGps);
      if (activeShift.equipamentosPreventiva) setEquipPreventiva(activeShift.equipamentosPreventiva);
      if (activeShift.equipamentosManutencao) setEquipManutencao(activeShift.equipamentosManutencao);
    }
  }, [activeShift]);

  if (!isOpen) return null;

  // Cálculo de estatísticas da carteira de atendimentos
  const totalCarteira = incidents.length;
  const emAndamento = incidents.filter(i => i.status === 'EM_ANDAMENTO').length;
  const emAberto = incidents.filter(i => i.status === 'AGUARDANDO').length;
  const concluídos = incidents.filter(i => i.status === 'FINALIZADO').length;

  const activeIncidents = incidents.filter(i => i.status !== 'FINALIZADO');

  // Gerar o texto completo formatado para envio de 2 em 2 horas
  const generateReportText = () => {
    const now = new Date();
    const horaFormatada = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dataFormatada = now.toLocaleDateString('pt-BR');

    let text = `📊 *BOLETIM DE AUTOMAÇÃO DE 2 HORAS*\n`;
    text += `📅 *Data:* ${dataFormatada} às ${horaFormatada}\n`;
    text += `🔄 *Turno:* ${activeShift?.tipoTurno || 'Diurno'} | *Escala:* ${activeShift?.escala || '2x3'} | *Turma:* ${activeShift?.turma || 'C'}\n`;
    text += `👥 *EQUIPE:* _${equipeSonda}_\n`;
    text += `🎧 *MONITORAMENTO (CCO):* ${activeShift?.responsavelNome || 'John Tavares'}\n`;
    if (ausencia) text += `🏖️ *AUSÊNCIA:* ${ausencia}\n`;
    text += `\n`;

    text += `📋 *RESUMO DA CARTEIRA DE ATENDIMENTOS*\n`;
    text += `• *${totalCarteira}* - INCIDENTES NA CARTEIRA\n`;
    text += `• *${emAndamento}* - EM ANDAMENTO\n`;
    text += `• *${emAberto}* - EM ABERTO\n`;
    text += `• *${concluídos}* - CONCLUÍDOS NESTE TURNO\n\n`;

    text += `🚜 *EQUIPAMENTOS EM CÓDIGO DA AUTOMAÇÃO*\n`;
    if (activeIncidents.length === 0) {
      text += `_Nenhum equipamento parado por automação no momento._\n\n`;
    } else {
      activeIncidents.forEach(inc => {
        const horaParada = new Date(inc.dataHoraParada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const horaAcionamento = inc.dataHoraAcionamento 
          ? new Date(inc.dataHoraAcionamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          : horaParada;
        const previsao = inc.previsaoLiberacao || '---';

        text += `• *Equipamento:* ${inc.tag}\n`;
        text += `  *Ocorrência:* ${inc.falha}\n`;
        text += `  *Parada:* ${horaParada} | *Acionamento:* ${horaAcionamento} | *Previsão:* ${previsao}\n\n`;
      });
    }

    text += `📡 *DIAGNÓSTICO DE GPS E OPERAÇÃO*\n`;
    if (equipManutencao) text += `🛠️ *Em manutenção:* ${equipManutencao}\n`;
    if (equipPreventiva) text += `⚙️ *Em preventiva:* ${equipPreventiva}\n`;
    if (equipSemGps) text += `⚠️ *Falha de GPS:* ${equipSemGps}\n\n`;

    if (equipSemDespacho) {
      text += `📝 *Fora do Sistema do Despacho:*\n`;
      equipSemDespacho.split(',').forEach(e => {
        if (e.trim()) text += `• ${e.trim()} - Fora do sistema do Despacho.\n`;
      });
      text += `\n`;
    }

    text += `✅ _Todos os demais equipamentos com status verde estão operando normalmente e com GPS._`;

    return text;
  };

  const handleCopy = () => {
    const text = generateReportText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setLastSentTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsapp = () => {
    const text = generateReportText();
    const encodedText = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
    setLastSentTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative my-8 text-slate-800 dark:text-slate-100 animate-fadeIn">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Boletim de Automação de 2 Horas
                </h3>
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-200 dark:border-emerald-800">
                  Envio Periódico
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Relatório consolidado gerado automaticamente com 1 clique para WhatsApp e CCO
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

        {/* Status do envio */}
        {lastSentTime && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Último relatório de 2 horas enviado/copiado às <strong>{lastSentTime}</strong></span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-emerald-900 px-2 py-0.5 rounded-full border border-emerald-200">
              Próximo envio recomendado em 2h
            </span>
          </div>
        )}

        {/* Pré-visualização da Mensagem */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Pré-visualização da Mensagem (Pronta para Enviar):</span>
            <span className="text-[11px] font-medium text-slate-400">
              Gerada com dados em tempo real da carteira
            </span>
          </label>

          <div className="bg-slate-900 dark:bg-slate-950 text-slate-100 font-mono text-xs p-4 rounded-2xl border border-slate-800 max-h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner selection:bg-sky-500 selection:text-white">
            {generateReportText()}
          </div>
        </div>

        {/* Configurações Rápida de GPS / Manutenção para o Relatório */}
        <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
          <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-sky-600" />
            Ajuste Rápido de Diagnósticos (Incluso no Relatório):
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">⚠️ Falha de GPS</label>
              <input
                type="text"
                value={equipSemGps}
                onChange={(e) => setEquipSemGps(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">⚙️ Em Preventiva</label>
              <input
                type="text"
                value={equipPreventiva}
                onChange={(e) => setEquipPreventiva(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">🛠️ Em Manutenção</label>
              <input
                type="text"
                value={equipManutencao}
                onChange={(e) => setEquipManutencao(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-5">
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Copiado para Área de Transferência!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span>Copiar Texto do Boletim</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSendWhatsapp}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
            <span>Enviar no WhatsApp (1 Clique)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
