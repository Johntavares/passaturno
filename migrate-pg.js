const { Client } = require('pg');

const neonUrl = "postgresql://neondb_owner:npg_xdguT47wMaCP@ep-polished-salad-acrshxbu.sa-east-1.aws.neon.tech/neondb?sslmode=require";
const supaUrl = "postgresql://postgres:gCHK.!cqi2gt%40E4@db.acwfzbmhkamxhdlfhaij.supabase.co:5432/postgres";

async function run() {
  const neon = new Client({ connectionString: neonUrl, ssl: { rejectUnauthorized: false } });
  const supa = new Client({ connectionString: supaUrl, ssl: { rejectUnauthorized: false } });

  console.log("Connecting to Neon & Supabase via PG driver...");
  await neon.connect();
  await supa.connect();
  console.log("Connected to both databases!");

  const tables = ['User', 'Equipment', 'Shift', 'Incident', 'IncidentHistory', 'ShiftHandover', 'LeaderMessage', 'OperatorReply'];

  for (const table of tables) {
    try {
      console.log(`\n=== Migrating Table: "${table}" ===`);
      const res = await neon.query(`SELECT * FROM "${table}"`);
      const rows = res.rows;
      console.log(`Found ${rows.length} rows in Neon table "${table}".`);

      let count = 0;
      for (const row of rows) {
        const columns = Object.keys(row).map(c => `"${c}"`).join(', ');
        const placeholders = Object.keys(row).map((_, i) => `$${i + 1}`).join(', ');
        const values = Object.values(row);

        const sql = `INSERT INTO "${table}" (${columns}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`;
        try {
          await supa.query(sql, values);
          count++;
        } catch (err) {
          console.error(`Row insert error on ${table}:`, err.message);
        }
      }
      console.log(`Successfully migrated ${count}/${rows.length} rows to Supabase for "${table}".`);
    } catch (err) {
      console.error(`Error processing table "${table}":`, err.message);
    }
  }

  await neon.end();
  await supa.end();
  console.log("\n🎉 MIGRATION FROM NEON TO SUPABASE FINISHED SUCCESSFULLY!");
}

run();
