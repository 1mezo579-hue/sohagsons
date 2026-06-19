import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const body = await req.json();
    const customer = await prisma.customer.update({ where: { id }, data: body });
    return NextResponse.json(customer);
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const invoiceCount = await prisma.invoice.count({ where: { customerId: id } });
    if (invoiceCount > 0) {
      return NextResponse.json(
        { error: "لا يمكن حذف العميل لوجود فواتير مرتبطة به" },
        { status: 409 }
      );
    }
    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "فشل حذف العميل" }, { status: 500 });
  }
}
