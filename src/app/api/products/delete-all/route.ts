import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE() {
  // Disabled: mass delete would destroy invoice history and stock logs
  return NextResponse.json(
    { error: "تم تعطيل مسح جميع المنتجات لحماية بيانات الفواتير والمخزون" },
    { status: 403 }
  );
}
