import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        user: { select: { name: true } },
        customer: { select: { name: true, phone: true } },
        items: {
          include: {
            product: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(invoices);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { invoiceNo, userId, customerId, total, discount, finalTotal, paymentType, items } = body;

    const invoice = await prisma.$transaction(async (tx) => {
      // 1. Create Invoice
      const newInvoice = await tx.invoice.create({
        data: {
          invoiceNo,
          userId,
          customerId: customerId || null,
          total,
          discount,
          finalTotal,
          paymentType,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
            }))
          }
        },
        include: { items: true, customer: true }
      });

      // 2. Decrease Stock and Add Logs
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });

        await tx.stockLog.create({
          data: {
            productId: item.productId,
            type: "out",
            quantity: item.quantity,
            reason: "sale",
            notes: `فاتورة #${invoiceNo}`,
          }
        });
      }

      // 3. Update Customer Points and Total Spent (if a customer is selected)
      if (customerId) {
        // Assume 1 point for every 10 EGP spent
        const pointsEarned = Math.floor(finalTotal / 10);
        await tx.customer.update({
          where: { id: customerId },
          data: {
            points: { increment: pointsEarned },
            totalSpent: { increment: finalTotal }
          }
        });
      }

      return newInvoice;
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (e: any) {
    console.error("Invoice error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}