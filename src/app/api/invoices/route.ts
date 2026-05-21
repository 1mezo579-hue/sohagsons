import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── GET: All Invoices ─────────────────────────────────────────────────────
export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      select: {
        id: true,
        invoiceNo: true,
        total: true,
        discount: true,
        finalTotal: true,
        paymentType: true,
        orderType: true,
        deliveryFee: true,
        createdAt: true,
        user: { select: { name: true } },
        customer: { select: { name: true, phone: true, address: true } },
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            total: true,
            product: {
              select: {
                name: true,
                costPrice: true,
                category: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200, // Limit to last 200 invoices for speed
    });
    return NextResponse.json(invoices);
  } catch (e: any) {
    console.error("GET invoices error:", e.message);
    return NextResponse.json({ error: "فشل تحميل الفواتير" }, { status: 500 });
  }
}

// ─── POST: Create Invoice (Optimized for Speed) ────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { invoiceNo, userId, customerId, total, discount, finalTotal, paymentType, orderType, deliveryFee, items } = body;

    // Validation
    if (!invoiceNo || !userId || !items?.length) {
      return NextResponse.json({ error: "بيانات الفاتورة غير مكتملة" }, { status: 400 });
    }

    // ── Step 1: Create Invoice + Items in ONE query (fastest possible) ──
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        userId: Number(userId),
        customerId: customerId ? Number(customerId) : null,
        total: Number(total),
        discount: Number(discount) || 0,
        finalTotal: Number(finalTotal),
        paymentType: paymentType || "cash",
        orderType: orderType || "shop",
        deliveryFee: Number(deliveryFee) || 0,
        items: {
          create: items.map((item: any) => ({
            productId: Number(item.productId),
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
        discount: true,
        finalTotal: true,
        paymentType: true,
        orderType: true,
        deliveryFee: true,
        createdAt: true,
        customer: { select: { name: true, phone: true, points: true, address: true } },
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            total: true,
            product: {
              select: {
                name: true,
                costPrice: true,
                category: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    // ── Step 2: Fire & Forget background updates (non-blocking) ──
    // These run AFTER we already returned the receipt to the user
    setImmediate(async () => {
      try {
        // Stock updates - all concurrent
        const stockUpdates = items.map((item: any) =>
          prisma.product.update({
            where: { id: Number(item.productId) },
            data: { stock: { decrement: Number(item.quantity) } },
          })
        );

        // Stock log batch insert
        const logInsert = prisma.stockLog.createMany({
          data: items.map((item: any) => ({
            productId: Number(item.productId),
            type: "out",
            quantity: Number(item.quantity),
            reason: "sale",
            notes: `فاتورة #${invoiceNo}`,
          })),
        });

        // Customer update (if applicable)
        const customerUpdate =
          customerId
            ? prisma.customer.update({
                where: { id: Number(customerId) },
                data: {
                  points: { increment: Math.floor(Number(finalTotal) / 10) },
                  totalSpent: { increment: Number(finalTotal) },
                  ...(paymentType === "credit" && {
                    balance: { increment: Number(finalTotal) },
                  }),
                },
              })
            : null;

        // Run everything at once in background
        await Promise.all([...stockUpdates, logInsert, ...(customerUpdate ? [customerUpdate] : [])]);
      } catch (bgErr: any) {
        // Background errors don't affect the user but log them
        console.error("Background invoice update error:", bgErr.message);
      }
    });

    // ── Return receipt immediately without waiting for background tasks ──
    return NextResponse.json(invoice, { status: 201 });
  } catch (e: any) {
    console.error("Invoice creation error:", e.message);
    return NextResponse.json(
      { error: e.code === "P2002" ? "رقم الفاتورة مكرر، حاول مرة أخرى" : `فشل إنشاء الفاتورة: ${e.message}` },
      { status: 500 }
    );
  }
}