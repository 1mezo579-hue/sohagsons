const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function hyperUpdate() {
  console.log('--- بدء تحديث أسعار السوق الحر (مايو 2026) ---');
  
  try {
    // 1. High-End Premium Market Prices
    const premiumPrices = [
      { key: 'أرز الضحى', p: 85.00 },
      { key: 'ارز الضحى', p: 85.00 },
      { key: 'سكر الضحى', p: 65.00 },
      { key: 'اندومي جامبو', p: 20.00 },
      { key: 'اندومي عادي', p: 15.00 },
      { key: 'نسكافيه بلاك', p: 120.00 },
      { key: 'علبة سمن', p: 180.00 },
      { key: 'زيت ذرة 1لتر', p: 145.00 },
      { key: 'جهينة 1لتر', p: 58.00 },
    ];

    for (const item of premiumPrices) {
      await prisma.product.updateMany({
        where: { name: { contains: item.key } },
        data: { price: item.p, costPrice: item.p * 0.85, synced: false }
      });
    }

    // 2. Aggressive Global Inflation (80% increase from the very old Excel prices)
    // Since we already applied 1.4x earlier, we'll apply another 1.3x to reach ~1.8x total
    console.log('جاري تطبيق زيادة السوق الحر (زيادة إضافية 30% لتصل لـ 1.8x من الأصل)...');
    await prisma.$executeRaw`UPDATE "Product" SET "price" = "price" * 1.3, "costPrice" = "price" * 1.3 * 0.85, "synced" = false`;

    console.log('✓ تم الانتهاء! الآن الأسعار تعكس واقع السوق الحر في مايو 2026.');

  } catch (err) {
    console.error('!! خطأ:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

hyperUpdate();
