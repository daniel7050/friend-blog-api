const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany();
    fs.writeFileSync("users_backup.json", JSON.stringify(users, null, 2));
    console.log(`Backed up ${users.length} users to users_backup.json`);
  } catch (e) {
    console.error("Error backing up users:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
