import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DELETED_PRODUCT = { name: "منتج محذوف", costPrice: 0, category: null as { name: string } | null };

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
        customer: { select: { name: true, phone: true, address: true, points: true, balance: true } },
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            total: true,
            productId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const productIds = Array.from(new Set(invoices.flatMap((inv) => inv.items.map((it) => it.productId))));
    const products = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            name: true,
            costPrice: true,
            category: { select: { name: true } },
          },
        })
      : [];
    const productMap = new Map(products.map((p) => [p.id, p]));

    const enriched = invoices.map((inv) => ({
      ...inv,
      items: inv.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        product: productMap.get(item.productId) ?? DELETED_PRODUCT,
      })),
    }));

    return NextResponse.json(enriched);
  } catch (e: any) {
    console.error("GET invoices error:", e.message, e.code);
    return NextResponse.json({ error: "فشل تحميل الفواتير" }, { status: 500 });
  }
}
