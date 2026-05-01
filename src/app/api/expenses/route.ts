import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(expenses);
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    const { amount, category, description, userId } = await req.json();
    if (!amount || !category) return NextResponse.json({ error: "المبلغ والتصنيف مطلوبان" }, { status: 400 });
    const expense = await prisma.expense.create({
      data: { amount: parseFloat(amount), category, description, userId: userId || 1 },
      include: { user: { select: { name: true } } },
    });
    return NextResponse.json(expense, { status: 201 });
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}
