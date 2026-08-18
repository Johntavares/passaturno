// Habilita o Realtime do Supabase para as tabelas do projeto.
// Uso: npx tsx scripts/enable-realtime.mjs
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

const TABLES = ['User', 'Equipment', 'Shift', 'Incident', 'IncidentHistory', 'ShiftHandover', 'LeaderMessage', 'OperatorReply'];

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const pubs = await client.query(`SELECT pubname FROM pg_publication`);
    console.log('Publicações:', pubs.rows.map((r) => r.pubname).join(', '));

    if (!pubs.rows.some((r) => r.pubname === 'supabase_realtime')) {
      console.log('Criando publicação supabase_realtime...');
      await client.query(`CREATE PUBLICATION supabase_realtime`);
    }

    for (const t of TABLES) {
      const exists = await client.query(
        `SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = $1`,
        [t]
      );
      if (exists.rows.length === 0) {
        try {
          await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE "${t}"`);
          console.log('+ Adicionada:', t);
        } catch (e) {
          console.log('! Não foi possível adicionar', t, '->', e.message?.slice(0, 150));
        }
      } else {
        console.log('= Já estava:', t);
      }
    }

    const after = await client.query(
      `SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' ORDER BY tablename`
    );
    console.log('\nTabelas na publicação agora:');
    for (const r of after.rows) console.log(' -', r.tablename);
  } catch (e) {
    console.log('ERRO:', e.message?.slice(0, 300));
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch(console.error);