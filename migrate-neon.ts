import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const neonUrl = "postgresql://neondb_owner:npg_xdguT47wMaCP@ep-polished-salad-acrshxbu-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require";
const supaUrl = "postgresql://postgres:gCHK.!cqi2gt%40E4@db.acwfzbmhkamxhdlfhaij.supabase.co:5432/postgres";

const neonDb = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: neonUrl }),
});

const supaDb = new PrismaClient({
  datasources: {
    db: {
      url: supaUrl,
    },
  },
});

async function runMigration() {
  console.log("=== MIGRATING DATA FROM NEON DB TO SUPABASE DB ===");

  try {
    // 1. Users
    console.log("1. Migrating Users...");
    const users = await neonDb.user.findMany();
    console.log(`Found ${users.length} users in Neon.`);
    for (const u of users) {
      await supaDb.user.upsert({
        where: { id: u.id },
        update: u,
        create: u,
      });
    }

    // 2. Equipments
    console.log("2. Migrating Equipments...");
    const equipments = await neonDb.equipment.findMany();
    console.log(`Found ${equipments.length} equipments in Neon.`);
    for (const eq of equipments) {
      await supaDb.equipment.upsert({
        where: { id: eq.id },
        update: eq,
        create: eq,
      });
    }

    // 3. Shifts
    console.log("3. Migrating Shifts...");
    const shifts = await neonDb.shift.findMany();
    console.log(`Found ${shifts.length} shifts in Neon.`);
    for (const s of shifts) {
      await supaDb.shift.upsert({
        where: { id: s.id },
        update: s,
        create: s,
      });
    }

    // 4. Incidents
    console.log("4. Migrating Incidents...");
    const incidents = await neonDb.incident.findMany();
    console.log(`Found ${incidents.length} incidents in Neon.`);
    for (const inc of incidents) {
      await supaDb.incident.upsert({
        where: { id: inc.id },
        update: inc,
        create: inc,
      });
    }

    // 5. Incident History
    console.log("5. Migrating IncidentHistory...");
    const history = await neonDb.incidentHistory.findMany();
    console.log(`Found ${history.length} history records in Neon.`);
    for (const h of history) {
      await supaDb.incidentHistory.upsert({
        where: { id: h.id },
        update: h,
        create: h,
      });
    }

    // 6. Shift Handovers
    console.log("6. Migrating ShiftHandovers...");
    const handovers = await neonDb.shiftHandover.findMany();
    console.log(`Found ${handovers.length} handovers in Neon.`);
    for (const ho of handovers) {
      await supaDb.shiftHandover.upsert({
        where: { id: ho.id },
        update: ho,
        create: ho,
      });
    }

    // 7. Leader Messages
    console.log("7. Migrating LeaderMessages...");
    const leaderMsgs = await neonDb.leaderMessage.findMany();
    console.log(`Found ${leaderMsgs.length} leader messages in Neon.`);
    for (const lm of leaderMsgs) {
      await supaDb.leaderMessage.upsert({
        where: { id: lm.id },
        update: lm,
        create: lm,
      });
    }

    // 8. Operator Replies
    console.log("8. Migrating OperatorReplies...");
    const replies = await neonDb.operatorReply.findMany();
    console.log(`Found ${replies.length} operator replies in Neon.`);
    for (const rep of replies) {
      await supaDb.operatorReply.upsert({
        where: { id: rep.id },
        update: rep,
        create: rep,
      });
    }

    console.log("\n🎉 ALL DATA SUCCESSFULLY MIGRATED FROM NEON TO SUPABASE!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await neonDb.$disconnect();
    await supaDb.$disconnect();
  }
}

runMigration();
