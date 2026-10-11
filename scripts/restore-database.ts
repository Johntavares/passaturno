import { prisma } from '../src/lib/prisma';
import fs from 'fs';
import path from 'path';

async function restoreDatabase() {
  console.log('🔄 Iniciando restauração do banco de dados a partir do backup...');
  const backupPath = path.join(process.cwd(), 'passaturno_backup_latest.json');

  if (!fs.existsSync(backupPath)) {
    console.error('❌ Arquivo passaturno_backup_latest.json não encontrado!');
    process.exit(1);
  }

  const raw = fs.readFileSync(backupPath, 'utf-8');
  const backup = JSON.parse(raw);
  const { dados } = backup;

  try {
    console.log('1. Restaurando Usuários...');
    for (const u of dados.users || []) {
      await prisma.user.upsert({
        where: { id: u.id },
        update: u,
        create: u,
      });
    }

    console.log('2. Restaurando Equipamentos...');
    for (const eq of dados.equipments || []) {
      await prisma.equipment.upsert({
        where: { id: eq.id },
        update: eq,
        create: eq,
      });
    }

    console.log('3. Restaurando Turnos...');
    for (const s of dados.shifts || []) {
      const shiftData = {
        ...s,
        horaInicio: new Date(s.horaInicio),
        horaFim: s.horaFim ? new Date(s.horaFim) : null,
        criadoEm: new Date(s.criadoEm),
      };
      await prisma.shift.upsert({
        where: { id: s.id },
        update: shiftData,
        create: shiftData,
      });
    }

    console.log('4. Restaurando Categorias de Falha...');
    for (const cat of dados.failureCategories || []) {
      await prisma.failureCategory.upsert({
        where: { id: cat.id },
        update: cat,
        create: cat,
      });
    }

    console.log('5. Restaurando Configs do Boletim...');
    for (const cfg of dados.boletimConfigs || []) {
      await prisma.boletimConfig.upsert({
        where: { turma: cfg.turma },
        update: cfg,
        create: cfg,
      });
    }

    console.log('6. Restaurando Carteira do Boletim...');
    for (const cart of dados.boletimCarteiras || []) {
      await prisma.boletimCarteira.upsert({
        where: {
          turma_data: { turma: cart.turma, data: cart.data },
        },
        update: cart,
        create: cart,
      });
    }

    console.log('7. Restaurando Atendimentos (Incidentes)...');
    for (const inc of dados.incidents || []) {
      const incData = {
        ...inc,
        dataHoraParada: new Date(inc.dataHoraParada),
        dataHoraAcionamento: inc.dataHoraAcionamento ? new Date(inc.dataHoraAcionamento) : null,
        dataHoraLiberacao: inc.dataHoraLiberacao ? new Date(inc.dataHoraLiberacao) : null,
        criadoEm: new Date(inc.criadoEm),
        atualizadoEm: new Date(inc.atualizadoEm),
      };
      await prisma.incident.upsert({
        where: { id: inc.id },
        update: incData,
        create: incData,
      });
    }

    console.log('8. Restaurando Histórico dos Atendimentos...');
    for (const h of dados.incidentHistories || []) {
      const hData = {
        ...h,
        dataHora: new Date(h.dataHora),
      };
      await prisma.incidentHistory.upsert({
        where: { id: h.id },
        update: hData,
        create: hData,
      });
    }

    console.log('9. Restaurando Passagens de Turno...');
    for (const ho of dados.shiftHandovers || []) {
      const hoData = {
        ...ho,
        dataHora: new Date(ho.dataHora),
      };
      await prisma.shiftHandover.upsert({
        where: { id: ho.id },
        update: hoData,
        create: hoData,
      });
    }

    console.log('\n🎉 RESTAURAÇÃO COMPLETA REALIZADA COM SUCESSO!');
  } catch (err) {
    console.error('❌ Erro durante a restauração:', err);
  } finally {
    await prisma.$disconnect();
  }
}

restoreDatabase();
