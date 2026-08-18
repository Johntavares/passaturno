// Cria a tabela FailureCategory no Supabase, adiciona à publicação realtime e popula com o padrão.
// Uso: npx tsx scripts/init-failure-categories.mjs
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

const SEED = [
  'CASGPS',
  'OPTALERT',
  'MEMES',
  'DESMONTE',
  'TELEOP',
  'AUTONOMOS',
  'MODULAR',
  'ALIMENTAÇÃO/ELETRICA',
  'MOVIMENTAÇÃO',
];

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();

    await client.query(`
      CREATE TABLE IF NOT EXISTS "FailureCategory" (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL UNIQUE,
        "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "atualizadoEm" TIMESTAMPTZ
      )
    `);
    console.log('+ Tabela FailureCategory garantida');

    const cols = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'FailureCategory'`
    );
    const colNames = cols.rows.map((r) => r.column_name);
    if (!colNames.includes('criadoEm')) {
      await client.query(`ALTER TABLE "FailureCategory" RENAME COLUMN criadoem TO "criadoEm"`);
      console.log('+ Coluna renomeada: criadoem -> criadoEm');
    }
    if (!colNames.includes('atualizadoEm')) {
      await client.query(`ALTER TABLE "FailureCategory" RENAME COLUMN atualizadoem TO "atualizadoEm"`);
      console.log('+ Coluna renomeada: atualizadoem -> atualizadoEm');
    }

    try {
      await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE "FailureCategory"`);
      console.log('+ FailureCategory adicionada à publicação supabase_realtime');
    } catch (e) {
      console.log('= FailureCategory já estava na publicação (ou erro:', e.message?.slice(0, 120), ')');
    }

    let added = 0;
    for (const nome of SEED) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const res = await client.query(
        `INSERT INTO "FailureCategory" (id, nome, "criadoEm") VALUES ($1, $2, now()) ON CONFLICT (nome) DO NOTHING`,
        [id, nome]
      );
      if (res.rowCount > 0) added++;
    }
    console.log(`+ Seed: ${added} categorias inseridas (${SEED.length} no total)`);

    const all = await client.query(`SELECT nome FROM "FailureCategory" ORDER BY criadoEm`);
    console.log('Categorias no banco agora:');
    for (const r of all.rows) console.log(' -', r.nome);
  } catch (e) {
    console.log('ERRO:', e.message?.slice(0, 300));
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch(console.error);