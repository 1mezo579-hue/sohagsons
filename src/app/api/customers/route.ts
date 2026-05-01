import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── GET all customers ────────────────────────────────────────────────────────
export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        points: true,
        totalSpent: true,
        balance: true,
        notes: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(customers);
  } catch (e: any) {
    console.error("GET customers error:", e.message);
    return NextResponse.json({ error: "فشل تحميل العملاء" }, { status: 500 });
  }
}

// ─── POST create customer ─────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { name, phone, address, notes } = await req.json();

    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "الاسم ورقم التليفون مطلوبان" }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        address: address?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "رقم التليفون مسجل مسبقاً لعميل آخر" }, { status: 400 });
    }
    console.error("POST customer error:", e.message);
    return NextResponse.json({ error: "فشل في إضافة العميل" }, { status: 500 });
  }
}
