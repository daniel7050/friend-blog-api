const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const nullNameUsers = await prisma.user.findMany({
      where: { name: null },
      select: { id: true, email: true, username: true, name: true },
    });
    console.log("Users with NULL name:", nullNameUsers.length);
    console.table(nullNameUsers);
  } catch (e) {
    console.error("Error inspecting users:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
