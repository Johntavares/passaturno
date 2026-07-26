'use client';

import React, { useState, useEffect } from 'react';
import { ShiftType } from '@/types';
import { 
  X, 
  CheckSquare, 
  Users, 
  Radio, 
  Copy, 
  Check, 
  AlertTriangle, 
  Save,
  ClipboardList,
  Wrench,
  Activity,
  FileText
} from 'lucide-react';

interface OneNoteRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeShift: ShiftType | null;
  onShiftUpdated: () => void;
}

export const OneNoteRoutineModal: React.FC<OneNoteRoutineModalProps> = ({
  isOpen,
  onClose,
  activeShift,
  onShiftUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'checklist' | 'equipes' | 'gps' | 'malao'>('checklist');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados dos campos do OneNote
  const [tipoTurno, setTipoTurno] = useState('Diurno');
  const [escala, setEscala] = useState('2x3');
  const [turma, setTurma] = useState('C');
  const [ausencias, setAusencias] = useState('Baia (férias)');
  
  // Equipes
  const [liderVale, setLiderVale] = useState('Vinicius');
  const [equipeSonda, setEquipeSonda] = useState('Valdenir, Gustavo, Vitor');
  const [equipeContratadas, setEquipeContratadas] = useState('Flanders (Railton), COM3 (Igor), ALCON (Marcos, Gustavo), Creare ADM (Tarcisio)');

  // Checklist FMDS
  const [fmdsEquipSemComunicar, setFmdsEquipSemComunicar] = useState(true);
  const [fmdsLimpezaRepetidoras, setFmdsLimpezaRepetidoras] = useState(true);
  const [fmdsVerificarOMs, setFmdsVerificarOMs] = useState(true);
  const [fmdsVerificarIncidentes, setFmdsVerificarIncidentes] = useState(true);
  const [fmdsEnviarMapaRepetidoras, setFmdsEnviarMapaRepetidoras] = useState(true);
  const [fmdsAvaliarGPS, setFmdsAvaliarGPS] = useState(true);
  const [fmdsTratarOMsPendentes, setFmdsTratarOMsPendentes] = useState(true);
  const [fmdsEnviarManobraCarga, setFmdsEnviarManobraCarga] = useState(true);

  // Diagnóstico GPS & Despacho
  const [equipSemDespacho, setEquipSemDespacho] = useState('EC10, PZ15, PZ20, PZ21, PZ42, PZ43, TT52, TT53, TT81, TT84');
  const [equipSemGps, setEquipSemGps] = useState('TT57, TT92');
  const [equipPreventiva, setEquipPreventiva] = useState('EC17, PZ02, TT84, TT85');
  const [equipManutencao, setEquipManutencao] = useState('PZ14, PZ47, TT56');

  // Checklist Malaão & Materiais
  const [checklistMalaoStatus, setChecklistMalaoStatus] = useState('Realizado');
  const [checklistMalaoFaltantes, setChecklistMalaoFaltantes] = useState('Nenhum item faltante');
  const [solicitacaoMaterialStatus, setSolicitacaoMaterialStatus] = useState('Não necessária');

  useEffect(() => {
    if (activeShift) {
      if (activeShift.turma) setTurma(activeShift.turma);
      if (activeShift.tipoTurno) setTipoTurno(activeShift.tipoTurno);
      if (activeShift.escala) setEscala(activeShift.escala);
      if (activeShift.ausencias) setAusencias(activeShift.ausencias);
      if (activeShift.liderVale) setLiderVale(activeShift.liderVale);
      if (activeShift.equipeSonda) setEquipeSonda(activeShift.equipeSonda);
      if (activeShift.equipeContratadas) setEquipeContratadas(activeShift.equipeContratadas);
      if (activeShift.equipamentosSemDespacho) setEquipSemDespacho(activeShift.equipamentosSemDespacho);
      if (activeShift.equipamentosSemGps) setEquipSemGps(activeShift.equipamentosSemGps);
      if (activeShift.equipamentosPreventiva) setEquipPreventiva(activeShift.equipamentosPreventiva);
      if (activeShift.equipamentosManutencao) setEquipManutencao(activeShift.equipamentosManutencao);
    }
  }, [activeShift]);

  if (!isOpen) return null;

  const generateOneNoteText = () => {
    return `CHECK TURNO:

• Atualizar FMDS
    o Equipamentos sem comunicar ( ${fmdsEquipSemComunicar ? 'ok' : 'pendente'} )
    o Limpeza repetidoras ( ${fmdsLimpezaRepetidoras ? 'ok' : 'pendente'} )
    o Verificar OM's abertas ( ${fmdsVerificarOMs ? 'ok' : 'pendente'} )
    o Verificar incidentes ( ${fmdsVerificarIncidentes ? 'ok' : 'pendente'} )
• FMDS
• Enviar mapa de repetidoras ( ${fmdsEnviarMapaRepetidoras ? 'ok' : 'pendente'} )
• Avaliar GPS dos equipamentos ( ${fmdsAvaliarGPS ? 'ok' : 'pendente'} )
• Tratar OMs pendentes ( ${fmdsTratarOMsPendentes ? 'ok' : 'pendente'} )
• Enviar integridade de manobra e carga ( ${fmdsEnviarManobraCarga ? 'ok' : 'pendente'} )

Turno: ${tipoTurno}
ESCALA: ${escala}
LETRA: ${turma}
DATA: ${new Date().toLocaleDateString('pt-BR')}
EQUIPE: _ ${equipeSonda} _
MONITORAMENTO: ${activeShift?.responsavelNome || 'John Tavares'}
AUSÊNCIA: ${ausencias}

*Líder VALE*
_${liderVale}_

*Sonda*
_${equipeSonda}_

*Contratadas & Equipes em Campo*
_${equipeContratadas}_

Status de Operação – Diagnóstico de GPS:
🛠️ - Em manutenção: ${equipManutencao}
⚙️ - Em preventiva: ${equipPreventiva}
⚠️ - Operando com falha de GPS: ${equipSemGps}

Observação (Equipamentos Fora do Sistema do Despacho):
${equipSemDespacho.split(',').map(e => `${e.trim()} - Fora do sistema do Despacho.`).join('\n')}

Checklist do Malaão: ${checklistMalaoStatus}
Materiais faltantes: ${checklistMalaoFaltantes}
`;
  };

  const handleCopyOneNote = () => {
    const text = generateOneNoteText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = async () => {
    if (!activeShift) return;
    setIsSubmitting(true);

    try {
      await fetch('/api/turnos/assumir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId: activeShift.id,
          turma,
          tipoTurno,
          escala,
          ausencias,
          liderVale,
          equipeSonda,
          equipeContratadas,
          equipamentosSemDespacho: equipSemDespacho,
          equipamentosSemGps: equipSemGps,
          equipamentosPreventiva: equipPreventiva,
          equipamentosManutencao: equipManutencao,
          checklistMalaoStatus,
          checklistMalaoFaltantes,
        }),
      });

      onShiftUpdated();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative my-8 text-slate-800 dark:text-slate-100 animate-fadeIn">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Check do Turno, Rotina FMDS & OneNote
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gerencie checklists, equipes em campo, diagnósticos e formato do OneNote
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyOneNote}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Copiar no formato exato do OneNote"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar formato OneNote</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Abas */}
        <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'checklist'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>1. Checklist FMDS</span>
          </button>

          <button
            onClick={() => setActiveTab('equipes')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'equipes'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2. Equipes & Escala</span>
          </button>

          <button
            onClick={() => setActiveTab('gps')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'gps'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>3. GPS & Despacho</span>
          </button>

          <button
            onClick={() => setActiveTab('malao')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'malao'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>4. Malaão & Sobressalentes</span>
          </button>
        </div>

        {/* Conteúdo Aba 1: Checklist FMDS */}
        {activeTab === 'checklist' && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Rotina Diária e Atualizações do Turno (FMDS)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fmdsEquipSemComunicar}
                  onChange={(e) => setFmdsEquipSemComunicar(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                />
                <span>Equipamentos sem comunicar ( ok )</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fmdsLimpezaRepetidoras}
                  onChange={(e) => setFmdsLimpezaRepetidoras(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                />
                <span>Limpeza de repetidoras ( ok )</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fmdsVerificarOMs}
                  onChange={(e) => setFmdsVerificarOMs(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                />
                <span>Verificar OM&apos;s abertas ( ok )</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fmdsVerificarIncidentes}
                  onChange={(e) => setFmdsVerificarIncidentes(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                />
                <span>Verificar incidentes na carteira ( ok )</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fmdsEnviarMapaRepetidoras}
                  onChange={(e) => setFmdsEnviarMapaRepetidoras(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                />
                <span>Enviar mapa de repetidoras</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fmdsAvaliarGPS}
                  onChange={(e) => setFmdsAvaliarGPS(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                />
                <span>Avaliar GPS dos equipamentos</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fmdsTratarOMsPendentes}
                  onChange={(e) => setFmdsTratarOMsPendentes(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                />
                <span>Tratar OMs pendentes</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fmdsEnviarManobraCarga}
                  onChange={(e) => setFmdsEnviarManobraCarga(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                />
                <span>Enviar integridade de manobra e carga</span>
              </label>
            </div>
          </div>
        )}

        {/* Conteúdo Aba 2: Equipes & Escala */}
        {activeTab === 'equipes' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Turno</label>
                <select
                  value={tipoTurno}
                  onChange={(e) => setTipoTurno(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                >
                  <option value="Diurno">☀️ Diurno</option>
                  <option value="Noturno">🌙 Noturno</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Escala</label>
                <input
                  type="text"
                  value={escala}
                  onChange={(e) => setEscala(e.target.value)}
                  placeholder="ex: 2x3"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Letra / Turma</label>
                <select
                  value={turma}
                  onChange={(e) => setTurma(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-bold"
                >
                  <option value="A">Turma A</option>
                  <option value="B">Turma B</option>
                  <option value="C">Turma C</option>
                  <option value="D">Turma D</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Ausências / Férias</label>
                <input
                  type="text"
                  value={ausencias}
                  onChange={(e) => setAusencias(e.target.value)}
                  placeholder="ex: Baia (férias)"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Líder VALE
                </label>
                <input
                  type="text"
                  value={liderVale}
                  onChange={(e) => setLiderVale(e.target.value)}
                  placeholder="ex: Vinicius"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Equipe Sonda Automação
                </label>
                <input
                  type="text"
                  value={equipeSonda}
                  onChange={(e) => setEquipeSonda(e.target.value)}
                  placeholder="ex: Valdenir, Gustavo, Vitor"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Equipes Contratadas & Terceiras (Flanders, COM3, ALCON, Creare ADM)
                </label>
                <input
                  type="text"
                  value={equipeContratadas}
                  onChange={(e) => setEquipeContratadas(e.target.value)}
                  placeholder="ex: Flanders (Railton), COM3 (Igor), ALCON (Marcos, Gustavo), Creare ADM (Tarcisio)"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo Aba 3: GPS & Despacho */}
        {activeTab === 'gps' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Equipamentos Fora do Sistema do Despacho
              </label>
              <textarea
                rows={2}
                value={equipSemDespacho}
                onChange={(e) => setEquipSemDespacho(e.target.value)}
                placeholder="ex: EC10, PZ15, PZ20, PZ21, PZ42, PZ43, TT52, TT53, TT81, TT84"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">
                  ⚠️ Operando sem GPS
                </label>
                <input
                  type="text"
                  value={equipSemGps}
                  onChange={(e) => setEquipSemGps(e.target.value)}
                  placeholder="ex: TT57, TT92"
                  className="w-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-1.5 text-xs text-amber-900 dark:text-amber-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-sky-700 dark:text-sky-400 mb-1">
                  ⚙️ Em Preventiva
                </label>
                <input
                  type="text"
                  value={equipPreventiva}
                  onChange={(e) => setEquipPreventiva(e.target.value)}
                  placeholder="ex: EC17, PZ02, TT84, TT85"
                  className="w-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 rounded-xl px-3 py-1.5 text-xs text-sky-900 dark:text-sky-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-rose-700 dark:text-rose-400 mb-1">
                  🛠️ Em Manutenção
                </label>
                <input
                  type="text"
                  value={equipManutencao}
                  onChange={(e) => setEquipManutencao(e.target.value)}
                  placeholder="ex: PZ14, PZ47, TT56"
                  className="w-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl px-3 py-1.5 text-xs text-rose-900 dark:text-rose-200 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo Aba 4: Malaão & Sobressalentes */}
        {activeTab === 'malao' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Status do Checklist do Malaão
                </label>
                <select
                  value={checklistMalaoStatus}
                  onChange={(e) => setChecklistMalaoStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-bold"
                >
                  <option value="Realizado">🟢 Realizado (100% OK)</option>
                  <option value="Com Pendências">🟡 Realizado com Faltantes</option>
                  <option value="Não Realizado">🔴 Não Realizado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Solicitação de Material de Reposição
                </label>
                <input
                  type="text"
                  value={solicitacaoMaterialStatus}
                  onChange={(e) => setSolicitacaoMaterialStatus(e.target.value)}
                  placeholder="ex: Solicitado conector M12 no almoxarifado"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Materiais ou Ferramentas Faltantes no Malaão
              </label>
              <textarea
                rows={2}
                value={checklistMalaoFaltantes}
                onChange={(e) => setChecklistMalaoFaltantes(e.target.value)}
                placeholder="Descreva ferramentas ou conectores faltantes no malaão de campo..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
          <button
            type="button"
            onClick={handleCopyOneNote}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-sky-600" />
            <span>Gerar Resumo para Copiar</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Rotina no Turno</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
