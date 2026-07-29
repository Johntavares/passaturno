// Store em memória resiliente para produção serverless (Vercel) caso o SQLite não esteja acessível

export interface InMemoryEquipment {
  id: string;
  tag: string;
  nome: string;
  tipo: string;
  area: string;
  horimetroOpcional?: number | null;
  criadoEm: string;
  _count?: { incidents: number };
}

export interface InMemoryIncidentHistory {
  id: string;
  incidentId: string;
  tipoEvento: string;
  descricao: string;
  usuario: string;
  dataHora: string;
}

export interface InMemoryIncident {
  id: string;
  equipmentId?: string | null;
  equipment?: InMemoryEquipment | null;
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
  prioridade: string;
  status: string;
  responsavelId?: string | null;
  responsavel: string;
  solucao?: string | null;
  motivoEspera?: string | null;
  proximaAcao?: string | null;
  localizacaoAtualOpcional?: string | null;
  observacao?: string | null;
  shiftId?: string | null;
  turma?: string | null;
  isPendenciaHerdada: boolean;
  historico: InMemoryIncidentHistory[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface InMemoryShift {
  id: string;
  equipe: string;
  turma: string;
  tipoTurno: string;
  escala: string;
  ausencias?: string | null;
  monitoramento?: string | null;
  horarioTurno?: string | null;
  responsavelId?: string | null;
  responsavelNome: string;
  data: string;
  horaInicio: string;
  horaFim?: string | null;
  status: string;
  observacoes?: string | null;
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
  criadoEm: string;
}

const initialFleetData: InMemoryEquipment[] = [
  // KOMATSU - 830E-AC (Caminhões)
  ...['CA01', 'CA04', 'CA08', 'CA09', 'CA10', 'CA12', 'CA13', 'CA14', 'CA15', 'CA16', 'CA18', 'CA19', 'CA20', 'CA21'].map((t, idx) => ({
    id: `eq-ca830-${idx}`, tag: t, nome: 'Caminhão Fora de Estrada Komatsu 830E-AC', tipo: 'Caminhão Fora de Estrada', area: 'Frota Mina', criadoEm: new Date().toISOString()
  })),

  // KOMATSU - 930E (Caminhões)
  ...['CA501', 'CA502', 'CA503', 'CA504'].map((t, idx) => ({
    id: `eq-ca930-${idx}`, tag: t, nome: 'Caminhão Fora de Estrada Komatsu 930E', tipo: 'Caminhão Fora de Estrada', area: 'Frota Mina', criadoEm: new Date().toISOString()
  })),

  // CAT 797 (Caminhões) - Inclui CA301 a CA317 (ex: 306, CA306)
  ...['CA301', 'CA302', 'CA303', 'CA304', 'CA305', 'CA306', 'CA307', 'CA308', 'CA309', 'CA310', 'CA311', 'CA312', 'CA313', 'CA314', 'CA315', 'CA316', 'CA317'].map((t, idx) => ({
    id: `eq-ca797-${idx}`, tag: t, nome: 'Caminhão Fora de Estrada CAT 797', tipo: 'Caminhão Fora de Estrada', area: 'Frota Mina', criadoEm: new Date().toISOString()
  })),

  // CAT 793 (Caminhões)
  ...['CA101', 'CA102', 'CA103', 'CA104', 'CA105', 'CA106', 'CA107', 'CA109', 'CA110', 'CA112', 'CA113', 'CA114', 'CA115', 'CA116'].map((t, idx) => ({
    id: `eq-ca793-${idx}`, tag: t, nome: 'Caminhão Fora de Estrada CAT 793', tipo: 'Caminhão Fora de Estrada', area: 'Frota Mina', criadoEm: new Date().toISOString()
  })),

  // CAT 794 AC (Caminhões)
  ...['CA601', 'CA602', 'CA603', 'CA604'].map((t, idx) => ({
    id: `eq-ca794-${idx}`, tag: t, nome: 'Caminhão Fora de Estrada CAT 794 AC', tipo: 'Caminhão Fora de Estrada', area: 'Frota Mina', criadoEm: new Date().toISOString()
  })),

  // KOMATSU PC5500 (Escavadeiras)
  ...['EC01', 'EC13', 'EC17', 'EC24', 'EC32'].map((t, idx) => ({
    id: `eq-ec5500-${idx}`, tag: t, nome: 'Escavadeira Hidráulica Komatsu PC5500', tipo: 'Escavadeira', area: 'Praça de Carga', criadoEm: new Date().toISOString()
  })),

  // BUCYRUS 495HD (Escavadeiras)
  ...['EC02', 'EC03', 'EC10', 'EC14'].map((t, idx) => ({
    id: `eq-ec495hd-${idx}`, tag: t, nome: 'Escavadeira Bucyrus 495HD', tipo: 'Escavadeira', area: 'Praça de Carga', criadoEm: new Date().toISOString()
  })),

  // BUCYRUS 495HR (Escavadeiras)
  ...['EC18'].map((t, idx) => ({
    id: `eq-ec495hr-${idx}`, tag: t, nome: 'Escavadeira Bucyrus 495HR', tipo: 'Escavadeira', area: 'Praça de Carga', criadoEm: new Date().toISOString()
  })),

  // LETOURNEAU L1850 (Pás Carregadeiras)
  ...['PC02', 'PC04'].map((t, idx) => ({
    id: `eq-pc1850-${idx}`, tag: t, nome: 'Pá Carregadeira LeTourneau L1850', tipo: 'Pá Carregadeira (PC)', area: 'Praça de Carga', criadoEm: new Date().toISOString()
  })),

  // ATLAS COPCO 351D (Perfuratriz Autônoma)
  ...['PF1803', 'PZ02', 'PZ03', 'PZ14', 'PZ15', 'PZ35', 'PZ37'].map((t, idx) => ({
    id: `eq-pz351d-${idx}`, tag: t, nome: 'Perfuratriz Autônoma Atlas Copco 351D', tipo: 'Perfuratriz', area: 'Frota Mina', criadoEm: new Date().toISOString()
  })),

  // ATLAS COPCO RL8 (Perfuratrizes)
  ...['PZ20', 'PZ21', 'PZ22', 'PZ23'].map((t, idx) => ({
    id: `eq-pzrl8-${idx}`, tag: t, nome: 'Perfuratriz Atlas Copco RL8', tipo: 'Perfuratriz', area: 'Frota Mina', criadoEm: new Date().toISOString()
  })),

  // BUCYRUS 49HR (Perfuratrizes)
  ...['PZ16', 'PZ17', 'PZ41', 'PZ42'].map((t, idx) => ({
    id: `eq-pz49hr-${idx}`, tag: t, nome: 'Perfuratriz Bucyrus 49HR', tipo: 'Perfuratriz', area: 'Frota Mina', criadoEm: new Date().toISOString()
  })),

  // SANDVIK DR416I (Perfuratrizes)
  ...['PZ43', 'PZ44'].map((t, idx) => ({
    id: `eq-pzdr416i-${idx}`, tag: t, nome: 'Perfuratriz Sandvik DR416I', tipo: 'Perfuratriz', area: 'Frota Mina', criadoEm: new Date().toISOString()
  })),

  // RETRO ESCAVADEIRA
  ...['EC09', 'EC19', 'EC20', 'EC21', 'EC23', 'EC26', 'EC27', 'EC28', 'EC29', 'EC30', 'EC31'].map((t, idx) => ({
    id: `eq-ecretro-${idx}`, tag: t, nome: 'Retroescavadeira de Infraestrutura', tipo: 'Escavadeira', area: 'Infraestrutura', criadoEm: new Date().toISOString()
  })),

  // TRATOR DE ESTEIRAS (TELEOPERADOS / CONVENCIONAIS)
  ...['TT03', 'TT05', 'TT10', 'TT43', 'TT52', 'TT53', 'TT55', 'TT56', 'TT57', 'TT81', 'TT82', 'TT83', 'TT84', 'TT85', 'TT86', 'TT87'].map((t, idx) => ({
    id: `eq-ttesteira-${idx}`, tag: t, nome: 'Trator de Esteira / Teleoperado', tipo: 'Trator (TT)', area: 'Infraestrutura', criadoEm: new Date().toISOString()
  })),

  // CAMINHÕES RODOVIÁRIOS
  ...['CV38', 'CV39', 'CV41', 'CV45', 'CV46', 'CV47', 'CV48', 'CV58'].map((t, idx) => ({
    id: `eq-cvrodov-${idx}`, tag: t, nome: 'Caminhão Rodoviário de Apoio', tipo: 'Caminhão Fora de Estrada', area: 'Infraestrutura', criadoEm: new Date().toISOString()
  })),

  // MOTONIVELADORA
  ...['MA51', 'MA81', 'MA82', 'MA83', 'MA84', 'MA85'].map((t, idx) => ({
    id: `eq-matonin-${idx}`, tag: t, nome: 'Motoniveladora de Pista', tipo: 'Motoniveladora (MA)', area: 'Infraestrutura', criadoEm: new Date().toISOString()
  })),

  // PIPAS (CAMINHÃO PIPA)
  ...['CA11', 'CA17', 'CA401', 'CA402'].map((t, idx) => ({
    id: `eq-capipa-${idx}`, tag: t, nome: 'Caminhão Pipa de Umectação', tipo: 'Caminhão Pipa', area: 'Frota Mina', criadoEm: new Date().toISOString()
  })),

  // PÁ CARREGADEIRA
  ...['PC13', 'PC14'].map((t, idx) => ({
    id: `eq-pcapoio-${idx}`, tag: t, nome: 'Pá Carregadeira de Apoio', tipo: 'Pá Carregadeira (PC)', area: 'Praça de Carga', criadoEm: new Date().toISOString()
  })),

  // PRANCHA
  ...['CA201', 'CV25'].map((t, idx) => ({
    id: `eq-caprancha-${idx}`, tag: t, nome: 'Caminhão Prancha de Transporte', tipo: 'Caminhão Fora de Estrada', area: 'Infraestrutura', criadoEm: new Date().toISOString()
  })),

  // TRATOR PNEU
  ...['TU09', 'TU22', 'TU23', 'TU24', 'TU25'].map((t, idx) => ({
    id: `eq-tupneu-${idx}`, tag: t, nome: 'Trator de Pneu / Utilitário', tipo: 'TU (Utilitário)', area: 'Infraestrutura', criadoEm: new Date().toISOString()
  })),

  // EMPILHADEIRA
  ...['GD53', 'PC11'].map((t, idx) => ({
    id: `eq-empilh-${idx}`, tag: t, nome: 'Empilhadeira de Almoxarifado', tipo: 'Outros', area: 'Utilidades', criadoEm: new Date().toISOString()
  })),

  // RETRO DE PNEU
  ...['RP01'].map((t, idx) => ({
    id: `eq-rp01-${idx}`, tag: t, nome: 'Retroescavadeira de Pneu', tipo: 'Escavadeira', area: 'Infraestrutura', criadoEm: new Date().toISOString()
  })),

  // ROMPEDOR
  ...['EC22'].map((t, idx) => ({
    id: `eq-ec22-${idx}`, tag: t, nome: 'Rompedor Hidráulico', tipo: 'Outros', area: 'Infraestrutura', criadoEm: new Date().toISOString()
  })),

  // REPETIDORAS DE SINAL DA MINA (RPT)
  ...['RPT05', 'RPT102', 'RPT104', 'RPT110', 'RPT112', 'RPT113', 'RPT116', 'RPT117',
      'RPT118', 'RPT120', 'RPT121', 'RPT133', 'RPT136', 'RPT137', 'RPT140',
      'RPT141', 'RPT142', 'RPT143', 'RPT144', 'RPT151', 'RPT153', 'RPT154', 'RPT155',
      'RPT156', 'RPT157', 'RPT158', 'RPT159', 'RPT160', 'RPT161', 'RPT162', 'RPT164'
  ].map((t, idx) => ({
    id: `eq-rpt-${idx}`, tag: t, nome: `Repetidora de Sinal da Mina ${t}`, tipo: 'Repetidora de Sinal', area: 'Infraestrutura / Telecom', criadoEm: new Date().toISOString()
  })),
];

// Estado global mantido na memória da execução Node.js/Vercel
const globalStore = global as unknown as {
  inMemoryEquipments?: InMemoryEquipment[];
  inMemoryIncidents?: InMemoryIncident[];
  inMemoryShift?: InMemoryShift;
};

if (!globalStore.inMemoryEquipments) {
  globalStore.inMemoryEquipments = initialFleetData;
}

if (!globalStore.inMemoryIncidents || globalStore.inMemoryIncidents.length === 0) {
  const nowIso = new Date().toISOString();
  const pastOneHour = new Date(Date.now() - 3600000).toISOString();
  const pastTwoHours = new Date(Date.now() - 7200000).toISOString();

  globalStore.inMemoryIncidents = [
    {
      id: 'inc-demo-306',
      equipmentId: 'eq-ca797-5',
      equipment: null,
      tag: 'CA306',
      equipamentoNome: 'Caminhão Fora de Estrada CAT 797',
      area: 'Frota Mina',
      tipoFalha: 'Comunicação',
      falha: 'PTX TRAVADO',
      sintoma: 'Dispositivo PTX travado no painel da cabine',
      dataHoraParada: pastOneHour,
      dataHoraAcionamento: pastOneHour,
      previsaoLiberacao: '15:30',
      dataHoraLiberacao: nowIso,
      prioridade: 'MEDIA',
      status: 'RETROAGIDO',
      responsavel: 'John Tavares',
      solucao: 'Constatado problema mecânico na chave do veículo. Atendimento retroagido.',
      shiftId: 'shift-active-1',
      turma: 'A',
      isPendenciaHerdada: false,
      criadoEm: pastOneHour,
      atualizadoEm: nowIso,
      historico: [
        {
          id: 'hist-306-1',
          incidentId: 'inc-demo-306',
          tipoEvento: 'ABERTURA',
          descricao: 'Ocorrência iniciada por John Tavares. Falha: PTX TRAVADO',
          usuario: 'John Tavares',
          dataHora: pastOneHour,
        },
        {
          id: 'hist-306-2',
          incidentId: 'inc-demo-306',
          tipoEvento: 'RETROACAO',
          descricao: 'Atendimento retroagido por John Tavares (Constatado que não era falha de automação).',
          usuario: 'John Tavares',
          dataHora: nowIso,
        },
      ],
    },
    {
      id: 'inc-demo-101',
      equipmentId: 'eq-ca793-0',
      equipment: null,
      tag: 'CA101',
      equipamentoNome: 'Caminhão Fora de Estrada CAT 793',
      area: 'Frota Mina',
      tipoFalha: 'Rede Industrial',
      falha: 'Oscilação no Sinal de Rádio/GPS',
      sintoma: 'Perda temporária de pacotes na telemetria',
      dataHoraParada: pastTwoHours,
      dataHoraAcionamento: pastTwoHours,
      previsaoLiberacao: 'Concluído',
      dataHoraLiberacao: pastOneHour,
      prioridade: 'ALTA',
      status: 'FINALIZADO',
      responsavel: 'John Tavares',
      solucao: 'Reaperto do conector M12 e limpeza do conector da antena RPT.',
      shiftId: 'shift-active-1',
      turma: 'B',
      isPendenciaHerdada: false,
      criadoEm: pastTwoHours,
      atualizadoEm: pastOneHour,
      historico: [
        {
          id: 'hist-101-1',
          incidentId: 'inc-demo-101',
          tipoEvento: 'ABERTURA',
          descricao: 'Ocorrência iniciada por John Tavares. Falha: Oscilação no Sinal de Rádio/GPS',
          usuario: 'John Tavares',
          dataHora: pastTwoHours,
        },
        {
          id: 'hist-101-2',
          incidentId: 'inc-demo-101',
          tipoEvento: 'SOLUCAO',
          descricao: 'Solução aplicada: Reaperto do conector M12 e limpeza do conector da antena RPT.',
          usuario: 'John Tavares',
          dataHora: pastOneHour,
        },
      ],
    },
  ];
}

if (!globalStore.inMemoryShift) {
  globalStore.inMemoryShift = {
    id: 'shift-active-1',
    equipe: 'Automação & CCO',
    turma: 'Turma A',
    tipoTurno: 'Diurno',
    escala: '2x3',
    horarioTurno: '07h às 19h',
    responsavelNome: 'John Tavares',
    data: new Date().toISOString().split('T')[0],
    horaInicio: new Date().toISOString(),
    status: 'ATIVO',
    criadoEm: new Date().toISOString(),
  };
}

export const inMemoryStore = {
  getEquipments: () => {
    return (globalStore.inMemoryEquipments || []).map((eq) => {
      const incCount = (globalStore.inMemoryIncidents || []).filter((i) => i.tag === eq.tag).length;
      return {
        ...eq,
        _count: { incidents: incCount },
      };
    });
  },

  findEquipmentByTag: (tag: string) => {
    const cleanTag = tag.trim().toUpperCase();
    return (globalStore.inMemoryEquipments || []).find((eq) => eq.tag === cleanTag || eq.tag.endsWith(cleanTag));
  },

  addEquipment: (data: { tag: string; nome: string; tipo?: string; area?: string; horimetroOpcional?: number | null }) => {
    const cleanTag = data.tag.trim().toUpperCase();
    const existing = inMemoryStore.findEquipmentByTag(cleanTag);
    if (existing) return existing;

    const newEq: InMemoryEquipment = {
      id: `eq-custom-${Date.now()}`,
      tag: cleanTag,
      nome: data.nome,
      tipo: data.tipo || 'Outros',
      area: data.area || 'Frota Mina',
      horimetroOpcional: data.horimetroOpcional || null,
      criadoEm: new Date().toISOString(),
      _count: { incidents: 0 },
    };

    globalStore.inMemoryEquipments = [newEq, ...(globalStore.inMemoryEquipments || [])];
    return newEq;
  },

  getIncidents: (filters?: { tag?: string; status?: string; prioridade?: string; search?: string }) => {
    let result = [...(globalStore.inMemoryIncidents || [])];

    if (filters?.tag) {
      result = result.filter((i) => i.tag.includes(filters.tag!.toUpperCase()));
    }
    if (filters?.status) {
      result = result.filter((i) => i.status === filters.status);
    }
    if (filters?.prioridade) {
      result = result.filter((i) => i.prioridade === filters.prioridade);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (i) =>
          i.tag.toLowerCase().includes(q) ||
          i.equipamentoNome.toLowerCase().includes(q) ||
          i.falha.toLowerCase().includes(q) ||
          i.responsavel.toLowerCase().includes(q) ||
          i.area.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  },

  findIncidentById: (id: string) => {
    return (globalStore.inMemoryIncidents || []).find((i) => i.id === id);
  },

  createIncident: (data: any) => {
    const tagUpper = (data.tag || '').toUpperCase().trim();
    let eq = inMemoryStore.findEquipmentByTag(tagUpper);

    if (!eq) {
      eq = inMemoryStore.addEquipment({
        tag: tagUpper,
        nome: data.equipamentoNome || `Equipamento ${tagUpper}`,
        area: data.area || 'Frota Mina',
        tipo: 'Outros',
      });
    }

    const nowIso = new Date().toISOString();
    const newIncident: InMemoryIncident = {
      id: `inc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      equipmentId: eq?.id || null,
      equipment: eq || null,
      tag: tagUpper,
      equipamentoNome: data.equipamentoNome || eq?.nome || `Equipamento ${tagUpper}`,
      area: data.area || eq?.area || 'Frota Mina',
      tipoFalha: data.tipoFalha || 'Comunicação',
      falha: data.falha,
      sintoma: data.sintoma || null,
      dataHoraParada: data.dataHoraParada || nowIso,
      dataHoraAcionamento: data.dataHoraAcionamento || nowIso,
      previsaoLiberacao: data.previsaoLiberacao || null,
      dataHoraLiberacao: null,
      prioridade: data.prioridade || 'MEDIA',
      status: data.status || 'EM_ANDAMENTO',
      responsavel: data.responsavel || 'John Tavares',
      motivoEspera: data.motivoEspera || null,
      proximaAcao: data.proximaAcao || null,
      localizacaoAtualOpcional: data.localizacaoAtualOpcional || null,
      observacao: data.observacao || null,
      shiftId: globalStore.inMemoryShift?.id || null,
      isPendenciaHerdada: false,
      criadoEm: nowIso,
      atualizadoEm: nowIso,
      historico: [
        {
          id: `hist-${Date.now()}`,
          incidentId: '',
          tipoEvento: 'ABERTURA',
          descricao: `Ocorrência iniciada por ${data.responsavel || 'John Tavares'}. Falha: ${data.falha}`,
          usuario: data.responsavel || 'John Tavares',
          dataHora: nowIso,
        },
      ],
    };

    newIncident.historico[0].incidentId = newIncident.id;
    globalStore.inMemoryIncidents = [newIncident, ...(globalStore.inMemoryIncidents || [])];
    return newIncident;
  },

  updateIncident: (id: string, updateData: any) => {
    const incIndex = (globalStore.inMemoryIncidents || []).findIndex((i) => i.id === id);
    if (incIndex === -1) return null;

    const current = globalStore.inMemoryIncidents![incIndex];
    const nowIso = new Date().toISOString();

    let eventType = 'ATUALIZACAO';
    let defaultLogDesc = 'Atendimento atualizado.';

    if (updateData.status && updateData.status !== current.status) {
      eventType = 'ALTERACAO_STATUS';
      defaultLogDesc = `Status alterado de ${current.status} para ${updateData.status}.`;
      if (updateData.status === 'FINALIZADO') {
        current.dataHoraLiberacao = nowIso;
        eventType = 'LIBERACAO';
        defaultLogDesc = `Equipamento liberado por ${updateData.logUsuario || updateData.responsavel || current.responsavel}.`;
      }
    }

    if (updateData.solucao) {
      eventType = 'SOLUCAO';
      defaultLogDesc = `Solução aplicada: ${updateData.solucao}`;
    }

    const updated = {
      ...current,
      ...updateData,
      atualizadoEm: nowIso,
      historico: [
        {
          id: `hist-${Date.now()}`,
          incidentId: current.id,
          tipoEvento: eventType,
          descricao: updateData.logDescription || defaultLogDesc,
          usuario: updateData.logUsuario || updateData.responsavel || current.responsavel,
          dataHora: nowIso,
        },
        ...current.historico,
      ],
    };

    globalStore.inMemoryIncidents![incIndex] = updated;
    return updated;
  },

  deleteIncident: (idOrTag: string) => {
    const q = (idOrTag || '').toUpperCase().trim();
    globalStore.inMemoryIncidents = (globalStore.inMemoryIncidents || []).filter(
      (i) => i.id !== idOrTag && i.tag.toUpperCase().trim() !== q
    );
    return true;
  },

  getActiveShift: () => {
    const activeShift = globalStore.inMemoryShift?.status === 'ATIVO' ? globalStore.inMemoryShift : null;
    const activeIncidents = inMemoryStore.getIncidents({ status: 'EM_ANDAMENTO' });
    const criticalCount = activeIncidents.filter((i) => i.prioridade === 'CRITICA').length;
    const inheritedCount = activeIncidents.filter((i) => i.isPendenciaHerdada).length;

    return {
      activeShift,
      lastClosedShift: null,
      openIncidentsCount: activeIncidents.length,
      criticalCount,
      inheritedCount,
      openIncidents: activeIncidents,
    };
  },

  closeShift: () => {
    if (globalStore.inMemoryShift) {
      globalStore.inMemoryShift.status = 'ENCERRADO';
      globalStore.inMemoryShift.horaFim = new Date().toISOString();
    }
  },

  updateShift: (shiftData: Partial<InMemoryShift>) => {
    if (globalStore.inMemoryShift) {
      globalStore.inMemoryShift = {
        ...globalStore.inMemoryShift,
        ...shiftData,
      };
    }
    return globalStore.inMemoryShift;
  },
};
