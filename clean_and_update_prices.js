const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  console.log('--- بدء عملية تطهير وتحديث المخزن (مايو 2026) ---');
  
  try {
    // 1. Keywords to delete (Tobacco & Smoking)
    const tobaccoKeywords = [
      'تبغ', 'سجاير', 'سجائر', 'معسل', 'فلتر', 'مارلبورو', 'marlboro', 'l&m', 'lm', 'ال ام',
      'وينستون', 'winston', 'ميريت', 'merit', 'كامل', 'camel', 'روثمان', 'rothmans',
      'فايسروي', 'viceroy', 'كليوباترا', 'cleopatra', 'بوكس', 'target', 'تارجت', 'pine',
      'كابتن بلاك', 'فايل'
    ];

    console.log('جاري حذف منتجات التبغ والسجائر...');
    let deletedTobacco = 0;
    for (const word of tobaccoKeywords) {
      const res = await prisma.product.deleteMany({
        where: { name: { contains: word } }
      });
      deletedTobacco += res.count;
    }
    console.log(`✓ تم حذف ${deletedTobacco} صنف تبغ وسجائر.`);

    // 2. Delete nonsense or very short names
    console.log('جاري حذف الأسماء غير المفهومة...');
    const allProducts = await prisma.product.findMany({ select: { id: true, name: true } });
    let deletedNonsense = 0;
    for (const p of allProducts) {
      if (p.name.length < 3 || /^[^a-zA-Z0-9\u0600-\u06FF]+$/.test(p.name)) {
        await prisma.product.delete({ where: { id: p.id } });
        deletedNonsense++;
      }
    }
    console.log(`✓ تم حذف ${deletedNonsense} صنف غير مفهوم الاسم.`);

    // 3. Update Prices (May 2026 Prices)
    console.log('جاري تحديث الأسعار لشهر مايو 2026...');
    const updates = [
      { key: 'أرز', price: 35.00, cost: 28.00 },
      { key: 'ارز', price: 35.00, cost: 28.00 },
      { key: 'سكر', price: 32.00, cost: 26.00 },
      { key: 'دقيق', price: 24.00, cost: 19.00 },
      { key: 'زيت ذرة', price: 118.00, cost: 95.00 },
      { key: 'زيت عباد', price: 98.00, cost: 78.00 },
    ];

    let updatedCount = 0;
    for (const up of updates) {
      const res = await prisma.product.updateMany({
        where: { name: { contains: up.key } },
        data: { price: up.price, costPrice: up.cost, synced: false }
      });
      updatedCount += res.count;
    }
    console.log(`✓ تم تحديث أسعار ${updatedCount} صنف بنجاح.`);

  } catch (err) {
    console.error('!! خطأ أثناء التطهير:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

clean();
