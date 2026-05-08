const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function lightningUpdate() {
  console.log('--- بدء التحديث الصاعق للأسعار (مايو 2026) ---');
  
  try {
    // 1. First, set common brand prices
    console.log('جاري تحديث الماركات الرئيسية...');
    const brands = [
      { key: 'جهينة', p: 52 },
      { key: 'حليب جهينة', p: 52 },
      { key: 'عبور لاند 250', p: 22 },
      { key: 'عبور لاند 500', p: 45 },
      { key: 'اندومي', p: 10 }
    ];

    for (const b of brands) {
      await prisma.product.updateMany({
        where: { name: { contains: b.key } },
        data: { price: b.p, costPrice: b.p * 0.85, synced: false }
      });
    }

    // 2. Global 40% Inflation for everything else using RAW SQL for speed
    console.log('جاري تطبيق زيادة تضخم 40% على باقي الأصناف...');
    // We use a raw query to multiply prices in one go
    await prisma.$executeRaw`UPDATE "Product" SET "price" = "price" * 1.4, "costPrice" = "price" * 1.4 * 0.85, "synced" = false`;

    console.log('✓ مبروك! تم تحديث كافة الأسعار في النظام (8000+ صنف) بنجاح.');

  } catch (err) {
    console.error('!! خطأ:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

lightningUpdate();
