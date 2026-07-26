import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const realFleetData = [
  // KOMATSU - 830E-AC (Caminhões)
  ...['CA01', 'CA04', 'CA08', 'CA09', 'CA10', 'CA12', 'CA13', 'CA14', 'CA15', 'CA16', 'CA18', 'CA19', 'CA20', 'CA21'].map(t => ({
    tag: t, nome: 'Caminhão Fora de Estrada Komatsu 830E-AC', tipo: 'Caminhão Fora de Estrada', area: 'Frota Mina'
  })),

  // KOMATSU - 930E (Caminhões)
  ...['CA501', 'CA502', 'CA503', 'CA504'].map(t => ({
    tag: t, nome: 'Caminhão Fora de Estrada Komatsu 930E', tipo: 'Caminhão Fora de Estrada', area: 'Frota Mina'
  })),

  // CAT 797 (Caminhões)
  ...['CA301', 'CA303', 'CA305', 'CA307', 'CA308', 'CA309', 'CA310', 'CA311', 'CA312', 'CA313', 'CA314', 'CA315', 'CA316', 'CA317'].map(t => ({
    tag: t, nome: 'Caminhão Fora de Estrada CAT 797', tipo: 'Caminhão Fora de Estrada', area: 'Frota Mina'
  })),

  // CAT 793 (Caminhões)
  ...['CA101', 'CA102', 'CA103', 'CA104', 'CA105', 'CA106', 'CA107', 'CA109', 'CA110', 'CA112', 'CA113', 'CA114', 'CA115', 'CA116'].map(t => ({
    tag: t, nome: 'Caminhão Fora de Estrada CAT 793', tipo: 'Caminhão Fora de Estrada', area: 'Frota Mina'
  })),

  // CAT 794 AC (Caminhões)
  ...['CA601', 'CA602', 'CA603', 'CA604'].map(t => ({
    tag: t, nome: 'Caminhão Fora de Estrada CAT 794 AC', tipo: 'Caminhão Fora de Estrada', area: 'Frota Mina'
  })),

  // KOMATSU PC5500 (Escavadeiras)
  ...['EC01', 'EC13', 'EC17', 'EC24', 'EC32'].map(t => ({
    tag: t, nome: 'Escavadeira Hidráulica Komatsu PC5500', tipo: 'Escavadeira', area: 'Praça de Carga'
  })),

  // BUCYRUS 495HD (Escavadeiras)
  ...['EC02', 'EC03', 'EC10', 'EC14'].map(t => ({
    tag: t, nome: 'Escavadeira Bucyrus 495HD', tipo: 'Escavadeira', area: 'Praça de Carga'
  })),

  // BUCYRUS 495HR (Escavadeiras)
  ...['EC18'].map(t => ({
    tag: t, nome: 'Escavadeira Bucyrus 495HR', tipo: 'Escavadeira', area: 'Praça de Carga'
  })),

  // LETOURNEAU L1850 (Pás Carregadeiras)
  ...['PC02', 'PC04'].map(t => ({
    tag: t, nome: 'Pá Carregadeira LeTourneau L1850', tipo: 'Pá Carregadeira (PC)', area: 'Praça de Carga'
  })),

  // ATLAS COPCO 351D (Perfuratriz Autônoma)
  ...['PF1803', 'PZ02', 'PZ03', 'PZ14', 'PZ15', 'PZ35', 'PZ37'].map(t => ({
    tag: t, nome: 'Perfuratriz Autônoma Atlas Copco 351D', tipo: 'Perfuratriz', area: 'Frota Mina'
  })),

  // ATLAS COPCO RL8 (Perfuratrizes)
  ...['PZ20', 'PZ21', 'PZ22', 'PZ23'].map(t => ({
    tag: t, nome: 'Perfuratriz Atlas Copco RL8', tipo: 'Perfuratriz', area: 'Frota Mina'
  })),

  // BUCYRUS 49HR (Perfuratrizes)
  ...['PZ16', 'PZ17', 'PZ41', 'PZ42'].map(t => ({
    tag: t, nome: 'Perfuratriz Bucyrus 49HR', tipo: 'Perfuratriz', area: 'Frota Mina'
  })),

  // SANDVIK DR416I (Perfuratrizes)
  ...['PZ43', 'PZ44'].map(t => ({
    tag: t, nome: 'Perfuratriz Sandvik DR416I', tipo: 'Perfuratriz', area: 'Frota Mina'
  })),

  // RETRO ESCAVADEIRA
  ...['EC09', 'EC19', 'EC20', 'EC21', 'EC23', 'EC26', 'EC27', 'EC28', 'EC29', 'EC30', 'EC31'].map(t => ({
    tag: t, nome: 'Retroescavadeira de Infraestrutura', tipo: 'Escavadeira', area: 'Infraestrutura'
  })),

  // TRATOR DE ESTEIRAS (TELEOPERADOS / CONVENCIONAIS)
  ...['TT03', 'TT05', 'TT10', 'TT43', 'TT52', 'TT53', 'TT55', 'TT56', 'TT57', 'TT81', 'TT82', 'TT83', 'TT84', 'TT85', 'TT86', 'TT87'].map(t => ({
    tag: t, nome: 'Trator de Esteira / Teleoperado', tipo: 'Trator (TT)', area: 'Infraestrutura'
  })),

  // CAMINHÕES RODOVIÁRIOS
  ...['CV38', 'CV39', 'CV41', 'CV45', 'CV46', 'CV47', 'CV48', 'CV58'].map(t => ({
    tag: t, nome: 'Caminhão Rodoviário de Apoio', tipo: 'Caminhão Fora de Estrada', area: 'Infraestrutura'
  })),

  // MOTONIVELADORA
  ...['MA51', 'MA81', 'MA82', 'MA83', 'MA84', 'MA85'].map(t => ({
    tag: t, nome: 'Motoniveladora de Pista', tipo: 'Motoniveladora (MA)', area: 'Infraestrutura'
  })),

  // PIPAS (CAMINHÃO PIPA)
  ...['CA11', 'CA17', 'CA401', 'CA402'].map(t => ({
    tag: t, nome: 'Caminhão Pipa de Umectação', tipo: 'Caminhão Pipa', area: 'Frota Mina'
  })),

  // PÁ CARREGADEIRA
  ...['PC13', 'PC14'].map(t => ({
    tag: t, nome: 'Pá Carregadeira de Apoio', tipo: 'Pá Carregadeira (PC)', area: 'Praça de Carga'
  })),

  // PRANCHA
  ...['CA201', 'CV25'].map(t => ({
    tag: t, nome: 'Caminhão Prancha de Transporte', tipo: 'Caminhão Fora de Estrada', area: 'Infraestrutura'
  })),

  // TRATOR PNEU
  ...['TU09', 'TU22', 'TU23', 'TU24', 'TU25'].map(t => ({
    tag: t, nome: 'Trator de Pneu / Utilitário', tipo: 'TU (Utilitário)', area: 'Infraestrutura'
  })),

  // EMPILHADEIRA
  ...['GD53', 'PC11'].map(t => ({
    tag: t, nome: 'Empilhadeira de Almoxarifado', tipo: 'Outros', area: 'Utilidades'
  })),

  // RETRO DE PNEU
  ...['RP01'].map(t => ({
    tag: t, nome: 'Retroescavadeira de Pneu', tipo: 'Escavadeira', area: 'Infraestrutura'
  })),

  // ROMPEDOR
  ...['EC22'].map(t => ({
    tag: t, nome: 'Rompedor Hidráulico', tipo: 'Outros', area: 'Infraestrutura'
  })),

  // REPETIDORAS DE SINAL DA MINA (RPT)
  ...['RPT05', 'RPT102', 'RPT104', 'RPT110', 'RPT112', 'RPT113', 'RPT116', 'RPT117',
      'RPT118', 'RPT120', 'RPT121', 'RPT133', 'RPT136', 'RPT137', 'RPT140',
      'RPT141', 'RPT142', 'RPT143', 'RPT144', 'RPT151', 'RPT153', 'RPT154', 'RPT155',
      'RPT156', 'RPT157', 'RPT158', 'RPT159', 'RPT160', 'RPT161', 'RPT162', 'RPT164'
  ].map(t => ({
    tag: t, nome: `Repetidora de Sinal da Mina ${t}`, tipo: 'Repetidora de Sinal', area: 'Infraestrutura / Telecom'
  })),
];

async function seedFleet() {
  console.log('🚀 Cadastrando repetidoras de sinal e frota no banco de dados...');
  
  let count = 0;
  for (const item of realFleetData) {
    const existing = await prisma.equipment.findUnique({
      where: { tag: item.tag },
    });

    if (!existing) {
      await prisma.equipment.create({
        data: {
          tag: item.tag,
          nome: item.nome,
          tipo: item.tipo,
          area: item.area,
        },
      });
      count++;
    }
  }

  console.log(`✅ ${count} novos equipamentos cadastrados com sucesso!`);
}

seedFleet()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
