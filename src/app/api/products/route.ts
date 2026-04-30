import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "فشل في جلب المنتجات" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const product = await prisma.product.create({
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
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ error: "فشل في إضافة المنتج" }, { status: 500 });
  }
}