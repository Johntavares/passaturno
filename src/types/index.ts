export type PriorityLevel = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export type IncidentStatusType = 'EM_ANDAMENTO' | 'AGUARDANDO' | 'FINALIZADO' | 'PENDENCIA_PROXIMO_TURNO';

export type EventTypeEnum = 
  | 'ABERTURA' 
  | 'ATUALIZACAO' 
  | 'ALTERACAO_STATUS' 
  | 'SOLUCAO' 
  | 'LIBERACAO' 
  | 'TRANSFERENCIA_TURNO';

export interface UserType {
  id: string;
  nome: string;
  equipe: string;
  cargo: string;
  criadoEm: string;
}

export interface EquipmentType {
  id: string;
  tag: string;
  nome: string;
  tipo: string;
  area: string;
  horimetroOpcional?: number | null;
  criadoEm: string;
  _count?: {
    incidents: number;
  };
}

export interface IncidentHistoryType {
  id: string;
  incidentId: string;
  tipoEvento: EventTypeEnum;
  descricao: string;
  usuario: string;
  dataHora: string;
}

export interface IncidentType {
  id: string;
  equipmentId?: string | null;
  equipment?: EquipmentType | null;
  tag: string;
  equipamentoNome: string;
  area: string;
  tipoFalha: string;
  falha: string;
  sintoma?: string | null;
  dataHoraParada: string;
  dataHoraAcionamento?: string | null;
  previsaoLiberacao?: string | null;
  dataHoraLiberacao?: string | null;
  prioridade: PriorityLevel;
  status: IncidentStatusType;
  responsavelId?: string | null;
  responsavel: string;
  solucao?: string | null;
  motivoEspera?: string | null;
  proximaAcao?: string | null;
  localizacaoAtualOpcional?: string | null;
  observacao?: string | null;
  shiftId?: string | null;
  isPendenciaHerdada: boolean;
  historico?: IncidentHistoryType[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface ShiftType {
  id: string;
  equipe: string;
  turma?: string | null;
  tipoTurno?: string | null;
  escala?: string | null;
  ausencias?: string | null;
  monitoramento?: string | null;
  horarioTurno?: string | null;
  responsavelId?: string | null;
  responsavelNome: string;
  data: string;
  horaInicio: string;
  horaFim?: string | null;
  status: 'ATIVO' | 'ENCERRADO';
  observacoes?: string | null;

  // Equipes e diagnósticos OneNote
  liderVale?: string | null;
  equipeSonda?: string | null;
  equipeContratadas?: string | null;
  fmdsChecklist?: string | null;
  equipamentosSemDespacho?: string | null;
  equipamentosSemGps?: string | null;
  equipamentosPreventiva?: string | null;
  equipamentosManutencao?: string | null;

  checklistMalaoStatus?: string | null;
  checklistMalaoFaltantes?: string | null;
  checklistMalaoResponsavel?: string | null;
  solicitacaoMaterialStatus?: string | null;
  solicitacaoMaterialResponsavel?: string | null;
  anomaliasIdentificadas?: string | null;
  incidents?: IncidentType[];
  criadoEm: string;
}

export interface ShiftHandoverType {
  id: string;
  turnoAnteriorId: string;
  turnoNovoId?: string | null;
  dataHora: string;
  responsavelSaida: string;
  responsavelEntrada?: string | null;
  turma?: string | null;
  monitoramento?: string | null;
  horarioTurno?: string | null;
  checklistMalaoStatus?: string | null;
  checklistMalaoFaltantes?: string | null;
  checklistMalaoResponsavel?: string | null;
  solicitacaoMaterialStatus?: string | null;
  solicitacaoMaterialResponsavel?: string | null;
  anomaliasIdentificadas?: string | null;
  observacoes?: string | null;
  resumoFinalizados: string;
  resumoPendencias: string;
  prioridades: string;
}
