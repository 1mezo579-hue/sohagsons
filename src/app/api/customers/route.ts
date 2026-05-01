import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(customers);
  } catch (e) { return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, address, notes } = body;
    if (!name || !phone) return NextResponse.json({ error: "الاسم والتليفون مطلوبان" }, { status: 400 });
    const customer = await prisma.customer.create({ data: { name, phone, address, notes } });
    return NextResponse.json(customer, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "رقم التليفون مسجل مسبقاً" }, { status: 400 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
