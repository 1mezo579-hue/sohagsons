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
