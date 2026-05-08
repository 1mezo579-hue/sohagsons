const { PrismaClient } = require('@prisma/client');
const prismaLocal = new PrismaClient();
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncAll() {
  console.log('--- بدء دورة المزامنة الذكية ---');
  
  try {
    // 1. Sync Invoices (Unsynced only)
    const unsyncedInvoices = await prismaLocal.invoice.findMany({
      where: { synced: false },
      include: { items: true }
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
        // Mark as synced
        await prismaLocal.invoice.update({ where: { id: inv.id }, data: { synced: true } });
        console.log(`✓ تم بنجاح.`);
      } else {
        console.error('!! خطأ:', error.message);
      }
    }

    // 2. Sync Products (Unsynced only - i.e. new or updated)
    const unsyncedProducts = await prismaLocal.product.findMany({
      where: { synced: false }
    });

    for (const p of unsyncedProducts) {
      console.log(`مزامنة صنف: ${p.name}`);
      const { error } = await supabase.from('Product').upsert({
        id: p.id, name: p.name, barcode: p.barcode, categoryId: p.categoryId,
        priceType: p.priceType, price: p.price, costPrice: p.costPrice,
        stock: p.stock, minStock: p.minStock, unit: p.unit, createdAt: p.createdAt
      });

      if (!error) {
        await prismaLocal.product.update({ where: { id: p.id }, data: { synced: true } });
      }
    }

  } catch (err) {
    console.log('!! النظام يعمل أوفلاين حالياً - سيتم استئناف المزامنة فور توفر الإنترنت.');
  }
}

setInterval(syncAll, 30000); // كل 30 ثانية
syncAll();
