import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNo } from "@/lib/utils";

export const dynamic = "force-dynamic";

// ─── GET all trader invoices ─────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const traderId = searchParams.get("traderId");

    const invoices = await prisma.traderInvoice.findMany({
      where: traderId ? { traderId: Number(traderId) } : undefined,
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
      take: traderId ? 50 : 100,
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

    if (!traderId || total === undefined || total === null) {
      return NextResponse.json({ error: "بيانات الفاتورة غير مكتملة" }, { status: 400 });
    }

    const totalNum = Number(total);
    const paidNum = Number(paid) || 0;

    if (totalNum <= 0) {
      return NextResponse.json({ error: "إجمالي الفاتورة يجب أن يكون أكبر من صفر" }, { status: 400 });
    }
    if (paidNum > totalNum) {
      return NextResponse.json({ error: "المبلغ المدفوع لا يمكن أن يتجاوز إجمالي الفاتورة" }, { status: 400 });
    }

    const remaining = Math.max(0, totalNum - paidNum);
    const status = remaining <= 0 ? "paid" : paidNum > 0 ? "partial" : "pending";
    const invoiceItems = Array.isArray(items) ? items : [];
    const invoiceNo = generateInvoiceNo("TRD-");

    const invoice = await prisma.$transaction(async (tx) => {
      const created = await tx.traderInvoice.create({
        data: {
          invoiceNo,
          traderId: Number(traderId),
          total: totalNum,
          paid: paidNum,
          remaining,
          status,
          notes: notes || null,
          items: {
            create: invoiceItems.map((item: any) => ({
              productId: item.productId ? Number(item.productId) : null,
              description: item.description || item.name || "بند",
              quantity: Number(item.quantity) || 0,
              price: Number(item.price) || 0,
              total: Number(item.total) || 0,
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

      await tx.trader.update({
        where: { id: Number(traderId) },
        data: { balance: { increment: remaining } },
      });

      const productItems = invoiceItems.filter((i: any) => i.productId);
      for (const item of productItems) {
        await tx.product.update({
          where: { id: Number(item.productId) },
          data: { stock: { increment: Number(item.quantity) } },
        });
      }

      if (productItems.length > 0) {
        await tx.stockLog.createMany({
          data: productItems.map((item: any) => ({
            productId: Number(item.productId),
            type: "in",
            quantity: Number(item.quantity),
            reason: "purchase",
            notes: `فاتورة تاجر #${invoiceNo}`,
          })),
        });
      }

      return created;
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (e: any) {
    console.error("Trader invoice creation error:", e.message);
    return NextResponse.json({ error: `فشل إنشاء الفاتورة: ${e.message}` }, { status: 500 });
  }
}
