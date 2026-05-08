const { PrismaClient } = require('@prisma/client');
const prismaLocal = new PrismaClient();
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncInvoices() {
  console.log('--- جاري محاولة مزامنة المبيعات للسحابة ---');
  
  try {
    const localInvoices = await prismaLocal.invoice.findMany({
      include: { items: true },
      take: 20,
      orderBy: { createdAt: 'desc' }
    });

    for (const inv of localInvoices) {
      const { error } = await supabase
        .from('Invoice')
        .upsert({
          id: inv.id,
          invoiceNo: inv.invoiceNo,
          userId: inv.userId,
          customerId: inv.customerId,
          total: inv.total,
          discount: inv.discount,
          finalTotal: inv.finalTotal,
          paymentType: inv.paymentType,
          orderType: inv.orderType,
          deliveryFee: inv.deliveryFee,
          createdAt: inv.createdAt,
        });
      
      if (error) {
        console.error(`خطأ في مزامنة فاتورة ${inv.invoiceNo}:`, error.message);
      } else {
        console.log(`✓ تمت مزامنة فاتورة رقم: ${inv.invoiceNo}`);
        // Optionally sync items too
        for (const item of inv.items) {
           await supabase.from('InvoiceItem').upsert({
             id: item.id,
             invoiceId: item.invoiceId,
             productId: item.productId,
             quantity: item.quantity,
             price: item.price,
             total: item.total
           });
        }
      }
    }
  } catch (err) {
    console.log('!! النظام يعمل أوفلاين حالياً - سيتم المزامنة فور توفر إنترنت');
  }
}

setInterval(syncInvoices, 60000); // مزامنة كل دقيقة
syncInvoices();
