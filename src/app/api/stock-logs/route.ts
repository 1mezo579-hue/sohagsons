import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── GET stock logs (paginated) ───────────────────────────────────────────────
export async function GET() {
  try {
    const logs = await prisma.stockLog.findMany({
      select: {
        id: true,
        type: true,
        quantity: true,
        reason: true,
        notes: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            name: true,
            unit: true,
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json(logs);
  } catch (e: any) {
    console.error("GET stock-logs error:", e.message);
    return NextResponse.json({ error: "فشل في جلب حركات المخزن" }, { status: 500 });
  }
}

// ─── POST: Create stock adjustment ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, type, quantity, reason, notes } = body;

    if (!productId || !type || !quantity) {
      return NextResponse.json({ error: "المنتج والنوع والكمية مطلوبة" }, { status: 400 });
    }
    if (!["in", "out"].includes(type)) {
      return NextResponse.json({ error: "نوع الحركة يجب أن يكون 'in' أو 'out'" }, { status: 400 });
    }

    const qty = Number(quantity);
    if (qty <= 0) {
      return NextResponse.json({ error: "الكمية يجب أن تكون أكبر من صفر" }, { status: 400 });
    }

    const increment = type === "in" ? qty : -qty;

    // Use transaction for atomicity
    const [log] = await prisma.$transaction([
      prisma.stockLog.create({
        data: {
          productId: Number(productId),
          type,
          quantity: qty,
          reason: reason || "manual",
          notes: notes?.trim() || null,
        },
        include: { product: { select: { name: true, unit: true } } },
      }),
      prisma.product.update({
        where: { id: Number(productId) },
        data: { stock: { increment } },
      }),
    ]);

    return NextResponse.json(log, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2025") {
      return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
    }
    console.error("POST stock-log error:", e.message);
    return NextResponse.json({ error: "فشل في تسجيل الحركة" }, { status: 500 });
  }
}