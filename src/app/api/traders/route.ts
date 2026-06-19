import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── GET all traders ─────────────────────────────────────────────────────────
export async function GET() {
  try {
    const traders = await prisma.trader.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        company: true,
        address: true,
        balance: true,
        notes: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(traders);
  } catch (e: any) {
    console.error("GET traders error:", e.message);
    return NextResponse.json({ error: "فشل تحميل الموردين" }, { status: 500 });
  }
}

// ─── POST create trader ───────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { name, phone, company, address, notes } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "اسم التاجر مطلوب" }, { status: 400 });
    }

    const trader = await prisma.trader.create({
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
      },
      select: { id: true, name: true, phone: true, company: true, balance: true },
    });

    return NextResponse.json(trader, { status: 201 });
  } catch (e: any) {
    console.error("POST trader error:", e.message);
    return NextResponse.json({ error: "فشل في إضافة التاجر" }, { status: 500 });
  }
}

// ─── PATCH record payment to trader ──────────────────────────────────────────
export async function PATCH(req: Request) {
  try {
    const { id, payment } = await req.json();

    if (!id || !payment || Number(payment) <= 0) {
      return NextResponse.json({ error: "معرّف التاجر والمبلغ مطلوبان" }, { status: 400 });
    }

    const trader = await prisma.trader.update({
      where: { id: Number(id) },
      data: { balance: { decrement: Number(payment) } },
      select: { id: true, name: true, phone: true, company: true, balance: true },
    });

    return NextResponse.json(trader);
  } catch (e: any) {
    if (e.code === "P2025") {
      return NextResponse.json({ error: "التاجر غير موجود" }, { status: 404 });
    }
    console.error("PATCH trader payment error:", e.message);
    return NextResponse.json({ error: "فشل تسجيل الدفعة" }, { status: 500 });
  }
}
