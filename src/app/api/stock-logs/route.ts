import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const logs = await prisma.stockLog.findMany({
      include: { product: { include: { category: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error("GET /api/stock-logs error:", error);
    return NextResponse.json({ error: "فشل في جلب حركات المخزن" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await prisma.$transaction(async (tx) => {
      const log = await tx.stockLog.create({
        data: {
          productId: parseInt(body.productId),
          type: body.type,
          quantity: parseFloat(body.quantity),
          reason: body.reason,
          notes: body.notes || null,
        },
        include: { product: true },
      });

      const increment = body.type === "in" ? parseFloat(body.quantity) : -parseFloat(body.quantity);
      await tx.product.update({
        where: { id: parseInt(body.productId) },
        data: { stock: { increment } },
      });

      return log;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/stock-logs error:", error);
    return NextResponse.json({ error: "فشل في تسجيل الحركة" }, { status: 500 });
  }
}