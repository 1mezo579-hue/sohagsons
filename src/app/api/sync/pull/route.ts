import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          error:
            "بيانات الاتصال بـ Supabase غير مكتملة — تأكد من NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في ملف .env",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── 1. Categories ──────────────────────────────────────────────
    console.log("⬇️  سحب المجموعات من Supabase...");
    const { data: cloudCategories, error: catError } = await supabase
      .from("Category")
      .select("*");

    if (catError) {
      // Try lowercase table name (some Supabase setups)
      const { data: catLower, error: catError2 } = await supabase
        .from("category")
        .select("*");
      if (catError2)
        throw new Error(`خطأ في جلب المجموعات: ${catError.message}`);
      (cloudCategories as any) = catLower;
    }

    let catCount = 0;
    if (cloudCategories && cloudCategories.length > 0) {
      for (const cat of cloudCategories) {
        // Upsert by name (unique) — avoids ID conflicts between Supabase & SQLite
        await prisma.category.upsert({
          where: { name: cat.name },
          update: { name: cat.name },
          create: { name: cat.name },
        });
        catCount++;
      }
    }

    // ── 2. Products ────────────────────────────────────────────────
    console.log("⬇️  سحب المنتجات من Supabase...");
    const { data: rawProducts, error: prodError } = await supabase
      .from("Product")
      .select("*, Category(name)");

    let cloudProducts = rawProducts;
    if (prodError) {
      const { data: prodLower, error: prodError2 } = await supabase
        .from("product")
        .select("*");
      if (prodError2)
        throw new Error(`خطأ في جلب المنتجات: ${prodError.message}`);
      cloudProducts = prodLower;
    }

    let prodCount = 0;
    if (cloudProducts && cloudProducts.length > 0) {
      for (const prod of cloudProducts) {
        // Resolve the category by name locally
        let localCategoryId: number | null = null;
        const catName: string | null =
          prod.Category?.name || prod.category_name || null;
        if (catName) {
          const localCat = await prisma.category.findFirst({
            where: { name: catName },
          });
          if (localCat) localCategoryId = localCat.id;
        }

        const productData = {
          name: prod.name,
          barcode: prod.barcode ?? null,
          categoryId: localCategoryId,
          priceType: prod.priceType ?? prod.price_type ?? "unit",
          price: prod.price ?? 0,
          costPrice: prod.costPrice ?? prod.cost_price ?? 0,
          stock: prod.stock ?? 0,
          minStock: prod.minStock ?? prod.min_stock ?? 5,
          unit: prod.unit ?? "piece",
          expiryDate: prod.expiryDate ?? prod.expiry_date ?? null,
          synced: true,
        };

        if (prod.barcode) {
          // Upsert by unique barcode
          await prisma.product.upsert({
            where: { barcode: prod.barcode },
            update: productData,
            create: productData,
          });
        } else {
          // No barcode — find by name
          const existing = await prisma.product.findFirst({
            where: { name: prod.name },
          });
          if (existing) {
            await prisma.product.update({
              where: { id: existing.id },
              data: productData,
            });
          } else {
            await prisma.product.create({ data: productData });
          }
        }
        prodCount++;
      }
    }

    // ── 3. Customers ───────────────────────────────────────────────
    console.log("⬇️  سحب العملاء من Supabase...");
    const { data: rawCustomers, error: custError } = await supabase
      .from("Customer")
      .select("*");

    let cloudCustomers = rawCustomers;
    if (custError) {
      const { data: custLower, error: custError2 } = await supabase
        .from("customer")
        .select("*");
      if (custError2)
        throw new Error(`خطأ في جلب العملاء: ${custError.message}`);
      cloudCustomers = custLower;
    }

    let custCount = 0;
    if (cloudCustomers && cloudCustomers.length > 0) {
      for (const cust of cloudCustomers) {
        if (!cust.phone) continue; // phone is unique — skip if missing
        const custData = {
          name: cust.name ?? "عميل",
          phone: cust.phone,
          address: cust.address ?? null,
          points: cust.points ?? 0,
          totalSpent: cust.totalSpent ?? cust.total_spent ?? 0,
          balance: cust.balance ?? 0,
          notes: cust.notes ?? null,
        };
        await prisma.customer.upsert({
          where: { phone: cust.phone },
          update: custData,
          create: custData,
        });
        custCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "✅ تم تحديث قاعدة البيانات المحلية من السيرفر بنجاح!",
      categoriesPulled: catCount,
      productsPulled: prodCount,
      customersPulled: custCount,
    });
  } catch (error: any) {
    console.error("❌ خطأ المزامنة:", error);
    return NextResponse.json(
      { error: error.message || "حدث خطأ غير متوقع أثناء المزامنة" },
      { status: 500 }
    );
  }
}
