const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany();
  console.log("Users:", users.map(u => u.id + " - " + u.username));
}
check().finally(() => prisma.$disconnect());
