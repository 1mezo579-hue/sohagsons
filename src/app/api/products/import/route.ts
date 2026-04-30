import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "لا توجد بيانات للاستيراد" }, { status: 400 });
    }

    let successCount = 0;
    let failedCount = 0;

    for (const item of data) {
      try {
        if (!item.name || !item.price) {
          failedCount++;
          continue;
        }

        let categoryId = 1;
        if (item.category) {
          // Find or create category
          let category = await prisma.category.findUnique({ where: { name: item.category } });
          if (!category) {
            category = await prisma.category.create({ data: { name: item.category } });
          }
          categoryId = category.id;
        }

        await prisma.product.create({
          data: {
            name: String(item.name),
            barcode: item.barcode ? String(item.barcode) : null,
            categoryId: categoryId,
            priceType: item.priceType === "weight" ? "weight" : "unit",
            price: parseFloat(item.price) || 0,
            costPrice: parseFloat(item.costPrice) || 0,
            stock: parseFloat(item.stock) || 0,
            minStock: parseFloat(item.minStock) || 5,
            unit: item.unit || "piece",
          }
        });
        successCount++;
      } catch (err) {
        failedCount++;
        console.error("Failed to import row:", item, err);
      }
    }

    return NextResponse.json({ 
      message: `تم استيراد ${successCount} صنف بنجاح${failedCount > 0 ? `، وفشل استيراد ${failedCount} صنف` : ''}` 
    });
  } catch (error) {
    console.error("Error importing products:", error);
    return NextResponse.json({ error: "فشل في استيراد المنتجات" }, { status: 500 });
  }
}
