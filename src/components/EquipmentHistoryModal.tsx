'use client';

import React, { useState, useEffect } from 'react';
import { EquipmentType } from '@/types';
import { X, Truck, History, Tag } from 'lucide-react';
import { format } from 'date-fns';

interface EquipmentHistoryModalProps {
  initialTag?: string;
  isOpen: boolean;
  onClose: () => void;
  equipments: EquipmentType[];
}

export const EquipmentHistoryModal: React.FC<EquipmentHistoryModalProps> = ({
  initialTag = '',
  isOpen,
  onClose,
  equipments,
}) => {
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [equipmentData, setEquipmentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialTag) {
      setSelectedTag(initialTag);
      fetchEquipmentHistory(initialTag);
    } else if (equipments.length > 0) {
      setSelectedTag(equipments[0].tag);
      fetchEquipmentHistory(equipments[0].tag);
    }
  }, [initialTag, isOpen]);

  const fetchEquipmentHistory = async (tagToFetch: string) => {
    if (!tagToFetch) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/equipamentos/${encodeURIComponent(tagToFetch)}`);
      if (res.ok) {
        const data = await res.json();
        setEquipmentData(data);
      } else {
        setEquipmentData(null);
      }
    } catch (err) {
      console.error(err);
      setEquipmentData(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative my-8 text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Histórico Operacional do Ativo</h3>
              <p className="text-xs text-slate-500">Memória de intervenções por TAG do equipamento</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seletor de TAG */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-5 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
          <label className="text-xs font-semibold text-slate-700 flex items-center">
            <Tag className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
            Selecionar TAG:
          </label>
          <select
            value={selectedTag}
            onChange={(e) => {
              setSelectedTag(e.target.value);
              fetchEquipmentHistory(e.target.value);
            }}
            className="bg-white border border-slate-200 text-slate-800 font-mono font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-sky-500"
          >
            {equipments.map((e) => (
              <option key={e.id} value={e.tag}>
                {e.tag} — {e.nome} ({e.area})
              </option>
            ))}
          </select>
        </div>

        {/* Conteúdo */}
        {isLoading ? (
          <div className="text-center py-12 text-xs text-sky-600">Carregando histórico do equipamento...</div>
        ) : equipmentData ? (
          <div>
            {/* Metadata Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-medium">TAG</span>
                <span className="text-sm font-bold text-sky-700 font-mono">{equipmentData.tag}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-medium">Nome</span>
                <span className="text-xs font-semibold text-slate-800">{equipmentData.nome}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-medium">Área / Tipo</span>
                <span className="text-xs text-slate-600">{equipmentData.area} • {equipmentData.tipo}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-medium">Registros</span>
                <span className="text-xs font-bold text-slate-800">{equipmentData.incidents?.length || 0} ocorrências</span>
              </div>
            </div>

            {/* Lista Cronológica */}
            <div className="max-h-80 overflow-y-auto pr-2 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
                <History className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
                Histórico de Manutenções
              </h4>

              {equipmentData.incidents && equipmentData.incidents.length > 0 ? (
                equipmentData.incidents.map((inc: any) => {
                  const parada = new Date(inc.dataHoraParada);
                  return (
                    <div
                      key={inc.id}
                      className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-2 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-sky-700 font-bold">
                          {format(parada, 'dd/MM/yyyy • HH:mm')}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                            inc.status === 'FINALIZADO'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {inc.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-700">
                        <strong className="text-slate-500">Falha:</strong> {inc.falha}
                      </div>

                      {inc.solucao && (
                        <div className="text-xs text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                          <strong>Solução Aplicada:</strong> {inc.solucao}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <span>Resp: <strong>{inc.responsavel}</strong></span>
                        <span>Turno: <strong>{inc.shift?.equipe || 'N/A'}</strong></span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-slate-400 italic">Nenhuma ocorrência registrada.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400">TAG não encontrada.</div>
        )}

      </div>
    </div>
  );
};
