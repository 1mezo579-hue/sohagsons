import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── POST: Create Returns Invoice & Adjust Stock ───────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, customerId, total, paymentType, items } = body;

    // Validation
    if (!userId || !items?.length) {
      return NextResponse.json({ error: "بيانات المرتجع غير مكتملة" }, { status: 400 });
    }

    // Generate unique return invoice number
    const rand = Math.floor(100000 + Math.random() * 900000);
    const invoiceNo = `RET-${Date.now().toString().slice(-6)}-${rand}`;

    const parsedTotal = Number(total);
    const negativeTotal = -Math.abs(parsedTotal);

    // ── Step 1: Create Return Invoice (Negative Total) ──
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        userId: Number(userId),
        customerId: customerId ? Number(customerId) : null,
        total: negativeTotal,
        discount: 0,
        finalTotal: negativeTotal,
        paymentType: paymentType || "cash",
        orderType: "return",
        deliveryFee: 0,
        items: {
          create: items.map((item: any) => ({
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            price: Number(item.price),
            total: -Math.abs(Number(item.total)),
          })),
        },
      },
      select: {
        id: true,
        invoiceNo: true,
        total: true,
        finalTotal: true,
        paymentType: true,
        orderType: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            total: true,
            product: { select: { name: true } },
          },
        },
      },
    });

    // ── Step 2: Update stock and log transaction in background ──
    setImmediate(async () => {
      try {
        // Stock updates (increment) - all concurrent
        const stockUpdates = items.map((item: any) =>
          prisma.product.update({
            where: { id: Number(item.productId) },
            data: { stock: { increment: Number(item.quantity) } },
          })
        );

        // Stock log batch insert (type: "in", reason: "return")
        const logInsert = prisma.stockLog.createMany({
          data: items.map((item: any) => ({
            productId: Number(item.productId),
            type: "in",
            quantity: Number(item.quantity),
            reason: "return",
            notes: `مرتجع فاتورة #${invoiceNo}`,
          })),
        });

        // Customer balance update if applicable (deduct from balance or spent)
        const customerUpdate =
          customerId
            ? prisma.customer.update({
                where: { id: Number(customerId) },
                data: {
                  totalSpent: { decrement: parsedTotal },
                  points: { decrement: Math.floor(parsedTotal / 10) },
                },
              })
            : null;

        await Promise.all([...stockUpdates, logInsert, ...(customerUpdate ? [customerUpdate] : [])]);
      } catch (bgErr: any) {
        console.error("Background return updates error:", bgErr.message);
      }
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (e: any) {
    console.error("Return creation error:", e.message);
    return NextResponse.json(
      { error: `فشل تسجيل المرتجع: ${e.message}` },
      { status: 500 }
    );
  }
}
