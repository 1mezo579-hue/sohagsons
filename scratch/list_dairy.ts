import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const cat = await prisma.category.findUnique({
    where: { name: 'ألبان وأجبان' },
    include: { products: true }
  });
  console.log('Category:', cat?.name);
  console.log('Products Count:', cat?.products.length);
  cat?.products.forEach(p => console.log(` - ${p.name}: ${p.price}`));
}
main().finally(() => prisma.$disconnect());
