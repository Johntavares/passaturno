// Cria a tabela BoletimConfig no Supabase, adiciona à publicação realtime e popula com os padrões.
// Uso: npx tsx scripts/init-boletim-config.mjs
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
  }
}

const DEFAULTS = {
  equipeSonda: 'Valdenir / Vitor / Gustavo',
  liderVale: 'Vinicius',
  ausenciaNome: 'Baia',
  ausenciaMotivo: 'férias',
  equipSemDespacho: 'EC10, PZ15, PZ20, PZ21, PZ42, PZ43, TT52, TT53, TT81, TT84',
  equipSemGps: 'TT57',
  equipPreventiva: 'EC17, PZ02, TT84, TT85',
  equipManutencao: 'PZ14, PZ47, TT56',
};

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();

    await client.query(`
      CREATE TABLE IF NOT EXISTS "BoletimConfig" (
        turma TEXT PRIMARY KEY,
        "equipeSonda" TEXT,
        "liderVale" TEXT,
        ausencia TEXT,
        "ausenciaNome" TEXT,
        "ausenciaMotivo" TEXT,
        "equipSemDespacho" TEXT,
        "equipSemGps" TEXT,
        "equipPreventiva" TEXT,
        "equipManutencao" TEXT,
        "atualizadoEm" TIMESTAMPTZ
      )
    `);
    console.log('+ Tabela BoletimConfig garantida');

    const cols = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'BoletimConfig'`
    );
    const colNames = cols.rows.map((r) => r.column_name);
    if (!colNames.includes('ausenciaNome')) {
      await client.query(`ALTER TABLE "BoletimConfig" ADD COLUMN "ausenciaNome" TEXT`);
      console.log('+ Coluna ausenciaNome adicionada');
    }
    if (!colNames.includes('ausenciaMotivo')) {
      await client.query(`ALTER TABLE "BoletimConfig" ADD COLUMN "ausenciaMotivo" TEXT`);
      console.log('+ Coluna ausenciaMotivo adicionada');
    }

    const backfilled = await client.query(`
      UPDATE "BoletimConfig"
      SET "ausenciaNome" = CASE
            WHEN position('(' in ausencia) > 1 THEN trim(substring(ausencia from 1 for position('(' in ausencia) - 1))
            ELSE trim(ausencia)
          END,
          "ausenciaMotivo" = CASE
            WHEN position('(' in ausencia) > 0 AND position(')' in ausencia) > position('(' in ausencia)
              THEN trim(substring(ausencia from position('(' in ausencia) + 1 for position(')' in ausencia) - position('(' in ausencia) - 1))
            ELSE NULL
          END
      WHERE "ausenciaNome" IS NULL AND ausencia IS NOT NULL AND ausencia <> ''
    `);
    if (backfilled.rowCount > 0) console.log(`+ Backfill ausenciaNome/ausenciaMotivo: ${backfilled.rowCount} linhas`);

    try {
      await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE "BoletimConfig"`);
      console.log('+ BoletimConfig adicionada à publicação supabase_realtime');
    } catch (e) {
      console.log('= BoletimConfig já estava na publicação (ou erro:', e.message?.slice(0, 120), ')');
    }

    for (const turma of ['A', 'B', 'C', 'D']) {
      const res = await client.query(
        `INSERT INTO "BoletimConfig" (turma, "equipeSonda", "liderVale", ausencia, "ausenciaNome", "ausenciaMotivo", "equipSemDespacho", "equipSemGps", "equipPreventiva", "equipManutencao", "atualizadoEm")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
         ON CONFLICT (turma) DO NOTHING`,
        [turma, DEFAULTS.equipeSonda, DEFAULTS.liderVale, `${DEFAULTS.ausenciaNome} (${DEFAULTS.ausenciaMotivo})`, DEFAULTS.ausenciaNome, DEFAULTS.ausenciaMotivo, DEFAULTS.equipSemDespacho, DEFAULTS.equipSemGps, DEFAULTS.equipPreventiva, DEFAULTS.equipManutencao]
      );
      if (res.rowCount > 0) console.log(`+ Seed turma ${turma} criada`);
      else console.log(`= Turma ${turma} já existia`);
    }

    const all = await client.query(`SELECT turma, "equipeSonda", "liderVale" FROM "BoletimConfig" ORDER BY turma`);
    for (const r of all.rows) console.log(' -', r.turma, '|', r.equipeSonda, '|', r.liderVale);
  } catch (e) {
    console.log('ERRO:', e.message?.slice(0, 300));
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch(console.error);