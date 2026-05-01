import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const traders = await prisma.trader.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(traders);
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    const { name, phone, company, address, notes } = await req.json();
    if (!name) return NextResponse.json({ error: "اسم التاجر مطلوب" }, { status: 400 });
    const trader = await prisma.trader.create({
      data: { name, phone, company, address, notes },
    });
    return NextResponse.json(trader, { status: 201 });
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}
