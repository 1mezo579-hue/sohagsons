const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  // Find Ariel products
  const found = await p.product.findMany({ where: { name: { contains: "أريال" } } });
  console.log("Found:", JSON.stringify(found, null, 2));

  // Delete them
  const deleted = await p.product.deleteMany({ where: { name: { contains: "أريال" } } });
  console.log("Deleted count:", deleted.count);
}

main().finally(() => p.$disconnect());
