import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const ps = await prisma.product.findMany({
    where: { name: { contains: 'وزن' } }
  });
  console.log('Count:', ps.length);
  ps.slice(0, 10).forEach(p => console.log(` - ${p.name}`));
}
main().finally(() => prisma.$disconnect());
