import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const product = await prisma.product.update({
      where: { id: parseInt(params.id) },
      data: {
        name: body.name,
        barcode: body.barcode || null,
        categoryId: parseInt(body.categoryId),
        priceType: body.priceType,
        price: parseFloat(body.price),
        costPrice: parseFloat(body.costPrice) || 0,
        stock: parseFloat(body.stock) || 0,
        minStock: parseFloat(body.minStock) || 5,
        unit: body.unit,
      },
      include: { category: true },
    });
    return NextResponse.json(product);
  } catch (error) {
    console.error("PUT /api/products/[id] error:", error);
    return NextResponse.json({ error: "فشل في تحديث المنتج" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.product.delete({ where: { id: parseInt(params.id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json({ error: "فشل في حذف المنتج" }, { status: 500 });
  }
}