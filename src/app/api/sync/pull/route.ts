import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "بيانات الاتصال بـ Supabase غير مكتملة في ملف البيئة" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch from Supabase
    console.log("جاري سحب المجموعات من Supabase...");
    const { data: cloudCategories, error: catError } = await supabase
      .from("Category")
      .select("*");

    if (catError) throw new Error(`خطأ في جلب المجموعات: ${catError.message}`);

    console.log("جاري سحب المنتجات من Supabase...");
    const { data: cloudProducts, error: prodError } = await supabase
      .from("Product")
      .select("*");

    if (prodError) throw new Error(`خطأ في جلب المنتجات: ${prodError.message}`);

    console.log("جاري سحب العملاء من Supabase...");
    const { data: cloudCustomers, error: custError } = await supabase
      .from("Customer")
      .select("*");

    if (custError) throw new Error(`خطأ في جلب العملاء: ${custError.message}`);

    // 2. Upsert Categories locally
    let catCount = 0;
    if (cloudCategories && cloudCategories.length > 0) {
      for (const cat of cloudCategories) {
        await prisma.category.upsert({
          where: { id: cat.id },
          update: { name: cat.name },
          create: { id: cat.id, name: cat.name },
        });
        catCount++;
      }
    }

    // 3. Upsert Products locally
    let prodCount = 0;
    if (cloudProducts && cloudProducts.length > 0) {
      for (const prod of cloudProducts) {
        await prisma.product.upsert({
          where: { id: prod.id },
          update: {
            name: prod.name,
            barcode: prod.barcode,
            categoryId: prod.categoryId,
            priceType: prod.priceType,
            price: prod.price,
            costPrice: prod.costPrice,
            stock: prod.stock,
            minStock: prod.minStock,
            unit: prod.unit,
            expiryDate: prod.expiryDate,
            synced: true, // Mark synced local
          },
          create: {
            id: prod.id,
            name: prod.name,
            barcode: prod.barcode,
            categoryId: prod.categoryId,
            priceType: prod.priceType,
            price: prod.price,
            costPrice: prod.costPrice,
            stock: prod.stock,
            minStock: prod.minStock,
            unit: prod.unit,
            expiryDate: prod.expiryDate,
            synced: true,
          },
        });
        prodCount++;
      }
    }

    // 4. Upsert Customers locally
    let custCount = 0;
    if (cloudCustomers && cloudCustomers.length > 0) {
      for (const cust of cloudCustomers) {
        await prisma.customer.upsert({
          where: { id: cust.id },
          update: {
            name: cust.name,
            phone: cust.phone,
            address: cust.address,
            points: cust.points,
            totalSpent: cust.totalSpent,
            balance: cust.balance,
            notes: cust.notes,
          },
          create: {
            id: cust.id,
            name: cust.name,
            phone: cust.phone,
            address: cust.address,
            points: cust.points,
            totalSpent: cust.totalSpent,
            balance: cust.balance,
            notes: cust.notes,
          },
        });
        custCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "تم تحديث البيانات المحلية بالكامل من السيرفر الأونلاين بنجاح!",
      categoriesPulled: catCount,
      productsPulled: prodCount,
      customersPulled: custCount,
    });
  } catch (error: any) {
    console.error("خطأ المزامنة:", error);
    return NextResponse.json(
      { error: error.message || "حدث خطأ غير متوقع أثناء المزامنة" },
      { status: 500 }
    );
  }
}
