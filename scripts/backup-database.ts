import { prisma } from '../src/lib/prisma';
import fs from 'fs';
import path from 'path';

async function generateFullBackup() {
  console.log('🔄 Iniciando backup completo de todas as tabelas do banco de dados...');
  const startTime = Date.now();

  try {
    const [
      users,
      shifts,
      equipments,
      failureCategories,
      boletimConfigs,
      boletimCarteiras,
      incidents,
      incidentHistories,
      shiftHandovers,
      leaderMessages,
      operatorReplies,
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.shift.findMany(),
      prisma.equipment.findMany(),
      prisma.failureCategory.findMany(),
      prisma.boletimConfig.findMany(),
      prisma.boletimCarteira.findMany(),
      prisma.incident.findMany(),
      prisma.incidentHistory.findMany(),
      prisma.shiftHandover.findMany(),
      prisma.leaderMessage.findMany(),
      prisma.operatorReply.findMany(),
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      versao: 'passaturno-v2-full-backup',
      contadores: {
        users: users.length,
        shifts: shifts.length,
        equipments: equipments.length,
        failureCategories: failureCategories.length,
        boletimConfigs: boletimConfigs.length,
        boletimCarteiras: boletimCarteiras.length,
        incidents: incidents.length,
        incidentHistories: incidentHistories.length,
        shiftHandovers: shiftHandovers.length,
        leaderMessages: leaderMessages.length,
        operatorReplies: operatorReplies.length,
      },
      dados: {
        users,
        shifts,
        equipments,
        failureCategories,
        boletimConfigs,
        boletimCarteiras,
        incidents,
        incidentHistories,
        shiftHandovers,
        leaderMessages,
        operatorReplies,
      },
    };

    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const jsonFileName = `passaturno_backup_${dateStr}.json`;
    const jsonFilePath = path.join(process.cwd(), jsonFileName);

    fs.writeFileSync(jsonFilePath, JSON.stringify(backupData, null, 2), 'utf-8');

    // Também atualizamos o arquivo de backup padrão na raiz
    fs.writeFileSync(path.join(process.cwd(), 'passaturno_backup_latest.json'), JSON.stringify(backupData, null, 2), 'utf-8');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ BACKUP CONCLUÍDO COM SUCESSO em ${duration}s!`);
    console.log(`📁 Arquivo salvo em: ${jsonFileName}`);
    console.log('📊 Resumo dos dados extraídos:');
    console.log(` - Usuários: ${users.length}`);
    console.log(` - Turnos: ${shifts.length}`);
    console.log(` - Equipamentos: ${equipments.length}`);
    console.log(` - Categorias de falha: ${failureCategories.length}`);
    console.log(` - Configs do boletim: ${boletimConfigs.length}`);
    console.log(` - Carteira do boletim: ${boletimCarteiras.length}`);
    console.log(` - Atendimentos (Incidentes): ${incidents.length}`);
    console.log(` - Histórico de Atendimentos: ${incidentHistories.length}`);
    console.log(` - Passagens de Turno: ${shiftHandovers.length}`);
    console.log(` - Mensagens do Líder: ${leaderMessages.length}`);
    console.log(` - Respostas de Operadores: ${operatorReplies.length}`);
  } catch (error) {
    console.error('❌ Erro ao gerar backup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateFullBackup();
