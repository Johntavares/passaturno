'use client';

import React, { useState, useEffect } from 'react';
import { ShiftType } from '@/types';
import { 
  X, 
  Users, 
  Copy, 
  Check, 
  Send, 
  Edit3, 
  RotateCcw,
  Building2
} from 'lucide-react';

interface TeamsCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeShift: ShiftType | null;
  currentUser?: any;
}

interface TeamGroup {
  id: string;
  name: string;
  members: string;
}

const DEFAULT_GROUPS: TeamGroup[] = [
  { id: 'lider_vale', name: 'Líder VALE', members: 'Vinicius' },
  { id: 'sonda', name: 'Sonda', members: 'Valdenir\nGustavo\nVitor' },
  { id: 'flanders', name: 'Flanders', members: 'Railton' },
  { id: 'com3', name: 'COM3', members: 'Igor' },
  { id: 'alcon', name: 'ALCON', members: 'Marcos\nGustavo' },
  { id: 'creare', name: 'Creare ADM', members: 'Tarsso' },
];

const LOCAL_STORAGE_KEY = 'passaturno-teams-check-v1';

export const TeamsCheckModal: React.FC<TeamsCheckModalProps> = ({
  isOpen,
  onClose,
  activeShift,
  currentUser,
}) => {
  const [copied, setCopied] = useState(false);
  const [teamGroups, setTeamGroups] = useState<TeamGroup[]>(DEFAULT_GROUPS);
  const [customReportText, setCustomReportText] = useState('');
  const [isCustomEdited, setIsCustomEdited] = useState(false);

  // Carregar grupos salvos do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTeamGroups(parsed);
          }
        }
      } catch (e) {
        console.error('Erro ao ler grupos salvos de equipes:', e);
      }
    }
  }, []);

  // Salvar alterações nos grupos
  const saveGroups = (newGroups: TeamGroup[]) => {
    setTeamGroups(newGroups);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newGroups));
      } catch (e) {
        console.error('Erro ao salvar grupos de equipes:', e);
      }
    }
  };

  const handleGroupChange = (id: string, field: 'name' | 'members', value: string) => {
    const updated = teamGroups.map((g) => (g.id === id ? { ...g, [field]: value } : g));
    saveGroups(updated);
    setIsCustomEdited(false);
  };

  const handleAddGroup = () => {
    const newGroup: TeamGroup = {
      id: `group-${Date.now()}`,
      name: 'Nova Empresa / Equipe',
      members: 'Nome do Integrante',
    };
    const updated = [...teamGroups, newGroup];
    saveGroups(updated);
    setIsCustomEdited(false);
  };

  const handleRemoveGroup = (id: string) => {
    const updated = teamGroups.filter((g) => g.id !== id);
    saveGroups(updated);
    setIsCustomEdited(false);
  };

  const handleResetDefaults = () => {
    saveGroups(DEFAULT_GROUPS);
    setIsCustomEdited(false);
  };

  // Função geradora da mensagem formatada no modelo exato do usuário
  const generateFormattedMessage = () => {
    const now = new Date();
    const dataStr = now.toLocaleDateString('pt-BR');
    const turmaStr = activeShift?.turma || currentUser?.turma || 'C';

    let text = `Turma ${turmaStr} ${dataStr} Check das equipes\n\n`;

    teamGroups.forEach((group, idx) => {
      if (!group.name.trim()) return;
      text += `${group.name.trim()}\n`;
      if (group.members.trim()) {
        text += `${group.members.trim()}\n`;
      }
      if (idx < teamGroups.length - 1) {
        text += `___\n`;
      }
    });

    return text.trim();
  };

  useEffect(() => {
    if (isOpen && !isCustomEdited) {
      setCustomReportText(generateFormattedMessage());
    }
  }, [isOpen, teamGroups, activeShift, currentUser, isCustomEdited]);

  if (!isOpen) return null;

  const handleCopy = () => {
    const textToCopy = customReportText || generateFormattedMessage();
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsapp = () => {
    const textToSend = customReportText || generateFormattedMessage();
    const encodedText = encodeURIComponent(textToSend);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full shadow-2xl relative text-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:px-6 sm:py-4 border-b border-slate-100 flex-shrink-0 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                Check das Equipes (Início de Turno)
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Edit3 className="w-2.5 h-2.5" /> Editável
                </span>
              </h3>
              <p className="text-xs text-slate-500">Relatório inicial com composição das equipes e empresas parceiras</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">

          {/* Form de Edição das Empresas / Integrantes */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-600" />
                Estrutura das Equipes & Empresas Parceiras:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="text-[11px] font-medium text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                  title="Restaurar empresas padrão"
                >
                  <RotateCcw className="w-3 h-3" /> Restaurar Padrão
                </button>
                <button
                  type="button"
                  onClick={handleAddGroup}
                  className="text-[11px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  + Nova Empresa
                </button>
              </div>
            </div>

            {/* Grid com empresas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {teamGroups.map((group) => (
                <div key={group.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs relative group">
                  <div className="flex items-center justify-between mb-1.5">
                    <input
                      type="text"
                      value={group.name}
                      onChange={(e) => handleGroupChange(group.id, 'name', e.target.value)}
                      className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-1 w-full mr-2 focus:outline-none focus:border-emerald-500"
                      placeholder="Nome da Equipe/Empresa"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveGroup(group.id)}
                      className="text-slate-400 hover:text-rose-500 text-xs px-1"
                      title="Remover empresa"
                    >
                      &times;
                    </button>
                  </div>
                  <textarea
                    value={group.members}
                    onChange={(e) => handleGroupChange(group.id, 'members', e.target.value)}
                    rows={3}
                    className="w-full text-xs font-mono text-slate-700 bg-slate-50/50 border border-slate-200 rounded p-2 focus:outline-none focus:border-emerald-500 resize-y"
                    placeholder="Integrantes (1 por linha)"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Pré-visualização com Campo Editável Livre em Tempo Real */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 flex items-center justify-between font-mono">
              <span className="flex items-center gap-1.5">
                <span>Mensagem Formatada (WhatsApp)</span>
                <span className="text-[10px] font-sans font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  ✏️ Editável
                </span>
              </span>
              <span className="text-[11px] font-sans font-medium text-slate-400">
                Você pode alterar o texto diretamente abaixo antes de copiar
              </span>
            </label>

            <textarea
              value={customReportText}
              onChange={(e) => {
                setIsCustomEdited(true);
                setCustomReportText(e.target.value);
              }}
              rows={11}
              className="w-full bg-slate-900 text-slate-100 font-mono text-xs p-4 rounded-2xl border border-slate-800 focus:outline-none focus:border-emerald-500 leading-relaxed shadow-inner custom-scrollbar resize-y"
              placeholder="Edite a mensagem do check de equipes..."
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 sm:px-6 sm:py-3.5 border-t border-slate-100 bg-slate-50/80 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            Fechar
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>Copiar Mensagem</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSendWhatsapp}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
              <span>Enviar no WhatsApp</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
