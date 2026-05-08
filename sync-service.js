const { PrismaClient } = require('@prisma/client');
const prismaLocal = new PrismaClient();
const { createClient } = require('@supabase/supabase-js');

// Supabase Credentials from your .env.vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncInvoices() {
  console.log('Checking for new invoices to sync...');
  
  try {
    // Get invoices from local SQLite that haven't been synced yet
    // (We'll assume any invoice created in the last 10 mins is new for this demo)
    const localInvoices = await prismaLocal.invoice.findMany({
      include: { items: { include: { product: true } } },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    for (const inv of localInvoices) {
      const { data, error } = await supabase
        .from('Invoice')
        .upsert({
          id: inv.id,
          invoiceNo: inv.invoiceNo,
          total: inv.total,
          finalTotal: inv.finalTotal,
          createdAt: inv.createdAt,
          // ... add other fields
        });
      
      if (error) console.error('Sync Error:', error.message);
      else console.log(`Synced Invoice ${inv.invoiceNo}`);
    }
  } catch (err) {
    console.error('Connection Error (Offline):', err.message);
  }
}

// Run every 2 minutes
setInterval(syncInvoices, 120000);
syncInvoices();
