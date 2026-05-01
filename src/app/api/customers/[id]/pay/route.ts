import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const { amount } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "المبلغ غير صالح" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });

    // Ensure we don't pay more than they owe
    const newBalance = Math.max(0, customer.balance - amount);

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: { balance: newBalance },
    });

    return NextResponse.json(updatedCustomer);
  } catch (e: any) {
    console.error("Customer payment error:", e);
    return NextResponse.json({ error: "حدث خطأ أثناء السداد" }, { status: 500 });
  }
}
