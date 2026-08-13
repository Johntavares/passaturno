'use client';

import React, { useState, useEffect } from 'react';
import { IncidentType, ShiftType } from '@/types';
import { X, Lock, AlertTriangle, Copy, Check, FileText, Star, Flame } from 'lucide-react';
import { format } from 'date-fns';
import { normalizeTurma, isSameDayAsToday, isIncidentFromToday } from '@/lib/turma';

interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeShift: ShiftType | null;
  incidents: IncidentType[];
  onShiftClosed: () => void;
  currentUser?: any;
}

export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({
  isOpen,
  onClose,
  activeShift,
  incidents,
  onShiftClosed,
  currentUser,
}) => {
  const getNextTurmaLetter = (t: string) => {
    const clean = (t || '').toUpperCase().trim();
    if (clean === 'A') return 'B';
    if (clean === 'B') return 'C';
    if (clean === 'C') return 'D';
    if (clean === 'D') return 'A';
    return 'B';
  };

  const initialTurma = normalizeTurma(activeShift?.turma) || normalizeTurma(currentUser?.turma) || 'A';
  const initialResp = activeShift?.responsavelNome || currentUser?.nome || 'Operador';

  const [responsavelSaida, setResponsavelSaida] = useState(initialResp);
  const [turma, setTurma] = useState(initialTurma);
  const [proximaTurma, setProximaTurma] = useState(getNextTurmaLetter(initialTurma));
  const [monitoramento, setMonitoramento] = useState(activeShift?.monitoramento || initialResp);
  const [horarioTurno, setHorarioTurno] = useState(activeShift?.horarioTurno || '07h às 19h');

  // Checklist do Malão
  const [checklistMalaoStatus, setChecklistMalaoStatus] = useState('Realizado');
  const [checklistMalaoFaltantes, setChecklistMalaoFaltantes] = useState('');
  const [checklistMalaoResponsavel, setChecklistMalaoResponsavel] = useState(initialResp);

  // Solicitação de Material de Reposição
  const [solicitacaoMaterialStatus, setSolicitacaoMaterialStatus] = useState('');
  const [solicitacaoMaterialResponsavel, setSolicitacaoMaterialResponsavel] = useState(initialResp);

  // Anomalias Identificadas
  const [anomaliasIdentificadas, setAnomaliasIdentificadas] = useState('');

  // Observações
  const [observacoesTurno, setObservacoesTurno] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lista local de atendimentos para alteração dinâmica de prioridade
  const [localIncidents, setLocalIncidents] = useState<IncidentType[]>(incidents);

  const [customWhatsappText, setCustomWhatsappText] = useState('');
  const [isCustomEdited, setIsCustomEdited] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalIncidents(incidents);
      const effTurma = normalizeTurma(activeShift?.turma) || normalizeTurma(currentUser?.turma) || 'A';
      const effResp = activeShift?.responsavelNome || currentUser?.nome || 'Operador';
      setTurma(effTurma);
      setProximaTurma(getNextTurmaLetter(effTurma));
      setResponsavelSaida(effResp);
      setMonitoramento(activeShift?.monitoramento || effResp);
      setChecklistMalaoResponsavel(effResp);
      setSolicitacaoMaterialResponsavel(effResp);
    }
  }, [isOpen, activeShift, currentUser, incidents]);

  // Determinar o momento exato de início do turno ativo atual
  let shiftStartMs = 0;
  if (activeShift?.horaInicio) {
    shiftStartMs = new Date(activeShift.horaInicio).getTime();
  } else if (activeShift?.criadoEm) {
    shiftStartMs = new Date(activeShift.criadoEm).getTime();
  } else {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    shiftStartMs = todayStart.getTime();
  }

  const currentTurma = normalizeTurma(turma) || normalizeTurma(activeShift?.turma) || normalizeTurma(currentUser?.turma) || 'A';

  // Considerar estritamente apenas ocorrências do dia de HOJE
  const shiftIncidents = (localIncidents || []).filter(
    (item) => isIncidentFromToday(item)
  );

  const pendentesLista = shiftIncidents.filter((i) => i.status !== 'FINALIZADO' && i.status !== 'RETROAGIDO');
  const importanetes = shiftIncidents.filter(
    (i) => (i.prioridade === 'CRITICA' || i.prioridade === 'ALTA') && i.status !== 'FINALIZADO' && i.status !== 'RETROAGIDO'
  );
  const emAndamento = shiftIncidents.filter(
    (i) => i.status !== 'FINALIZADO' && i.status !== 'RETROAGIDO' && i.prioridade !== 'CRITICA' && i.prioridade !== 'ALTA'
  );
  const realizados = shiftIncidents.filter((i) => i.status === 'FINALIZADO' || i.status === 'RETROAGIDO');

  const handleTogglePriority = async (incidentId: string) => {
    const target = localIncidents.find((i) => i.id === incidentId);
    if (!target) return;

    const isCurrentlyPriority = target.prioridade === 'ALTA' || target.prioridade === 'CRITICA';
    const newPriority = isCurrentlyPriority ? 'MEDIA' : 'ALTA';

    setLocalIncidents((prev) =>
      prev.map((i) => (i.id === incidentId ? { ...i, prioridade: newPriority } : i))
    );

    try {
      await fetch(`/api/atendimentos/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prioridade: newPriority,
          logDescription: `Atendimento marcado como ${newPriority === 'ALTA' ? 'Prioritário' : 'Normal'} no encerramento de turno.`,
        }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Gerar o formato exato fornecido na imagem de exemplo do usuário
  const generateExactWhatsappText = () => {
    const todayStr = format(new Date(), 'dd/MM/yyyy');
    let text = `RELATÓRIO DE PASSAGEM DE TURNO:\n`;
    text += `Data: ${todayStr}\n`;
    text += `Turma de Saída: ${turma}\n`;
    text += `Próxima Turma (Destino): ${proximaTurma}\n`;
    text += `Monitoramento: ${monitoramento}\n`;
    text += `Turno: ${horarioTurno}\n\n`;

    text += `Checklist do Malão:\n`;
    text += `Status: ${checklistMalaoStatus}\n`;
    text += `Materiais faltantes: ${checklistMalaoFaltantes || 'N/A'}\n`;
    text += `Responsável: ${checklistMalaoResponsavel}\n\n`;

    text += `Solicitação de Material de Reposição:\n`;
    text += `Status: ${solicitacaoMaterialStatus || 'N/A'}\n`;
    text += `Responsável pela Solicitação: ${solicitacaoMaterialResponsavel}\n\n`;

    text += `Anomalias Identificadas: ${anomaliasIdentificadas || 'Nenhuma'}\n\n`;

    // 1. NO TOPO: Pendências Gerais (🔴 Importante & 🟡 Em andamento)
    const importantesGerais = shiftIncidents.filter(
      (i) => (i.prioridade === 'CRITICA' || i.prioridade === 'ALTA') && i.status !== 'FINALIZADO' && i.status !== 'RETROAGIDO'
    );
    const emAndamentoGerais = shiftIncidents.filter(
      (i) => i.status !== 'FINALIZADO' && i.status !== 'RETROAGIDO' && i.prioridade !== 'CRITICA' && i.prioridade !== 'ALTA'
    );

    text += `🔴 Importante:\n`;
    if (importantesGerais.length === 0) {
      text += `Nenhum\n`;
    } else {
      importantesGerais.forEach((item) => {
        text += `🔴 ${item.tag} - ${item.falha}\n`;
      });
    }

    text += `\n🟡 Em andamento:\n`;
    if (emAndamentoGerais.length === 0) {
      text += `Nenhum\n`;
    } else {
      emAndamentoGerais.forEach((item) => {
        text += `🟡 ${item.tag} - ${item.falha}\n`;
      });
    }

    // 2. ABAIXO: Atendimentos Realizados (Concluídos) divididos por Monitoramento (NOC) e Corretiva de Campo
    const nocRealizados = shiftIncidents.filter(
      (i) => i.divisaoAtuacao !== 'CORRETIVA_CAMPO' && (i.status === 'FINALIZADO' || i.status === 'RETROAGIDO')
    );
    const campoRealizados = shiftIncidents.filter(
      (i) => i.divisaoAtuacao === 'CORRETIVA_CAMPO' && (i.status === 'FINALIZADO' || i.status === 'RETROAGIDO')
    );

    text += `\n====================================\n`;
    text += `📺 ATENDIMENTOS DO MONITORAMENTO (NOC):\n`;
    text += `====================================\n`;
    text += `🟢 Realizado:\n`;
    if (nocRealizados.length === 0) {
      text += `Nenhum\n`;
    } else {
      nocRealizados.forEach((item) => {
        text += `🟢 ${item.tag} - ${item.falha}\n`;
      });
    }

    text += `\n====================================\n`;
    text += `🔧 ATENDIMENTOS DA CORRETIVA DE CAMPO:\n`;
    text += `====================================\n`;
    text += `🟢 Realizado:\n`;
    if (campoRealizados.length === 0) {
      text += `Nenhum\n`;
    } else {
      campoRealizados.forEach((item) => {
        text += `🟢 ${item.tag} - ${item.falha}\n`;
      });
    }

    text += `\nObservações Gerais: ${observacoesTurno || ''}\n`;

    return text;
  };



  useEffect(() => {
    if (isOpen && !isCustomEdited) {
      setCustomWhatsappText(generateExactWhatsappText());
    }
  }, [isOpen, turma, proximaTurma, monitoramento, horarioTurno, checklistMalaoStatus, checklistMalaoFaltantes, checklistMalaoResponsavel, solicitacaoMaterialStatus, solicitacaoMaterialResponsavel, anomaliasIdentificadas, observacoesTurno, localIncidents, isCustomEdited]);

  if (!isOpen) return null;

  const handleCopyText = () => {
    navigator.clipboard.writeText(customWhatsappText || generateExactWhatsappText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCloseShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/turnos/fechar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responsavelSaida,
          turma,
          proximaTurma,
          monitoramento,
          horarioTurno,
          checklistMalaoStatus,
          checklistMalaoFaltantes,
          checklistMalaoResponsavel,
          solicitacaoMaterialStatus,
          solicitacaoMaterialResponsavel,
          anomaliasIdentificadas,
          observacoesTurno,
        }),
      });

      if (!res.ok) {
        console.warn('API /api/turnos/fechar retornou status não-200, encerrando turno localmente');
      }
    } catch (err) {
      console.error('Erro ao fechar turno na API:', err);
    } finally {
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('passaturno-active-shift-v2');
          localStorage.removeItem('passaturno-active-shift');
          localStorage.removeItem('passaturno-active-shift-current');
          localStorage.removeItem(`passaturno-active-shift-${turma}`);
        } catch (e) {
          console.error(e);
        }
      }
      setIsSubmitting(false);
      onShiftClosed();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full shadow-2xl relative text-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header - Fixo no Topo */}
        <div className="flex items-center justify-between p-4 sm:px-6 sm:py-4 border-b border-slate-100 flex-shrink-0 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-200/60">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 leading-tight">Passagem de Turno - Modelo WhatsApp</h3>
              <p className="text-xs text-slate-500">Preencha as informações do checklist e encerre o turno</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Formulário com Corpo Rolável */}
        <form onSubmit={handleCloseShiftSubmit} className="flex flex-col flex-1 overflow-hidden">
          
          {/* Corpo com Scroll Interno */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 custom-scrollbar">
            
            {/* Seção 1: Identificação do Turno & Turma Destino */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Turma Atual (Saindo)</label>
                <select
                  value={turma}
                  onChange={(e) => setTurma(e.target.value.toUpperCase().trim())}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-sky-500"
                >
                  <option value="A">Turma A</option>
                  <option value="B">Turma B</option>
                  <option value="C">Turma C</option>
                  <option value="D">Turma D</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Próxima Turma (Destino)</label>
                <select
                  value={proximaTurma}
                  onChange={(e) => setProximaTurma(e.target.value.toUpperCase().trim())}
                  className="w-full bg-white border border-amber-300 bg-amber-50/50 rounded-xl px-3 py-1.5 text-xs text-amber-900 font-extrabold focus:outline-none focus:border-amber-500 shadow-2xs"
                  title="Selecione qual turma receberá as pendências deste encerramento"
                >
                  <option value="A">Turma A</option>
                  <option value="B">Turma B</option>
                  <option value="C">Turma C</option>
                  <option value="D">Turma D</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Monitoramento</label>
                <input
                  type="text"
                  placeholder="ex: Ronison"
                  value={monitoramento}
                  onChange={(e) => setMonitoramento(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Horário do Turno</label>
                <select
                  value={horarioTurno}
                  onChange={(e) => setHorarioTurno(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                >
                  <option value="07h às 19h">07h às 19h (Dia)</option>
                  <option value="19h às 07h">19h às 07h (Noite)</option>
                </select>
              </div>
            </div>

            {/* Seção 2: Checklist do Malão & Solicitação de Material */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              {/* Checklist do Malão */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800">Checklist do Malão</h4>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Status</label>
                  <select
                    value={checklistMalaoStatus}
                    onChange={(e) => setChecklistMalaoStatus(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800"
                  >
                    <option value="Realizado">Realizado</option>
                    <option value="Pendente">Pendente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Materiais faltantes</label>
                  <input
                    type="text"
                    placeholder="ex: Cabo Profibus, conector M12"
                    value={checklistMalaoFaltantes}
                    onChange={(e) => setChecklistMalaoFaltantes(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Solicitação de Material de Reposição */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800">Solicitação de Material de Reposição</h4>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Status da Solicitação</label>
                  <input
                    type="text"
                    placeholder="ex: Solicitado no almoxarifado"
                    value={solicitacaoMaterialStatus}
                    onChange={(e) => setSolicitacaoMaterialStatus(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Responsável pela Solicitação</label>
                  <input
                    type="text"
                    placeholder="ex: Ronison"
                    value={solicitacaoMaterialResponsavel}
                    onChange={(e) => setSolicitacaoMaterialResponsavel(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Anomalias Identificadas & Observações */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Anomalias Identificadas</label>
                <input
                  type="text"
                  placeholder="ex: Oscilação no rádio CCO"
                  value={anomaliasIdentificadas}
                  onChange={(e) => setAnomaliasIdentificadas(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observações Gerais</label>
                <input
                  type="text"
                  placeholder="ex: Equipe focou nas trocas de conectores..."
                  value={observacoesTurno}
                  onChange={(e) => setObservacoesTurno(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Seção: Definir Atendimentos Prioritários para o Próximo Turno */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  Marcar Prioridades para o Próximo Turno
                </h4>
                <span className="text-[11px] text-slate-500">
                  Clique para marcar (🔴 Importante)
                </span>
              </div>

              {pendentesLista.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-1">Nenhum atendimento pendente para o próximo turno.</p>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {/* Bloco NOC */}
                  {(() => {
                    const nocPendentes = pendentesLista.filter((i) => i.divisaoAtuacao !== 'CORRETIVA_CAMPO');
                    const campoPendentes = pendentesLista.filter((i) => i.divisaoAtuacao === 'CORRETIVA_CAMPO');

                    return (
                      <>
                        {/* ATENDIMENTOS DO MONITORAMENTO (NOC) */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-cyan-800 uppercase tracking-wider block">
                            📺 Atendimentos do Monitoramento (NOC) ({nocPendentes.length}):
                          </span>
                          {nocPendentes.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic block pl-1">Sem pendências no NOC.</span>
                          ) : (
                            nocPendentes.map((item) => {
                              const isPriority = item.prioridade === 'ALTA' || item.prioridade === 'CRITICA';
                              return (
                                <div
                                  key={item.id}
                                  onClick={() => handleTogglePriority(item.id)}
                                  className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                                    isPriority
                                      ? 'bg-rose-50/90 border-rose-300 text-rose-900 font-semibold shadow-xs'
                                      : 'bg-white border-slate-200/80 hover:bg-slate-100/80 text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2 truncate">
                                    <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 border text-[10px] text-slate-800">
                                      {item.tag}
                                    </span>
                                    <span className="truncate max-w-[280px]">{item.falha}</span>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    {isPriority ? (
                                      <span className="text-[10px] font-extrabold bg-rose-600 text-white px-2 py-0.5 rounded-lg uppercase flex items-center gap-1">
                                        <Flame className="w-3 h-3" />
                                        🔴 Importante
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded-lg transition-colors">
                                        🟡 Normal
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* ATENDIMENTOS DA CORRETIVA DE CAMPO (UM EMBAIXO DO OUTRO) */}
                        <div className="space-y-1 pt-1 border-t border-slate-200">
                          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                            🔧 Atendimentos da Corretiva de Campo ({campoPendentes.length}):
                          </span>
                          {campoPendentes.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic block pl-1">Sem pendências em campo.</span>
                          ) : (
                            campoPendentes.map((item) => {
                              const isPriority = item.prioridade === 'ALTA' || item.prioridade === 'CRITICA';
                              return (
                                <div
                                  key={item.id}
                                  onClick={() => handleTogglePriority(item.id)}
                                  className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                                    isPriority
                                      ? 'bg-rose-50/90 border-rose-300 text-rose-900 font-semibold shadow-xs'
                                      : 'bg-white border-slate-200/80 hover:bg-slate-100/80 text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2 truncate">
                                    <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 border text-[10px] text-slate-800">
                                      {item.tag}
                                    </span>
                                    <span className="truncate max-w-[280px]">{item.falha}</span>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    {isPriority ? (
                                      <span className="text-[10px] font-extrabold bg-rose-600 text-white px-2 py-0.5 rounded-lg uppercase flex items-center gap-1">
                                        <Flame className="w-3 h-3" />
                                        🔴 Importante
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded-lg transition-colors">
                                        🟡 Normal
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>


            {/* Preview Passagem Exata */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center">
                  <FileText className="w-3.5 h-3.5 mr-1 text-sky-600" />
                  Preview da Passagem de Turno (Modelo Exato WhatsApp)
                </span>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      Copiar Passagem
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={customWhatsappText}
                onChange={(e) => {
                  setIsCustomEdited(true);
                  setCustomWhatsappText(e.target.value);
                }}
                rows={6}
                className="w-full text-[11px] font-mono bg-white p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-slate-800 leading-relaxed custom-scrollbar resize-y"
                placeholder="Edite a passagem de turno antes de copiar..."
              />
            </div>

          </div>

          {/* Footer - Fixo na Parte Inferior */}
          <div className="flex items-center justify-end space-x-3 p-4 sm:px-6 sm:py-3.5 border-t border-slate-100 bg-slate-50/80 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center cursor-pointer"
            >
              {isSubmitting ? (
                <span>Encerrando...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-1.5" />
                  Encerrar e Salvar Turno
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
