'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { isIncidentFromToday, getTodayYMDInBR } from '@/lib/turma';
import { getBoletimConfig, saveBoletimConfig, subscribeBoletimConfigRealtime } from '@/lib/boletimConfig';
import { getBoletimCarteira, saveBoletimCarteira, subscribeBoletimCarteiraRealtime } from '@/lib/boletimCarteira';

const BOLETIM_STORAGE_KEY = 'passaturno-boletim-2h';

interface TwoHourReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: IncidentType[];
  activeShift: ShiftType | null;
  currentUser?: any;
}

export const TwoHourReportModal: React.FC<TwoHourReportModalProps> = ({
  isOpen,
  onClose,
  incidents,
  activeShift,
  currentUser,
}) => {
  const [copied, setCopied] = useState(false);
  const [lastSentTime, setLastSentTime] = useState<string | null>(null);
  // Estados da Carteira de Incidentes (Editáveis pelo operador — chamados abertos da fila)
  const [carteiraTotal, setCarteiraTotal] = useState('00');
  const [carteiraAndamento, setCarteiraAndamento] = useState('00');
  const [carteiraAberto, setCarteiraAberto] = useState('00');
  const [carteiraPendente, setCarteiraPendente] = useState('00');

  // Estados personalizáveis de GPS e Despacho
  const [equipSemDespacho, setEquipSemDespacho] = useState('EC10, PZ15, PZ20, PZ21, PZ42, PZ43, TT52, TT53, TT81, TT84');
  const [equipSemGps, setEquipSemGps] = useState('TT57');
  const [equipPreventiva, setEquipPreventiva] = useState('EC17, PZ02, TT84, TT85');
  const [equipManutencao, setEquipManutencao] = useState('PZ14, PZ47, TT56');

  // Equipes
  const [equipeSonda, setEquipeSonda] = useState('Valdenir / Vitor / Gustavo');
  const [liderVale, setLiderVale] = useState('Vinicius');
  const [ausencia, setAusencia] = useState('Baia (férias)');

  const [customReportText, setCustomReportText] = useState('');
  const [isCustomEdited, setIsCustomEdited] = useState(false);

  // Guarda se o operador JÁ editou algum valor nesta sessão do modal.
  // A partir do primeiro ajuste manual, os campos NÃO podem mais ser sobrescritos
  // automaticamente pelos efeitos (carteira) nem pelo sync do turno (equipes).
  const userTouchedRef = useRef(false);
  // Guarda se a configuração fixa já foi carregada do banco nesta turma
  const configLoadedRef = useRef(false);

  // A cada abertura do modal, resetar o "editado" para carregar os dados salvos do banco
  useEffect(() => {
    if (isOpen) {
      userTouchedRef.current = false;
    }
  }, [isOpen]);

  const markUserEdited = () => {
    userTouchedRef.current = true;
  };

  const turmaBoletim = (activeShift?.turma || currentUser?.turma || 'A').toUpperCase();

  const applyConfigToFields = (config: any) => {
    if (typeof config.equipeSonda === 'string') setEquipeSonda(config.equipeSonda);
    if (typeof config.liderVale === 'string') setLiderVale(config.liderVale);
    if (typeof config.ausencia === 'string' && config.ausencia.trim()) {
      setAusencia(config.ausencia);
    } else if (typeof config.ausenciaNome === 'string' && config.ausenciaNome.trim()) {
      setAusencia(
        config.ausenciaMotivo && config.ausenciaMotivo.trim()
          ? `${config.ausenciaNome} (${config.ausenciaMotivo})`
          : config.ausenciaNome
      );
    }
    if (typeof config.equipSemDespacho === 'string') setEquipSemDespacho(config.equipSemDespacho);
    if (typeof config.equipSemGps === 'string') setEquipSemGps(config.equipSemGps);
    if (typeof config.equipPreventiva === 'string') setEquipPreventiva(config.equipPreventiva);
    if (typeof config.equipManutencao === 'string') setEquipManutencao(config.equipManutencao);
  };

  // Carregar a configuração fixa do boletim direto do banco (compartilhada entre todos)
  useEffect(() => {
    if (!isOpen) return;
    getBoletimConfig(turmaBoletim).then((config) => {
      if (config) {
        configLoadedRef.current = true;
        if (!userTouchedRef.current) {
          applyConfigToFields(config);
        }
      }
    }).catch(() => {});
  }, [isOpen, turmaBoletim]);

  // A carteira segue o ciclo do turno: a chave é a data de INÍCIO do turno ativo
  // (persiste até o fechamento, mesmo que o turno atravesse a meia-noite)
  const dataCarteira = activeShift?.data || getTodayYMDInBR();

  // Carregar os números diários da CARTEIRA (chamados abertos da fila) salvos no banco
  useEffect(() => {
    if (!isOpen) return;
    getBoletimCarteira(turmaBoletim, dataCarteira).then((row) => {
      if (row && !userTouchedRef.current) {
        if (typeof row.total === 'string') setCarteiraTotal(row.total);
        if (typeof row.andamento === 'string') setCarteiraAndamento(row.andamento);
        if (typeof row.aberto === 'string') setCarteiraAberto(row.aberto);
        if (typeof row.pendente === 'string') setCarteiraPendente(row.pendente);
      }
    }).catch(() => {});
  }, [isOpen, turmaBoletim, dataCarteira]);

  // Salvar no banco (com debounce) os campos fixos editados pelo operador
  useEffect(() => {
    if (!userTouchedRef.current) return;
    const t = setTimeout(() => {
      saveBoletimConfig(turmaBoletim, {
        equipeSonda,
        liderVale,
        ausencia,
        equipSemDespacho,
        equipSemGps,
        equipPreventiva,
        equipManutencao,
      });
    }, 800);
    return () => clearTimeout(t);
  }, [equipeSonda, liderVale, ausencia, equipSemDespacho, equipSemGps, equipPreventiva, equipManutencao, turmaBoletim]);

  // Salvar no banco (com debounce) os números do turno da carteira editados pelo operador
  useEffect(() => {
    if (!userTouchedRef.current) return;
    const t = setTimeout(() => {
      saveBoletimCarteira(turmaBoletim, dataCarteira, {
        total: carteiraTotal,
        andamento: carteiraAndamento,
        aberto: carteiraAberto,
        pendente: carteiraPendente,
      });
    }, 800);
    return () => clearTimeout(t);
  }, [carteiraTotal, carteiraAndamento, carteiraAberto, carteiraPendente, turmaBoletim, dataCarteira]);

  // Realtime: se outro operador salvar a configuração, atualiza este modal (sem sobrescrever edições locais)
  useEffect(() => {
    const unsubscribe = subscribeBoletimConfigRealtime((config) => {
      if (userTouchedRef.current) return;
      if (config.turma !== turmaBoletim) return;
      configLoadedRef.current = true;
      applyConfigToFields(config);
    });
    return unsubscribe;
  }, [turmaBoletim]);

  // Realtime: se outro operador salvar a carteira do turno, atualiza este modal
  useEffect(() => {
    const unsubscribe = subscribeBoletimCarteiraRealtime((row) => {
      if (userTouchedRef.current) return;
      if (row.turma !== turmaBoletim || row.data !== dataCarteira) return;
      if (typeof row.total === 'string') setCarteiraTotal(row.total);
      if (typeof row.andamento === 'string') setCarteiraAndamento(row.andamento);
      if (typeof row.aberto === 'string') setCarteiraAberto(row.aberto);
      if (typeof row.pendente === 'string') setCarteiraPendente(row.pendente);
    });
    return unsubscribe;
  }, [turmaBoletim, dataCarteira]);

  // Edição dos números da carteira: sempre regenera o texto final com os novos
  // valores (desbloqueia o preview caso o operador tenha editado a mensagem antes).
  const handleCarteiraEdit =
    (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
      markUserEdited();
      setIsCustomEdited(false);
      setter(e.target.value);
    };

  // Restaurar valores salvos no navegador (somente para o dia de HOJE)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(BOLETIM_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.dataYmd !== getTodayYMDInBR()) return; // Dados de outro dia: descartar e recalcular

      if (typeof data.carteiraTotal === 'string') setCarteiraTotal(data.carteiraTotal);
      if (typeof data.carteiraAndamento === 'string') setCarteiraAndamento(data.carteiraAndamento);
      if (typeof data.carteiraAberto === 'string') setCarteiraAberto(data.carteiraAberto);
      if (typeof data.carteiraPendente === 'string') setCarteiraPendente(data.carteiraPendente);
      if (typeof data.equipSemDespacho === 'string') setEquipSemDespacho(data.equipSemDespacho);
      if (typeof data.equipSemGps === 'string') setEquipSemGps(data.equipSemGps);
      if (typeof data.equipPreventiva === 'string') setEquipPreventiva(data.equipPreventiva);
      if (typeof data.equipManutencao === 'string') setEquipManutencao(data.equipManutencao);
      if (typeof data.equipeSonda === 'string') setEquipeSonda(data.equipeSonda);
      if (typeof data.liderVale === 'string') setLiderVale(data.liderVale);
      if (typeof data.ausencia === 'string') setAusencia(data.ausencia);
      // NOTA: o texto da mensagem NÃO é restaurado nem congelado. Ele é sempre
      // regenerado dinamicamente a partir dos valores acima, refletindo os números
      // editados no momento de copiar/enviar.
    } catch (e) {
      console.error('Erro ao restaurar boletim de 2h:', e);
    }
  }, []);

  // Persistir as edições do operador (apenas depois que ele tocar em algum campo)
  useEffect(() => {
    if (!userTouchedRef.current) return;
    try {
      localStorage.setItem(
        BOLETIM_STORAGE_KEY,
        JSON.stringify({
          dataYmd: getTodayYMDInBR(),
          carteiraTotal,
          carteiraAndamento,
          carteiraAberto,
          carteiraPendente,
          equipSemDespacho,
          equipSemGps,
          equipPreventiva,
          equipManutencao,
          equipeSonda,
          liderVale,
          ausencia,
        })
      );
    } catch (e) {
      console.error('Erro ao salvar boletim de 2h:', e);
    }
  }, [carteiraTotal, carteiraAndamento, carteiraAberto, carteiraPendente, equipSemDespacho, equipSemGps, equipPreventiva, equipManutencao, equipeSonda, liderVale, ausencia]);

  // Sincronizar dados do turno (equipes/GPS) apenas se a configuração não veio do banco
  useEffect(() => {
    if (activeShift && !userTouchedRef.current && !configLoadedRef.current) {
      if (activeShift.equipeSonda) setEquipeSonda(activeShift.equipeSonda);
      if (activeShift.liderVale) setLiderVale(activeShift.liderVale);
      if (activeShift.ausencias) setAusencia(activeShift.ausencias);
      if (activeShift.equipamentosSemDespacho) setEquipSemDespacho(activeShift.equipamentosSemDespacho);
      if (activeShift.equipamentosSemGps) setEquipSemGps(activeShift.equipamentosSemGps);
      if (activeShift.equipamentosPreventiva) setEquipPreventiva(activeShift.equipamentosPreventiva);
      if (activeShift.equipamentosManutencao) setEquipManutencao(activeShift.equipamentosManutencao);
    }
  }, [activeShift]);

  // Gerar o texto completo formatado para envio de 2 em 2 horas
  const generateReportText = () => {
    const now = new Date();
    const dataFormatada = now.toLocaleDateString('pt-BR');
    const pad = (n: number) => String(n).padStart(2, '0');

    const tipoTurno = currentUser?.periodoTurno 
      ? (currentUser.periodoTurno === 'Noite' ? 'Noturno' : 'Diurno') 
      : (activeShift?.tipoTurno || 'Diurno');

    const horarioTurno = currentUser?.horarioTurno || '07:00 às 19:00';
    const nomeOperador = currentUser?.nome || activeShift?.responsavelNome || 'John Tavares';
    const letraTurma = activeShift?.turma || currentUser?.turma || 'A';

    // Incluir apenas as atividades do dia atual (estritamente HOJE)
    const todayIncidents = (incidents || []).filter((i) => isIncidentFromToday(i));
    const activeIncidents = todayIncidents.filter(
      (i) => i.status !== 'FINALIZADO' && i.status !== 'RETROAGIDO'
    );
    // Atividades em andamento divididas por forma de atuação:
    // REMOTO (MONITORAMENTO) x CORRETIVA (campo)
    const isRemoto = (inc: IncidentType) =>
      ((inc.divisaoAtuacao || 'MONITORAMENTO') as string).toUpperCase() !== 'CORRETIVA_CAMPO';
    const remotoIncidents = activeIncidents.filter(isRemoto);
    const corretivaIncidents = activeIncidents.filter((inc) => !isRemoto(inc));
    const noCodigoCount = activeIncidents.filter((i) => i.noCodigo).length;

    const formatEquipInfo = (inc: IncidentType) => {
      const horaParada = new Date(inc.dataHoraParada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const horaAcionamento = inc.dataHoraAcionamento
        ? new Date(inc.dataHoraAcionamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : horaParada;
      const previsao = inc.previsaoLiberacao || '---';

      let line = `Equipamento: ${inc.tag}\n`;
      line += `Ocorrência: ${inc.falha.toUpperCase()}\n`;
      line += `Diagnóstico: ${inc.sintoma || inc.observacao || ''}\n`;
      line += `Hora da Parada: ${horaParada}\n`;
      line += `Hora de Acionamento: ${horaAcionamento}\n`;
      line += `Previsão de Liberação: ${previsao}\n\n`;
      return line;
    };

    let text = `TURNO: ${tipoTurno}\n`;
    text += `HORÁRIO: ${horarioTurno}\n`;
    text += `ESCALA: ${activeShift?.escala || '2x3'}\n`;
    text += `LETRA: ${letraTurma}\n`;
    text += `DATA: ${dataFormatada}\n`;
    text += `EQUIPE: _ ${equipeSonda} _\n`;
    text += `MONITORAMENTO: ${nomeOperador}\n`;
    if (ausencia) text += `AUSÊNCIA: ${ausencia}\n`;
    text += `\n`;

    text += `${carteiraTotal} - INCIDENTES NA CARTEIRA\n`;
    text += `${carteiraAndamento} - EM ANDAMENTO\n`;
    text += `${carteiraAberto} - ABERTO\n`;
    text += `${carteiraPendente} - PENDENTE\n\n`;

    text += `\n*${pad(noCodigoCount)} - EQUIPAMENTO EM CÓDIGO*\n\n`;

    text += `${pad(remotoIncidents.length)} - EQUIPAMENTO EM ANDAMENTO - REMOTO (MONITORAMENTO)\n\n`;
    if (remotoIncidents.length === 0) {
      text += `Nenhum equipamento em andamento (remoto/monitoramento).\n\n`;
    } else {
      remotoIncidents.forEach((inc) => {
        text += formatEquipInfo(inc);
      });
    }

    text += `${pad(corretivaIncidents.length)} - EQUIPAMENTO EM ANDAMENTO - CORRETIVA\n\n`;
    if (corretivaIncidents.length === 0) {
      text += `Nenhum equipamento em andamento (corretiva).\n\n`;
    } else {
      corretivaIncidents.forEach((inc) => {
        text += formatEquipInfo(inc);
      });
    }

    return text.trim();
  };

  useEffect(() => {
    if (isOpen && !isCustomEdited) {
      setCustomReportText(generateReportText());
    }
  }, [isOpen, incidents, activeShift, currentUser, carteiraTotal, carteiraAndamento, carteiraAberto, carteiraPendente, equipSemDespacho, equipSemGps, equipPreventiva, equipManutencao, equipeSonda, liderVale, ausencia, isCustomEdited]);

  if (!isOpen) return null;

  const handleCopy = () => {
    const textToCopy = customReportText || generateReportText();
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setLastSentTime(nowTime);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSendWhatsapp = () => {
    const textToSend = customReportText || generateReportText();
    const encodedText = encodeURIComponent(textToSend);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setLastSentTime(nowTime);
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
            <span className="flex items-center gap-1.5">
              <span>Pré-visualização da Mensagem WhatsApp</span>
              <span className="text-[10px] font-sans font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                ✏️ Editável
              </span>
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Você pode alterar o texto diretamente antes de copiar ou enviar
            </span>
          </label>

          <textarea
            value={customReportText}
            onChange={(e) => {
              markUserEdited();
              setIsCustomEdited(true);
              setCustomReportText(e.target.value);
            }}
            rows={10}
            className="w-full bg-slate-900 dark:bg-slate-950 text-slate-100 font-mono text-xs p-4 rounded-2xl border border-slate-800 focus:outline-none focus:border-emerald-500 leading-relaxed shadow-inner custom-scrollbar resize-y"
            placeholder="Edite a mensagem do boletim de 2h..."
          />
        </div>

        {/* Configuração Editável dos Números da Carteira de Incidentes */}
        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
          <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-sky-600" />
            Editar Números da Carteira (Chamados Abertos na Fila — atualizados diariamente):
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Total Carteira</label>
              <input
                type="text"
                value={carteiraTotal}
                onChange={handleCarteiraEdit(setCarteiraTotal)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white font-mono font-bold text-center"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-rose-600 dark:text-rose-400 mb-0.5">Em Andamento</label>
              <input
                type="text"
                value={carteiraAndamento}
                onChange={handleCarteiraEdit(setCarteiraAndamento)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-rose-700 dark:text-rose-300 font-mono font-bold text-center"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 mb-0.5">Aberto</label>
              <input
                type="text"
                value={carteiraAberto}
                onChange={handleCarteiraEdit(setCarteiraAberto)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-amber-700 dark:text-amber-300 font-mono font-bold text-center"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-sky-600 dark:text-sky-400 mb-0.5">Pendente</label>
              <input
                type="text"
                value={carteiraPendente}
                onChange={handleCarteiraEdit(setCarteiraPendente)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-sky-700 dark:text-sky-300 font-mono font-bold text-center"
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
