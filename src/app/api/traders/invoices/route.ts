import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNo } from "@/lib/utils";

export const dynamic = "force-dynamic";

// ─── GET all trader invoices ─────────────────────────────────────────────────
export async function GET() {
  try {
    const invoices = await prisma.traderInvoice.findMany({
      select: {
        id: true,
        invoiceNo: true,
        total: true,
        paid: true,
        remaining: true,
        status: true,
        notes: true,
        createdAt: true,
        trader: { select: { id: true, name: true } },
        items: {
          select: {
            id: true,
            description: true,
            quantity: true,
            price: true,
            total: true,
            product: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(invoices);
  } catch (e: any) {
    console.error("GET trader invoices error:", e.message);
    return NextResponse.json({ error: "فشل تحميل فواتير التجار" }, { status: 500 });
  }
}

// ─── POST create trader invoice ───────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { traderId, total, paid, notes, items } = body;

    // Validation
    if (!traderId || !total || !items?.length) {
      return NextResponse.json({ error: "بيانات الفاتورة غير مكتملة" }, { status: 400 });
    }

    const totalNum = Number(total);
    const paidNum = Number(paid) || 0;
    const remaining = Math.max(0, totalNum - paidNum);
    const status = remaining <= 0 ? "paid" : paidNum > 0 ? "partial" : "pending";

    // ── Step 1: Create invoice (fast, non-blocking for user) ──
    const invoice = await prisma.traderInvoice.create({
      data: {
        invoiceNo: generateInvoiceNo("TRD-"),
        traderId: Number(traderId),
        total: totalNum,
        paid: paidNum,
        remaining,
        status,
        notes: notes || null,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId ? Number(item.productId) : null,
            description: item.description || item.name || "",
            quantity: Number(item.quantity),
            price: Number(item.price),
            total: Number(item.total),
          })),
        },
      },
      select: {
        id: true,
        invoiceNo: true,
        total: true,
        paid: true,
        remaining: true,
        status: true,
        createdAt: true,
        trader: { select: { name: true } },
        items: { select: { description: true, quantity: true, price: true, total: true } },
      },
    });

    // ── Step 2: Background updates (stock + trader balance) ──
    setImmediate(async () => {
      try {
        const tasks: Promise<any>[] = [
          // Update trader balance
          prisma.trader.update({
            where: { id: Number(traderId) },
            data: { balance: { increment: remaining } },
          }),
        ];

        // Update stock for products that have a productId
        const productItems = items.filter((i: any) => i.productId);
        if (productItems.length > 0) {
          productItems.forEach((item: any) => {
            tasks.push(
              prisma.product.update({
                where: { id: Number(item.productId) },
                data: { stock: { increment: Number(item.quantity) } },
              })
            );
          });

          // Batch stock log insert
          tasks.push(
            prisma.stockLog.createMany({
              data: productItems.map((item: any) => ({
                productId: Number(item.productId),
                type: "in",
                quantity: Number(item.quantity),
                reason: "purchase",
                notes: `فاتورة تاجر #${invoice.invoiceNo}`,
              })),
            })
          );
        }

        await Promise.all(tasks);
      } catch (bgErr: any) {
        console.error("Trader invoice background error:", bgErr.message);
      }
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (e: any) {
    console.error("Trader invoice creation error:", e.message);
    return NextResponse.json({ error: `فشل إنشاء الفاتورة: ${e.message}` }, { status: 500 });
  }
}
