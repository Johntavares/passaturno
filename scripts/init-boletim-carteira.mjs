// Cria a tabela BoletimCarteira no Supabase (valores diários da carteira de incidentes, por turma)
// e adiciona à publicação realtime.
// Uso: npx tsx scripts/init-boletim-carteira.mjs
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

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();

    await client.query(`
      CREATE TABLE IF NOT EXISTS "BoletimCarteira" (
        turma TEXT NOT NULL,
        data TEXT NOT NULL,
        total TEXT,
        andamento TEXT,
        aberto TEXT,
        pendente TEXT,
        "atualizadoEm" TIMESTAMPTZ,
        PRIMARY KEY (turma, data)
      )
    `);
    console.log('+ Tabela BoletimCarteira garantida');

    try {
      await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE "BoletimCarteira"`);
      console.log('+ BoletimCarteira adicionada à publicação supabase_realtime');
    } catch (e) {
      console.log('= BoletimCarteira já estava na publicação (ou erro:', e.message?.slice(0, 120), ')');
    }

    const all = await client.query(`SELECT turma, data, total, andamento, aberto, pendente FROM "BoletimCarteira" ORDER BY turma, data`);
    console.log(`Registros existentes: ${all.rows.length}`);
    for (const r of all.rows) console.log(' -', r.turma, r.data, '| total:', r.total, '| andamento:', r.andamento, '| aberto:', r.aberto, '| pendente:', r.pendente);
  } catch (e) {
    console.log('ERRO:', e.message?.slice(0, 300));
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch(console.error);