import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { 
        items: { include: { product: { include: { category: true } } } }, 
        user: true 
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(invoices);
  } catch (error) {
    console.error("GET /api/invoices error:", error);
    return NextResponse.json({ error: "فشل في جلب الفواتير" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, ...invoiceData } = body;

    const result = await prisma.$transaction(async (tx) => {
      // Create invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNo: invoiceData.invoiceNo,
          userId: invoiceData.userId || 1,
          total: parseFloat(invoiceData.total),
          discount: parseFloat(invoiceData.discount) || 0,
          finalTotal: parseFloat(invoiceData.finalTotal),
          paymentType: invoiceData.paymentType || "cash",
          items: {
            create: items.map((item: any) => ({
              productId: parseInt(item.productId),
              quantity: parseFloat(item.quantity),
              price: parseFloat(item.price),
              total: parseFloat(item.total),
            })),
          },
        },
        include: { 
          items: { include: { product: true } },
          user: true
        },
      });

      // Update stock & create stock logs
      for (const item of items) {
        await tx.product.update({
          where: { id: parseInt(item.productId) },
          data: { stock: { decrement: parseFloat(item.quantity) } },
        });

        await tx.stockLog.create({
          data: {
            productId: parseInt(item.productId),
            type: "out",
            quantity: parseFloat(item.quantity),
            reason: "sale",
          },
        });
      }

      return invoice;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/invoices error:", error);
    return NextResponse.json({ error: "فشل في إنشاء الفاتورة" }, { status: 500 });
  }
}