const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const { count } = await prisma.user.updateMany({
      where: { name: null },
      data: { name: "Unknown" },
    });
    console.log(`Updated ${count} users (set name = 'Unknown')`);
  } catch (e) {
    console.error("Error backfilling users:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
