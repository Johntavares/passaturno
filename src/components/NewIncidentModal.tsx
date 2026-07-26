'use client';

import React, { useState, useEffect } from 'react';
import { EquipmentType, PriorityLevel, IncidentStatusType } from '@/types';
import { X, Plus, AlertTriangle, Check, Truck, Save } from 'lucide-react';

interface NewIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipments: EquipmentType[];
  onIncidentCreated: () => void;
}

export const NewIncidentModal: React.FC<NewIncidentModalProps> = ({
  isOpen,
  onClose,
  equipments,
  onIncidentCreated,
}) => {
  const [tag, setTag] = useState('');
  const [equipamentoNome, setEquipamentoNome] = useState('');
  const [tipoEquipamento, setTipoEquipamento] = useState('Caminhão Fora de Estrada');
  const [area, setArea] = useState('Frota Mina');
  const [saveNewToFleet, setSaveNewToFleet] = useState(true);

  const [tipoFalha, setTipoFalha] = useState('Comunicação');
  const [falha, setFalha] = useState('');
  const [sintoma, setSintoma] = useState('');
  const [dataHoraParada, setDataHoraParada] = useState(
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  );
  const [prioridade, setPrioridade] = useState<PriorityLevel>('MEDIA');
  const [status, setStatus] = useState<IncidentStatusType>('EM_ANDAMENTO');
  const [responsavel, setResponsavel] = useState('John Doe');
  const [motivoEspera, setMotivoEspera] = useState('');
  const [proximaAcao, setProximaAcao] = useState('');
  const [observacao, setObservacao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Lista completa de Tipos de Equipamento da Frota da Mina
  const fleetTypes = [
    { label: '🚛 Caminhão Fora de Estrada / Caçamba', value: 'Caminhão Fora de Estrada', defaultNome: 'Caminhão Fora de Estrada' },
    { label: '🚜 Perfuratriz (PR / DTH / Rotativa)', value: 'Perfuratriz', defaultNome: 'Perfuratriz Rotativa' },
    { label: '🏗️ Escavadeira Hidráulica (EX)', value: 'Escavadeira', defaultNome: 'Escavadeira Hidráulica' },
    { label: '🚜 Pá Carregadeira (PC)', value: 'Pá Carregadeira (PC)', defaultNome: 'Pá Carregadeira' },
    { label: '🚜 Motoniveladora (MA)', value: 'Motoniveladora (MA)', defaultNome: 'Motoniveladora' },
    { label: '🚜 Trator de Esteira / Pneu (TT)', value: 'Trator (TT)', defaultNome: 'Trator de Esteira' },
    { label: '🚿 Caminhão Pipa / Abastecimento', value: 'Caminhão Pipa', defaultNome: 'Caminhão Pipa' },
    { label: '🛻 Caminhonete / Veículo Leve', value: 'Caminhonete', defaultNome: 'Caminhonete de Campo' },
    { label: '🚐 Transporte de Utilitários (TU)', value: 'TU (Utilitário)', defaultNome: 'Veículo Utilitário (TU)' },
    { label: '🚌 Micro-ônibus', value: 'Micro-ônibus', defaultNome: 'Micro-ônibus de Transporte' },
    { label: '🚌 Ônibus de Pessoal', value: 'Ônibus', defaultNome: 'Ônibus de Transporte' },
    { label: '⚙️ Outro / Equipamento Manual', value: 'Outros', defaultNome: 'Equipamento Auxiliar' },
  ];

  const failureTypes = [
    'Comunicação',
    'PLC',
    'Inversor',
    'Instrumentação',
    'Rede Industrial',
    'Sensor',
    'Supervisório',
    'Outro',
  ];

  const areasList = [
    'Frota Mina', 
    'Praça de Carga', 
    'Usina de Beneficiamento', 
    'Britagem Primária', 
    'Infraestrutura', 
    'Utilidades'
  ];

  const [previsaoLiberacao, setPrevisaoLiberacao] = useState('');

  // Ao digitar a TAG, auto-completar os dados se o equipamento já existir na frota
  useEffect(() => {
    if (!tag) return;
    const found = equipments.find((e) => e.tag.toUpperCase().trim() === tag.toUpperCase().trim());
    if (found) {
      setEquipamentoNome(found.nome);
      setArea(found.area);
      if (found.tipo) {
        setTipoEquipamento(found.tipo);
      }
    }
  }, [tag, equipments]);

  // Ao alterar o tipo de equipamento (se o nome estiver vazio), preencher sugestão
  const handleSelectTipo = (novoTipo: string) => {
    setTipoEquipamento(novoTipo);
    const item = fleetTypes.find((f) => f.value === novoTipo);
    if (item && (!equipamentoNome || fleetTypes.some((f) => f.defaultNome === equipamentoNome))) {
      setEquipamentoNome(item.defaultNome);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const formattedTag = tag.toUpperCase().trim();

    if (!formattedTag || !falha || !responsavel) {
      setErrorMsg('Por favor, preencha a TAG, a Descrição da Falha e o Responsável.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Verificar se o equipamento já existe na frota
      const existingEquip = equipments.find((e) => e.tag.toUpperCase().trim() === formattedTag);

      // 2. Se for um novo equipamento e a opção de auto-salvar estiver ativa, salva no banco de dados da frota
      if (!existingEquip && saveNewToFleet) {
        try {
          await fetch('/api/equipamentos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tag: formattedTag,
              nome: equipamentoNome.trim() || `Equipamento ${formattedTag}`,
              tipo: tipoEquipamento,
              area: area,
            }),
          });
        } catch (errEq) {
          console.warn('Não foi possível salvar novo equipamento na frota:', errEq);
        }
      }

      // 3. Registrar o atendimento
      const res = await fetch('/api/atendimentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tag: formattedTag,
          equipamentoNome: equipamentoNome.trim() || `Equipamento ${formattedTag}`,
          area,
          tipoFalha,
          falha,
          sintoma,
          dataHoraParada: new Date(dataHoraParada).toISOString(),
          previsaoLiberacao: previsaoLiberacao.trim() || null,
          prioridade,
          status,
          responsavel,
          motivoEspera,
          proximaAcao,
          observacao,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao registrar atendimento');
      }

      onIncidentCreated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro de conexão com o servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isExistingTag = equipments.some((e) => e.tag.toUpperCase().trim() === tag.toUpperCase().trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative my-8 text-slate-800 animate-fadeIn">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Novo Atendimento de Automação</h3>
              <p className="text-xs text-slate-500">Registre a ocorrência e selecione o equipamento da frota</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-rose-600 flex-shrink-0" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Seção 1: Identificação Rápida do Ativo por TAG */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-sky-600" />
                TAG do Equipamento <span className="text-rose-500">*</span>
              </label>

              {isExistingTag ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3 h-3" /> TAG Cadastrada
                </span>
              ) : tag.trim() ? (
                <span className="text-[10px] font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                  Nova TAG (Salva para futuros atendimentos)
                </span>
              ) : null}
            </div>

            <input
              type="text"
              list="equipments-list"
              placeholder="Digite a TAG (ex: CAT-793D-05, PR-08, EX-5500, MA-02)..."
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              spellCheck={false}
              data-gramm={false}
              autoComplete="off"
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-sky-700 font-mono font-bold uppercase focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-2xs transition-all"
              required
            />
            <datalist id="equipments-list">
              {equipments.map((e) => (
                <option key={e.id} value={e.tag}>
                  {e.nome ? `${e.tag} — ${e.nome}` : e.tag}
                </option>
              ))}
            </datalist>
          </div>

          {/* Seção 2: Categoria da Falha e Horários */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipo / Categoria da Falha
              </label>
              <input
                type="text"
                list="failure-types-list"
                placeholder="Digite a falha (ex: Comunicação CCO, Rádio, Sensor, Inversor...)"
                value={tipoFalha}
                onChange={(e) => setTipoFalha(e.target.value)}
                spellCheck={false}
                data-gramm={false}
                autoComplete="off"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-sky-500 shadow-2xs"
              />
              <datalist id="failure-types-list">
                <option value="Comunicação" />
                <option value="Rádio / Antena" />
                <option value="GPS / Posicionamento" />
                <option value="PLC / Módulo de Controle" />
                <option value="Inversor / Drive" />
                <option value="Instrumentação / Sensor" />
                <option value="Rede Industrial / Fibra" />
                <option value="Supervisório / CCO" />
                <option value="Alarme Falso / Calibração" />
                <option value="Elétrica / Alimentação" />
              </datalist>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Data e Hora da Parada</label>
                <input
                  type="datetime-local"
                  value={dataHoraParada}
                  onChange={(e) => setDataHoraParada(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-800 mb-1">
                  Previsão de Liberação (ex: 15:30)
                </label>
                <input
                  type="text"
                  placeholder="ex: 15:30 ou Sem previsão"
                  value={previsaoLiberacao}
                  onChange={(e) => setPrevisaoLiberacao(e.target.value)}
                  spellCheck={false}
                  data-gramm={false}
                  autoComplete="off"
                  className="w-full bg-emerald-50/70 border border-emerald-300 rounded-xl px-3.5 py-2 text-xs text-emerald-900 font-bold focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descrição da Falha <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="Descreva o problema constatado..."
              value={falha}
              onChange={(e) => setFalha(e.target.value)}
              spellCheck={false}
              data-gramm={false}
              autoComplete="off"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Sintoma Apresentado (Opcional)</label>
            <input
              type="text"
              placeholder="ex: Leitura oscilando no CCO"
              value={sintoma}
              onChange={(e) => setSintoma(e.target.value)}
              spellCheck={false}
              data-gramm={false}
              autoComplete="off"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Seção 3: Atendimento e Prioridade */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Prioridade</label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as PriorityLevel)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="BAIXA">BAIXA</option>
                <option value="MEDIA">MÉDIA</option>
                <option value="ALTA">ALTA</option>
                <option value="CRITICA">CRÍTICA</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status Inicial</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as IncidentStatusType)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="EM_ANDAMENTO">🔴 Em Andamento</option>
                <option value="AGUARDANDO">🟡 Aguardando</option>
                <option value="PENDENCIA_PROXIMO_TURNO">🔵 Pendência Herdada</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Técnico Responsável <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="ex: John Doe"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                required
              />
            </div>
          </div>

          {status === 'AGUARDANDO' && (
            <div>
              <label className="block text-xs font-semibold text-amber-700 mb-1">Motivo do Aguardo</label>
              <input
                type="text"
                placeholder="ex: Aguardando peça no almoxarifado"
                value={motivoEspera}
                onChange={(e) => setMotivoEspera(e.target.value)}
                className="w-full bg-amber-50/50 border border-amber-200 rounded-xl px-3 py-1.5 text-xs text-amber-900 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Próxima Ação Recomendada</label>
              <input
                type="text"
                placeholder="ex: Substituir conector M12"
                value={proximaAcao}
                onChange={(e) => setProximaAcao(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Observação Técnica</label>
              <input
                type="text"
                placeholder="ex: Equipamento no pátio 02"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Salvando Atendimento...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1.5" />
                  Salvar Atendimento
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
