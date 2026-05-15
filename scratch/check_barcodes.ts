import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const ps = await prisma.product.findMany({
    where: { barcode: { startsWith: '8221' } }
  });
  console.log('Count:', ps.length);
  ps.forEach(p => console.log(` - ${p.name}: ${p.barcode}`));
}
main().finally(() => prisma.$disconnect());
