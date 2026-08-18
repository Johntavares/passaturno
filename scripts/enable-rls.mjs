// Habilita Row Level Security (RLS) em todas as tabelas do projeto.
// anon (navegador) fica com LEITURA apenas nas tabelas usadas pelo Realtime.
// Gravações ficam restritas ao servidor (service role), que ignora RLS.
// Uso: npx tsx scripts/enable-rls.mjs
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

const ALL_TABLES = ['User', 'Equipment', 'Shift', 'Incident', 'IncidentHistory', 'ShiftHandover', 'LeaderMessage', 'OperatorReply', 'FailureCategory', 'BoletimConfig', 'BoletimCarteira'];

const REALTIME_TABLES = ['Shift', 'Incident', 'IncidentHistory', 'FailureCategory', 'BoletimConfig', 'BoletimCarteira'];

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();

    for (const t of ALL_TABLES) {
      const exists = await client.query(
        `SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = $1`,
        [t]
      );
      if (exists.rows.length === 0) {
        console.log('! Tabela não existe, pulando:', t);
        continue;
      }
      await client.query(`ALTER TABLE "public"."${t}" ENABLE ROW LEVEL SECURITY`);
      console.log('+ RLS ativado em:', t);
    }

    for (const t of REALTIME_TABLES) {
      const exists = await client.query(
        `SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = $1 AND policyname = 'anon_select'`,
        [t]
      );
      if (exists.rows.length > 0) {
        await client.query(`DROP POLICY IF EXISTS "anon_select" ON "public"."${t}"`);
      }
      await client.query(
        `CREATE POLICY "anon_select" ON "public"."${t}" FOR SELECT TO anon USING (true)`
      );
      console.log('+ Policy anon_select (leitura) em:', t);
    }

    const after = await client.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity ORDER BY tablename`
    );
    console.log('\nTabelas com RLS ativo agora:');
    for (const r of after.rows) console.log(' -', r.tablename);
  } catch (e) {
    console.log('ERRO:', e.message?.slice(0, 300));
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch(console.error);