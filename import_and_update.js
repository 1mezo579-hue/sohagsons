const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const XLSX = require('xlsx');

async function run() {
  console.log('--- بدء عملية الرفع الجماعي السريع للسحابة (8759 صنف) ---');
  
  try {
    const workbook = XLSX.readFile('Products_Export_30-04-2026==.xlsx');
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(sheet);
    
    console.log(`تجهيز ${rawData.length} منتج للرفع...`);

    let defaultCat = await prisma.category.findFirst({ where: { name: 'عام' } });
    if (!defaultCat) {
      defaultCat = await prisma.category.create({ data: { name: 'عام' } });
    }

    const priceMap = { 'دقيق': 32.00, 'سكر': 27.50, 'ارز': 35.00, 'أرز': 35.00 };

    // 1. Clear cloud products (Optional but safer for "One" sync)
    // await prisma.product.deleteMany(); 

    // 2. Prepare data in batches of 1000
    const productsToCreate = [];
    for (const row of rawData) {
      let name = String(row['الاسم'] || '');
      if (!name) continue;

      let price = parseFloat(row['سعر البيع']) || 0;
      let costPrice = parseFloat(row['سعر الشراء']) || 0;

      for (const [key, val] of Object.entries(priceMap)) {
        if (name.includes(key) && price < val) {
          price = val;
          costPrice = val * 0.85;
        }
      }

      productsToCreate.push({
        name: name,
        barcode: row['الباركود'] ? String(row['الباركود']) : null,
        categoryId: defaultCat.id,
        price: price,
        costPrice: costPrice,
        stock: parseFloat(row['الرصيد']) || 0,
        priceType: 'unit',
        unit: 'piece',
        synced: true
      });
    }

    // Use createMany (Supported by Postgres)
    console.log('جاري الرفع الجماعي للسحابة...');
    const result = await prisma.product.createMany({
      data: productsToCreate,
      skipDuplicates: true
    });

    console.log(`✓ تمت العملية بنجاح! تم رفع ${result.count} صنف إلى السحابة.`);
  } catch (err) {
    console.error('!! خطأ:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
