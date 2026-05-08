import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// ─── GET all users (password excluded) ─────────────────────────────────────
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(users);
  } catch (e: any) {
    console.error("GET users error:", e.message);
    return NextResponse.json({ error: "فشل في جلب المستخدمين" }, { status: 500 });
  }
}

// ─── POST create user ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { username, password, name, role } = await req.json();

    if (!username?.trim() || !password?.trim() || !name?.trim() || !role) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    const validRoles = ["admin", "manager", "cashier"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "دور المستخدم غير صالح" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password.trim(), 10);

    const user = await prisma.user.create({
      data: {
        username: username.trim().toLowerCase(),
        password: hashed,
        name: name.trim(),
        role,
      },
      select: { id: true, username: true, name: true, role: true, createdAt: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "اسم المستخدم موجود مسبقاً" }, { status: 400 });
    }
    console.error("POST user error:", e.message);
    return NextResponse.json({ error: "فشل في إضافة المستخدم" }, { status: 500 });
  }
}