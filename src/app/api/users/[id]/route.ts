import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// ─── PUT: Update user ────────────────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!id) return NextResponse.json({ error: "معرّف المستخدم غير صالح" }, { status: 400 });

    const body = await req.json();
    const { name, role, password } = body;

    const updateData: any = {};
    if (name?.trim()) updateData.name = name.trim();
    if (role) {
      const validRoles = ["admin", "manager", "cashier"];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: "الدور غير صالح" }, { status: 400 });
      }
      updateData.role = role;
    }

    // Hash password if provided
    if (password?.trim()) {
      updateData.password = await bcrypt.hash(password.trim(), 10);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "لا توجد بيانات للتحديث" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, username: true, name: true, role: true, createdAt: true },
    });

    return NextResponse.json(user);
  } catch (e: any) {
    if (e.code === "P2025") {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }
    console.error("PUT user error:", e.message);
    return NextResponse.json({ error: "فشل في تحديث المستخدم" }, { status: 500 });
  }
}

// ─── DELETE: Remove user ─────────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!id) return NextResponse.json({ error: "معرّف المستخدم غير صالح" }, { status: 400 });

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.code === "P2025") {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }
    // P2003 = can't delete due to related records
    if (e.code === "P2003") {
      return NextResponse.json({ error: "لا يمكن حذف هذا المستخدم لوجود بيانات مرتبطة به" }, { status: 409 });
    }
    console.error("DELETE user error:", e.message);
    return NextResponse.json({ error: "فشل في حذف المستخدم" }, { status: 500 });
  }
}