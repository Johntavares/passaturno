const { Client } = require('pg');

const connectionString = "postgresql://neondb_owner:npg_xdguT47wMaCP@ep-polished-salad-acrshxbu-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require";

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  console.log("Connecting to Postgres...");
  try {
    await client.connect();
    console.log("Connected successfully!");
    const res = await client.query('SELECT NOW()');
    console.log("Query result:", res.rows[0]);
  } catch (err) {
    console.error("Connection error:", err);
  } finally {
    await client.end();
  }
}

testConnection();
