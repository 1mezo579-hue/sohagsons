import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── GET all expenses ────────────────────────────────────────────────────────
export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      select: {
        id: true,
        amount: true,
        category: true,
        description: true,
        createdAt: true,
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return NextResponse.json(expenses);
  } catch (e: any) {
    console.error("GET expenses error:", e.message);
    return NextResponse.json({ error: "فشل تحميل المصروفات" }, { status: 500 });
  }
}

// ─── POST create expense ─────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { amount, category, description, userId } = await req.json();

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "المبلغ يجب أن يكون أكبر من صفر" }, { status: 400 });
    }
    if (!category?.trim()) {
      return NextResponse.json({ error: "تصنيف المصروف مطلوب" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: "معرّف المستخدم مطلوب" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        amount: Number(amount),
        category: category.trim(),
        description: description?.trim() || null,
        userId: Number(userId),
      },
      select: {
        id: true,
        amount: true,
        category: true,
        description: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (e: any) {
    console.error("POST expense error:", e.message);
    return NextResponse.json({ error: "فشل في تسجيل المصروف" }, { status: 500 });
  }
}

// ─── DELETE expense ───────────────────────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "معرّف المصروف مطلوب" }, { status: 400 });

    await prisma.expense.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.code === "P2025") {
      return NextResponse.json({ error: "المصروف غير موجود" }, { status: 404 });
    }
    console.error("DELETE expense error:", e.message);
    return NextResponse.json({ error: "فشل حذف المصروف" }, { status: 500 });
  }
}
