const { PrismaClient } = require('@prisma/client');
const prismaLocal = new PrismaClient();
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncAll() {
  console.log('--- بدء دورة المزامنة الذكية السريعة ---');
  
  try {
    // 1. Sync Invoices (Unsynced only) - Keep one by one for complex relations
    const unsyncedInvoices = await prismaLocal.invoice.findMany({
      where: { synced: false },
      include: { items: true },
      take: 20
    });

    for (const inv of unsyncedInvoices) {
      console.log(`مزامنة فاتورة: ${inv.invoiceNo}`);
      const { error } = await supabase.from('Invoice').upsert({
        id: inv.id, invoiceNo: inv.invoiceNo, userId: inv.userId, customerId: inv.customerId,
        total: inv.total, discount: inv.discount, finalTotal: inv.finalTotal,
        paymentType: inv.paymentType, orderType: inv.orderType, deliveryFee: inv.deliveryFee,
        createdAt: inv.createdAt
      });

      if (!error) {
        // Sync items
        for (const item of inv.items) {
          await supabase.from('InvoiceItem').upsert({
            id: item.id, invoiceId: item.invoiceId, productId: item.productId,
            quantity: item.quantity, price: item.price, total: item.total
          });
        }
        await prismaLocal.invoice.update({ where: { id: inv.id }, data: { synced: true } });
        console.log(`✓ تم بنجاح.`);
      }
    }

    // 2. Sync Products (Bulk Upsert - 100 at a time)
    const unsyncedProducts = await prismaLocal.product.findMany({
      where: { synced: false },
      take: 100
    });

    if (unsyncedProducts.length > 0) {
      console.log(`مزامنة ${unsyncedProducts.length} صنف بالجملة...`);
      const productsToUpsert = unsyncedProducts.map(p => ({
        id: p.id, name: p.name, barcode: p.barcode, categoryId: p.categoryId,
        priceType: p.priceType, price: p.price, costPrice: p.costPrice,
        stock: p.stock, minStock: p.minStock, unit: p.unit, expiryDate: p.expiryDate,
        createdAt: p.createdAt, updatedAt: p.updatedAt
      }));

      const { error } = await supabase.from('Product').upsert(productsToUpsert);

      if (!error) {
        const ids = unsyncedProducts.map(p => p.id);
        await prismaLocal.product.updateMany({
          where: { id: { in: ids } },
          data: { synced: true }
        });
        console.log(`✓ تم مزامنة الدفعة.`);
      } else {
        console.error('!! خطأ في المزامنة بالجملة:', error.message);
      }
    }

  } catch (err) {
    console.log('!! النظام يعمل أوفلاين حالياً - سيتم استئناف المزامنة فور توفر الإنترنت.');
  }
}

// تشغيل المزامنة كل 5 ثواني لتسريع العملية الأولية
setInterval(syncAll, 5000); 
syncAll();
