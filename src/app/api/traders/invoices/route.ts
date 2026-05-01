import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const invoices = await prisma.traderInvoice.findMany({
      include: {
        trader: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(invoices);
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    const { traderId, total, paid, notes, items } = await req.json();
    
    if (!traderId || !items || !items.length) {
      return NextResponse.json({ error: "بيانات الفاتورة غير مكتملة" }, { status: 400 });
    }

    const remaining = total - paid;
    let status = "pending";
    if (remaining <= 0) status = "paid";
    else if (paid > 0) status = "partial";

    // Start a transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the invoice
      const invoice = await tx.traderInvoice.create({
        data: {
          invoiceNo: generateInvoiceNo("TRD-"),
          traderId,
          total,
          paid,
          remaining,
          status,
          notes,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              description: item.description || "",
              quantity: item.quantity,
              price: item.price,
              total: item.total,
            })),
          },
        },
        include: { items: true },
      });

      // 2. Update trader balance
      await tx.trader.update({
        where: { id: traderId },
        data: { balance: { increment: remaining } },
      });

      // 3. Update products stock and create stock logs
      for (const item of items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { 
              stock: { increment: item.quantity },
              // Optionally update cost price if needed (commented out for safety, can be added later based on business rules)
              // costPrice: item.price 
            },
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              type: "in",
              quantity: item.quantity,
              reason: "purchase",
              notes: `فاتورة تاجر #${invoice.invoiceNo}`,
            },
          });
        }
      }

      return invoice;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e: any) { 
    console.error("Trader invoice error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 }); 
  }
}
