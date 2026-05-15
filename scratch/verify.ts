import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.product.findFirst({
    where: { name: { contains: 'جبن ابيض طري' } }
  });
  console.log('Product Found:', p);
}
main().finally(() => prisma.$disconnect());
