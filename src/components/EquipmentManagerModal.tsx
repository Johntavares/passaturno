'use client';

import React, { useState } from 'react';
import { EquipmentType } from '@/types';
import { X, Truck, Plus } from 'lucide-react';

interface EquipmentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipments: EquipmentType[];
  onEquipmentCreated: () => void;
}

export const EquipmentManagerModal: React.FC<EquipmentManagerModalProps> = ({
  isOpen,
  onClose,
  equipments,
  onEquipmentCreated,
}) => {
  const [tag, setTag] = useState('');
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('Caminhão');
  const [area, setArea] = useState('Frota Mina');
  const [horimetro, setHorimetro] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!tag || !nome) {
      setErrorMsg('TAG e Nome são obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/equipamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tag: tag.toUpperCase().trim(),
          nome,
          tipo,
          area,
          horimetroOpcional: horimetro ? parseFloat(horimetro) : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao cadastrar equipamento');
      }

      setTag('');
      setNome('');
      setHorimetro('');
      onEquipmentCreated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha na conexão');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8 text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Cadastro de Equipamentos</h3>
              <p className="text-xs text-slate-500">Gerenciamento dos ativos da frota</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 mb-5 space-y-3">
          <h4 className="text-xs font-bold text-sky-800 flex items-center">
            <Plus className="w-4 h-4 mr-1 text-sky-600" />
            Cadastrar Novo Ativo na Frota
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">TAG (Única)</label>
              <input
                type="text"
                placeholder="ex: CAT-793D-06"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-sky-700 font-mono font-bold focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nome do Equipamento</label>
              <input
                type="text"
                placeholder="ex: Caminhão Fora de Estrada 06"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
              >
                <option value="Caminhão">Caminhão</option>
                <option value="Escavadeira">Escavadeira</option>
                <option value="Perfuratriz">Perfuratriz</option>
                <option value="Trator">Trator</option>
                <option value="Carregadeira">Carregadeira</option>
                <option value="Motoniveladora">Motoniveladora</option>
                <option value="PLC">PLC / CLP</option>
                <option value="Inversor">Inversor</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Área da Operação</label>
              <input
                type="text"
                placeholder="ex: Frota Mina, Usina"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Horímetro Inicial (Opcional)</label>
              <input
                type="number"
                step="0.1"
                placeholder="ex: 12450.0"
                value={horimetro}
                onChange={(e) => setHorimetro(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center"
            >
              {isSubmitting ? 'Salvando...' : 'Cadastrar Equipamento'}
            </button>
          </div>
        </form>

        {/* Lista */}
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          <h4 className="text-xs font-bold text-slate-500 uppercase">Equipamentos Cadastrados ({equipments.length})</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {equipments.map((e) => (
              <div key={e.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="badge-tag text-sky-700 font-mono font-bold block">{e.tag}</span>
                  <span className="text-slate-700 text-[11px] font-medium">{e.nome}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">{e.area}</span>
                  <span className="text-[10px] text-slate-500">{e.tipo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
