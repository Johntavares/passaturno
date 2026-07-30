-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "matricula" TEXT,
    "equipe" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "turma" TEXT NOT NULL DEFAULT 'A',
    "horarioTurno" TEXT DEFAULT '07:00 às 19:00',
    "periodoTurno" TEXT DEFAULT 'Dia',
    "criadoPor" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "equipe" TEXT NOT NULL,
    "turma" TEXT DEFAULT 'A',
    "tipoTurno" TEXT DEFAULT 'Diurno',
    "escala" TEXT DEFAULT '2x3',
    "ausencias" TEXT,
    "monitoramento" TEXT,
    "horarioTurno" TEXT DEFAULT '07h às 19h',
    "responsavelId" TEXT,
    "responsavelNome" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "horaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "horaFim" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "observacoes" TEXT,
    "liderVale" TEXT,
    "equipeSonda" TEXT,
    "equipeContratadas" TEXT,
    "fmdsChecklist" TEXT,
    "equipamentosSemDespacho" TEXT,
    "equipamentosSemGps" TEXT,
    "equipamentosPreventiva" TEXT,
    "equipamentosManutencao" TEXT,
    "checklistMalaoStatus" TEXT DEFAULT 'Realizado',
    "checklistMalaoFaltantes" TEXT,
    "checklistMalaoResponsavel" TEXT,
    "solicitacaoMaterialStatus" TEXT,
    "solicitacaoMaterialResponsavel" TEXT,
    "anomaliasIdentificadas" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "horimetroOpcional" DOUBLE PRECISION,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT,
    "tag" TEXT NOT NULL,
    "equipamentoNome" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "tipoFalha" TEXT NOT NULL,
    "falha" TEXT NOT NULL,
    "sintoma" TEXT,
    "dataHoraParada" TIMESTAMP(3) NOT NULL,
    "dataHoraAcionamento" TIMESTAMP(3),
    "previsaoLiberacao" TEXT,
    "dataHoraLiberacao" TIMESTAMP(3),
    "prioridade" TEXT NOT NULL DEFAULT 'MEDIA',
    "status" TEXT NOT NULL DEFAULT 'EM_ANDAMENTO',
    "responsavelId" TEXT,
    "responsavel" TEXT NOT NULL,
    "solucao" TEXT,
    "motivoEspera" TEXT,
    "proximaAcao" TEXT,
    "localizacaoAtualOpcional" TEXT,
    "observacao" TEXT,
    "shiftId" TEXT,
    "isPendenciaHerdada" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentHistory" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "tipoEvento" TEXT NOT NULL DEFAULT 'ATUALIZACAO',
    "descricao" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftHandover" (
    "id" TEXT NOT NULL,
    "turnoAnteriorId" TEXT NOT NULL,
    "turnoNovoId" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responsavelSaida" TEXT NOT NULL,
    "responsavelEntrada" TEXT,
    "turma" TEXT,
    "monitoramento" TEXT,
    "horarioTurno" TEXT,
    "checklistMalaoStatus" TEXT,
    "checklistMalaoFaltantes" TEXT,
    "checklistMalaoResponsavel" TEXT,
    "solicitacaoMaterialStatus" TEXT,
    "solicitacaoMaterialResponsavel" TEXT,
    "anomaliasIdentificadas" TEXT,
    "observacoes" TEXT,
    "resumoFinalizados" TEXT NOT NULL,
    "resumoPendencias" TEXT NOT NULL,
    "prioridades" TEXT NOT NULL,

    CONSTRAINT "ShiftHandover_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderMessage" (
    "id" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "senderId" TEXT,
    "targetTurma" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatorReply" (
    "id" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "senderId" TEXT,
    "fromTurma" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperatorReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_matricula_key" ON "User"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_tag_key" ON "Equipment"("tag");

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentHistory" ADD CONSTRAINT "IncidentHistory_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftHandover" ADD CONSTRAINT "ShiftHandover_turnoAnteriorId_fkey" FOREIGN KEY ("turnoAnteriorId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftHandover" ADD CONSTRAINT "ShiftHandover_turnoNovoId_fkey" FOREIGN KEY ("turnoNovoId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderMessage" ADD CONSTRAINT "LeaderMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatorReply" ADD CONSTRAINT "OperatorReply_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
