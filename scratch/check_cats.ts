import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const cats = await prisma.category.findMany({
    include: { _count: { select: { products: true } } }
  });
  cats.forEach(c => console.log(`${c.name}: ${c._count.products}`));
}
main().finally(() => prisma.$disconnect());
