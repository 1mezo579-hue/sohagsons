import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── POST: Settle customer debt (single query) ───────────────────────────────
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!id) return NextResponse.json({ error: "معرّف العميل غير صالح" }, { status: 400 });

    const { amount } = await req.json();
    const amountNum = Number(amount);

    if (!amountNum || amountNum <= 0) {
      return NextResponse.json({ error: "المبلغ يجب أن يكون أكبر من صفر" }, { status: 400 });
    }

    // Use updateMany with a conditional clamp to avoid extra findUnique call
    // First get current balance to clamp
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: { id: true, balance: true, name: true },
    });

    if (!customer) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }

    if (customer.balance <= 0) {
      return NextResponse.json({ error: "ليس على هذا العميل أي مديونية" }, { status: 400 });
    }

    const deduction = Math.min(amountNum, customer.balance);
    const newBalance = customer.balance - deduction;

    const updated = await prisma.customer.update({
      where: { id },
      data: { balance: newBalance },
      select: { id: true, name: true, balance: true, points: true },
    });

    return NextResponse.json({
      ...updated,
      paidAmount: deduction,
      message: newBalance === 0 ? "تم سداد الحساب بالكامل ✅" : `تم خصم ${deduction} جنيه، المتبقي ${newBalance} جنيه`,
    });
  } catch (e: any) {
    console.error("Customer pay error:", e.message);
    return NextResponse.json({ error: "حدث خطأ أثناء السداد" }, { status: 500 });
  }
}
