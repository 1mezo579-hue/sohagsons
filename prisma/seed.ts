import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.stockLog.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Categories
  const categoryNames = [
    "الزيوت والسمنات",
    "منتجات البان",
    "معلبات",
    "مكرونات ورز أكياس",
    "جبن بالوزن",
    "مكرونات ورز وبقوليات بالوزن",
    "عطارة بالوزن",
    "شيبسي وبسكوتات",
    "مياه غازية",
    "عصائر معلبة",
    "باتيه ومعجنات",
    "مشروبات ساخنة",
    "منظفات ومعطرات",
    "مناديل وورقيات",
    "قسم المجمدات",
    "حلويات وشيكولاتة"
  ];

  for (const name of categoryNames) {
    await prisma.category.create({ data: { name } });
  }

  const cats = await prisma.category.findMany();
  const getCatId = (name: string) => cats.find((c) => c.name === name)!.id;

  // Products Data
  const products = [
    // === الزيوت والسمنات ===
    { name: "زيت عافية ذرة 800 مل", barcode: "62210001", categoryId: getCatId("الزيوت والسمنات"), priceType: "unit", price: 95.0, costPrice: 85.0, stock: 100, minStock: 20, unit: "bottle" },
    { name: "زيت كريستال عباد 800 مل", barcode: "62210004", categoryId: getCatId("الزيوت والسمنات"), priceType: "unit", price: 85.0, costPrice: 75.0, stock: 120, minStock: 25, unit: "bottle" },
    { name: "سمنة روابي 1.5 كجم", barcode: "62210009", categoryId: getCatId("الزيوت والسمنات"), priceType: "unit", price: 175.0, costPrice: 160.0, stock: 60, minStock: 15, unit: "box" },
    
    // === منتجات البان ===
    { name: "حليب جهينة 1 لتر", barcode: "62220001", categoryId: getCatId("منتجات البان"), priceType: "unit", price: 42.0, costPrice: 38.0, stock: 300, minStock: 50, unit: "box" },
    { name: "زبادي جهينة 105 جم", barcode: "62220005", categoryId: getCatId("منتجات البان"), priceType: "unit", price: 7.0, costPrice: 5.5, stock: 500, minStock: 100, unit: "piece" },
    
    // === معلبات ===
    { name: "تونة صن شاين قطع", barcode: "62230001", categoryId: getCatId("معلبات"), priceType: "unit", price: 65.0, costPrice: 55.0, stock: 300, minStock: 50, unit: "piece" },
    { name: "صلصة هاينز 340 جم", barcode: "62230011", categoryId: getCatId("معلبات"), priceType: "unit", price: 45.0, costPrice: 38.0, stock: 200, minStock: 40, unit: "bottle" },
    
    // === مكرونات ورز أكياس ===
    { name: "ارز الضحى 1 كجم", barcode: "62240006", categoryId: getCatId("مكرونات ورز أكياس"), priceType: "unit", price: 42.0, costPrice: 35.0, stock: 400, minStock: 80, unit: "piece" },
    { name: "سكر الأسرة 1 كجم", barcode: "62240011", categoryId: getCatId("مكرونات ورز أكياس"), priceType: "unit", price: 38.0, costPrice: 31.0, stock: 800, minStock: 150, unit: "piece" },

    // === جبن بالوزن ===
    { name: "جبن رومي قديم", barcode: "62250001", categoryId: getCatId("جبن بالوزن"), priceType: "weight", price: 280.0, costPrice: 230.0, stock: 25.5, minStock: 5, unit: "kg" },
    { name: "لانشون بيف حلواني", barcode: "62250012", categoryId: getCatId("جبن بالوزن"), priceType: "weight", price: 220.0, costPrice: 180.0, stock: 15.0, minStock: 3, unit: "kg" },

    // === شيبسي وبسكوتات ===
    { name: "شيبسي عائلي طماطم", barcode: "62280001", categoryId: getCatId("شيبسي وبسكوتات"), priceType: "unit", price: 15.0, costPrice: 12.0, stock: 150, minStock: 30, unit: "bag" },
    
    // === منظفات ومعطرات ===
    { name: "بريل 1 لتر", barcode: "62210050", categoryId: getCatId("منظفات ومعطرات"), priceType: "unit", price: 35.0, costPrice: 30.0, stock: 100, minStock: 10, unit: "bottle" },
    { name: "برسيل جيل 2.5 لتر", barcode: "62210051", categoryId: getCatId("منظفات ومعطرات"), priceType: "unit", price: 185.0, costPrice: 165.0, stock: 50, minStock: 5, unit: "bottle" },
    
    // === مناديل وورقيات ===
    { name: "مناديل فاين 550 منديل", barcode: "62220050", categoryId: getCatId("مناديل وورقيات"), priceType: "unit", price: 65.0, costPrice: 55.0, stock: 100, minStock: 20, unit: "box" },
    
    // === المجمدات ===
    { name: "كوكي بانيه 1 كيلو", barcode: "62230050", categoryId: getCatId("قسم المجمدات"), priceType: "unit", price: 220.0, costPrice: 195.0, stock: 50, minStock: 5, unit: "box" },
    
    // === حلويات وشيكولاتة ===
    { name: "جالكسي سادة", barcode: "62240050", categoryId: getCatId("حلويات وشيكولاتة"), priceType: "unit", price: 35.0, costPrice: 28.0, stock: 100, minStock: 20, unit: "piece" },
    { name: "نوتيلا 350 جرام", barcode: "62240051", categoryId: getCatId("حلويات وشيكولاتة"), priceType: "unit", price: 165.0, costPrice: 145.0, stock: 40, minStock: 5, unit: "jar" }
  ];

  await prisma.product.createMany({ data: products });

  // Users
  await prisma.user.createMany({
    data: [
      { name: "إسلام (Owner)", username: "admin", password: "102030", role: "admin" },
      { name: "مسئول صيانة", username: "tech", password: "tech123", role: "manager" },
      { name: "بائع", username: "sales", password: "sales123", role: "cashier" }
    ]
  });

  console.log("Seed completed successfully with 3 users and expanded categories!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });