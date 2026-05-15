import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.product.count();
  const maxBarcode = await prisma.product.findFirst({
    orderBy: { barcode: 'desc' },
    where: { barcode: { not: null } }
  });
  console.log('Total Products:', count);
  console.log('Max Barcode:', maxBarcode?.barcode);
}
main().finally(() => prisma.$disconnect());
