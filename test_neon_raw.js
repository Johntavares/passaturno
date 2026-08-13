const { Client } = require('pg');

const urls = [
  "postgresql://neondb_owner:npg_xdguT47wMaCP@ep-polished-salad-acrshxbu.sa-east-1.aws.neon.tech/neondb?sslmode=require",
  "postgresql://neondb_owner:npg_xdguT47wMaCP@ep-polished-salad-acrshxbu-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require",
];

async function check() {
  for (const url of urls) {
    console.log("\nTesting URL:", url);
    const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      console.log("Connected!");
      const users = await client.query('SELECT * FROM "User"');
      console.log("USERS Count:", users.rows.length, users.rows);
      const incs = await client.query('SELECT * FROM "Incident"');
      console.log("INCIDENTS Count:", incs.rows.length, incs.rows);
      const shifts = await client.query('SELECT * FROM "Shift"');
      console.log("SHIFTS Count:", shifts.rows.length, shifts.rows);
      const eq = await client.query('SELECT * FROM "Equipment"');
      console.log("EQUIPMENT Count:", eq.rows.length);
    } catch (err) {
      console.error("Neon DB Error:", err.message);
    } finally {
      await client.end();
    }
  }
}

check();
