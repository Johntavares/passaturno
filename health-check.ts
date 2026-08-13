import { prisma } from './src/lib/prisma';

async function healthCheck() {
  console.log("=== SUPABASE DATABASE HEALTH CHECK ===");
  const start = Date.now();
  try {
    const [userCount, equipCount, shiftCount, incCount] = await Promise.all([
      prisma.user.count(),
      prisma.equipment.count(),
      prisma.shift.count(),
      prisma.incident.count(),
    ]);

    const elapsed = Date.now() - start;
    console.log(`✅ DATABASE HEALTH CHECK PASSED IN ${elapsed}ms!`);
    console.log(`- Users in DB: ${userCount}`);
    console.log(`- Fleet Equipments in DB: ${equipCount}`);
    console.log(`- Shifts in DB: ${shiftCount}`);
    console.log(`- Incidents in DB: ${incCount}`);
  } catch (err) {
    console.error("❌ HEALTH CHECK FAILED:", err);
  } finally {
    await prisma.$disconnect();
  }
}

healthCheck();
