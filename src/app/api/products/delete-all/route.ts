import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  try {
    // Delete dependent records first
    await prisma.stockLog.deleteMany({});
    await prisma.invoiceItem.deleteMany({});
    await prisma.product.deleteMany({});
    
    return NextResponse.json({ message: "تم مسح جميع الأصناف بنجاح" });
  } catch (error) {
    console.error("Error deleting all products:", error);
    return NextResponse.json({ error: "فشل في مسح الأصناف، قد تكون مرتبطة بفواتير موجودة" }, { status: 500 });
  }
}
