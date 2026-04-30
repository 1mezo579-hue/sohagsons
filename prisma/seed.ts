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
  await prisma.category.createMany({
    data: [
      { name: "الزيوت والسمنات" },
      { name: "منتجات البان" },
      { name: "معلبات" },
      { name: "مكرونات ورز أكياس" },
      { name: "جبن بالوزن" },
      { name: "مكرونات ورز وبقوليات بالوزن" },
      { name: "عطارة بالوزن" },
      { name: "شيبسي وبسكوتات" },
      { name: "مياه غازية" },
      { name: "عصائر معلبة" },
      { name: "باتيه ومعجنات" },
      { name: "مشروبات ساخنة" },
    ],
  });

  const cats = await prisma.category.findMany();
  const getCat = (name: string) => cats.find((c) => c.name === name)!;

  // Products
  await prisma.product.createMany({
    data: [
      // === الزيوت والسمنات ===
      { name: "زيت عافية ذرة 800 مل", barcode: "62210001", categoryId: getCat("الزيوت والسمنات").id, priceType: "unit", price: 95.0, costPrice: 85.0, stock: 100, minStock: 20, unit: "bottle" },
      { name: "زيت عافية ذرة 1.5 لتر", barcode: "62210002", categoryId: getCat("الزيوت والسمنات").id, priceType: "unit", price: 175.0, costPrice: 160.0, stock: 80, minStock: 15, unit: "bottle" },
      { name: "زيت عافية ذرة 2.2 لتر", barcode: "62210003", categoryId: getCat("الزيوت والسمنات").id, priceType: "unit", price: 250.0, costPrice: 230.0, stock: 50, minStock: 10, unit: "bottle" },
      { name: "زيت كريستال عباد 800 مل", barcode: "62210004", categoryId: getCat("الزيوت والسمنات").id, priceType: "unit", price: 85.0, costPrice: 75.0, stock: 120, minStock: 25, unit: "bottle" },
      { name: "زيت كريستال عباد 1.5 لتر", barcode: "62210005", categoryId: getCat("الزيوت والسمنات").id, priceType: "unit", price: 160.0, costPrice: 145.0, stock: 90, minStock: 20, unit: "bottle" },
      { name: "زيت هلا عباد 750 مل", barcode: "62210006", categoryId: getCat("الزيوت والسمنات").id, priceType: "unit", price: 78.0, costPrice: 70.0, stock: 150, minStock: 30, unit: "bottle" },
      { name: "زيت قلية خليط 700 مل", barcode: "62210007", categoryId: getCat("الزيوت والسمنات").id, priceType: "unit", price: 55.0, costPrice: 48.0, stock: 200, minStock: 50, unit: "bottle" },
      { name: "سمنة روابي 700 جم", barcode: "62210008", categoryId: getCat("الزيوت والسمنات").id, priceType: "unit", price: 85.0, costPrice: 75.0, stock: 100, minStock: 20, unit: "box" },
      { name: "سمنة روابي 1.5 كجم", barcode: "62210009", categoryId: getCat("الزيوت والسمنات").id, priceType: "unit", price: 175.0, costPrice: 160.0, stock: 60, minStock: 15, unit: "box" },
      { name: "سمنة كريستال بيضاء 700 جم", barcode: "62210010", categoryId: getCat("الزيوت والسمنات").id, priceType: "unit", price: 85.0, costPrice: 75.0, stock: 100, minStock: 20, unit: "box" },
      { name: "سمنة جنة 1.5 كجم", barcode: "62210011", categoryId: getCat("الزيوت والسمنات").id, priceType: "unit", price: 170.0, costPrice: 155.0, stock: 50, minStock: 10, unit: "box" },
      { name: "زبدة فيرن 400 جم", barcode: "62210012", categoryId: getCat("الزيوت والسمنات").id, priceType: "unit", price: 120.0, costPrice: 105.0, stock: 80, minStock: 15, unit: "pack" },
      { name: "زبدة لورباك 400 جم", barcode: "62210013", categoryId: getCat("الزيوت والسمنات").id, priceType: "unit", price: 180.0, costPrice: 160.0, stock: 40, minStock: 10, unit: "pack" },

      // === منتجات البان ===
      { name: "حليب جهينة كامل الدسم 1 لتر", barcode: "62220001", categoryId: getCat("منتجات البان").id, priceType: "unit", price: 42.0, costPrice: 38.0, stock: 300, minStock: 50, unit: "box" },
      { name: "حليب جهينة خالي الدسم 1 لتر", barcode: "62220002", categoryId: getCat("منتجات البان").id, priceType: "unit", price: 42.0, costPrice: 38.0, stock: 100, minStock: 20, unit: "box" },
      { name: "حليب المراعي 1.5 لتر", barcode: "62220003", categoryId: getCat("منتجات البان").id, priceType: "unit", price: 58.0, costPrice: 52.0, stock: 150, minStock: 30, unit: "box" },
      { name: "حليب بخيره 500 مل", barcode: "62220004", categoryId: getCat("منتجات البان").id, priceType: "unit", price: 20.0, costPrice: 18.0, stock: 400, minStock: 100, unit: "bag" },
      { name: "زبادي جهينة سادة 105 جم", barcode: "62220005", categoryId: getCat("منتجات البان").id, priceType: "unit", price: 7.0, costPrice: 5.5, stock: 500, minStock: 100, unit: "piece" },
      { name: "زبادي المراعي لايت 105 جم", barcode: "62220006", categoryId: getCat("منتجات البان").id, priceType: "unit", price: 7.5, costPrice: 6.0, stock: 150, minStock: 30, unit: "piece" },
      { name: "رايب جهينة 440 مل", barcode: "62220007", categoryId: getCat("منتجات البان").id, priceType: "unit", price: 18.0, costPrice: 15.0, stock: 120, minStock: 25, unit: "bottle" },
      { name: "جبنة بريزيدون مثلثات 16 قطعة", barcode: "62220008", categoryId: getCat("منتجات البان").id, priceType: "unit", price: 65.0, costPrice: 55.0, stock: 200, minStock: 40, unit: "box" },
      { name: "جبنة طعمة مثلثات 8 قطع", barcode: "62220009", categoryId: getCat("منتجات البان").id, priceType: "unit", price: 22.0, costPrice: 18.0, stock: 300, minStock: 50, unit: "box" },
      { name: "جبنة لافاش كيري 24 قطعة", barcode: "62220010", categoryId: getCat("منتجات البان").id, priceType: "unit", price: 95.0, costPrice: 82.0, stock: 80, minStock: 15, unit: "box" },
      { name: "جبنة دومتي فيتا 500 جم", barcode: "62220011", categoryId: getCat("منتجات البان").id, priceType: "unit", price: 38.0, costPrice: 32.0, stock: 250, minStock: 50, unit: "box" },
      { name: "جبنة عبور لاند اسطنبولي 250 جم", barcode: "62220012", categoryId: getCat("منتجات البان").id, priceType: "unit", price: 22.0, costPrice: 18.0, stock: 200, minStock: 40, unit: "box" },

      // === معلبات ===
      { name: "تونة صن شاين قطع 170 جم", barcode: "62230001", categoryId: getCat("معلبات").id, priceType: "unit", price: 65.0, costPrice: 55.0, stock: 300, minStock: 50, unit: "piece" },
      { name: "تونة صن شاين مفتتة 140 جم", barcode: "62230002", categoryId: getCat("معلبات").id, priceType: "unit", price: 35.0, costPrice: 28.0, stock: 400, minStock: 50, unit: "piece" },
      { name: "تونة دولفين شرائح 170 جم", barcode: "62230003", categoryId: getCat("معلبات").id, priceType: "unit", price: 70.0, costPrice: 60.0, stock: 150, minStock: 30, unit: "piece" },
      { name: "صلصة هارفست 380 جم", barcode: "62230004", categoryId: getCat("معلبات").id, priceType: "unit", price: 28.0, costPrice: 23.0, stock: 250, minStock: 50, unit: "piece" },
      { name: "صلصة فاين فودز 320 جم", barcode: "62230005", categoryId: getCat("معلبات").id, priceType: "unit", price: 25.0, costPrice: 20.0, stock: 200, minStock: 40, unit: "piece" },
      { name: "فول مدمس امريكانا 400 جم", barcode: "62230006", categoryId: getCat("معلبات").id, priceType: "unit", price: 20.0, costPrice: 16.0, stock: 300, minStock: 60, unit: "piece" },
      { name: "فول هارفست بالخلطة 400 جم", barcode: "62230007", categoryId: getCat("معلبات").id, priceType: "unit", price: 22.0, costPrice: 18.0, stock: 200, minStock: 40, unit: "piece" },
      { name: "ذرة حلوة امريكانا 400 جم", barcode: "62230008", categoryId: getCat("معلبات").id, priceType: "unit", price: 45.0, costPrice: 38.0, stock: 120, minStock: 20, unit: "piece" },
      { name: "مشروم قطع هارفست 400 جم", barcode: "62230009", categoryId: getCat("معلبات").id, priceType: "unit", price: 55.0, costPrice: 48.0, stock: 100, minStock: 20, unit: "piece" },
      { name: "مايونيز هاينز 310 جم", barcode: "62230010", categoryId: getCat("معلبات").id, priceType: "unit", price: 65.0, costPrice: 55.0, stock: 150, minStock: 30, unit: "bottle" },
      { name: "كاتشب هاينز 340 جم", barcode: "62230011", categoryId: getCat("معلبات").id, priceType: "unit", price: 45.0, costPrice: 38.0, stock: 200, minStock: 40, unit: "bottle" },
      { name: "عسل نحل امتنان 800 جم", barcode: "62230012", categoryId: getCat("معلبات").id, priceType: "unit", price: 185.0, costPrice: 165.0, stock: 50, minStock: 10, unit: "bottle" },
      { name: "طحينة البوادي 500 جم", barcode: "62230013", categoryId: getCat("معلبات").id, priceType: "unit", price: 95.0, costPrice: 85.0, stock: 100, minStock: 20, unit: "box" },
      { name: "مربى فيتراك فراولة 450 جم", barcode: "62230014", categoryId: getCat("معلبات").id, priceType: "unit", price: 48.0, costPrice: 40.0, stock: 150, minStock: 30, unit: "bottle" },

      // === مكرونات ورز أكياس ===
      { name: "مكرونة ريجينا قلم 400 جم", barcode: "62240001", categoryId: getCat("مكرونات ورز أكياس").id, priceType: "unit", price: 20.0, costPrice: 16.0, stock: 300, minStock: 50, unit: "piece" },
      { name: "مكرونة ريجينا اسباجتي 400 جم", barcode: "62240002", categoryId: getCat("مكرونات ورز أكياس").id, priceType: "unit", price: 20.0, costPrice: 16.0, stock: 300, minStock: 50, unit: "piece" },
      { name: "مكرونة حوا قلم 400 جم", barcode: "62240003", categoryId: getCat("مكرونات ورز أكياس").id, priceType: "unit", price: 12.0, costPrice: 9.5, stock: 500, minStock: 100, unit: "piece" },
      { name: "مكرونة حوا خواتم 400 جم", barcode: "62240004", categoryId: getCat("مكرونات ورز أكياس").id, priceType: "unit", price: 12.0, costPrice: 9.5, stock: 400, minStock: 80, unit: "piece" },
      { name: "مكرونة الملكة 1 كجم", barcode: "62240005", categoryId: getCat("مكرونات ورز أكياس").id, priceType: "unit", price: 30.0, costPrice: 25.0, stock: 200, minStock: 40, unit: "piece" },
      { name: "ارز الضحى 1 كجم", barcode: "62240006", categoryId: getCat("مكرونات ورز أكياس").id, priceType: "unit", price: 42.0, costPrice: 35.0, stock: 400, minStock: 80, unit: "piece" },
      { name: "ارز الضحى 5 كجم", barcode: "62240007", categoryId: getCat("مكرونات ورز أكياس").id, priceType: "unit", price: 205.0, costPrice: 175.0, stock: 80, minStock: 15, unit: "piece" },
      { name: "ارز المطبخ 1 كجم", barcode: "62240008", categoryId: getCat("مكرونات ورز أكياس").id, priceType: "unit", price: 38.0, costPrice: 32.0, stock: 350, minStock: 70, unit: "piece" },
      { name: "ارز الساعة 1 كجم", barcode: "62240009", categoryId: getCat("مكرونات ورز أكياس").id, priceType: "unit", price: 35.0, costPrice: 28.0, stock: 500, minStock: 100, unit: "piece" },
      { name: "دقيق الضحى 1 كجم", barcode: "62240010", categoryId: getCat("مكرونات ورز أكياس").id, priceType: "unit", price: 30.0, costPrice: 24.0, stock: 250, minStock: 50, unit: "piece" },
      { name: "سكر الأسرة 1 كجم", barcode: "62240011", categoryId: getCat("مكرونات ورز أكياس").id, priceType: "unit", price: 38.0, costPrice: 31.0, stock: 800, minStock: 150, unit: "piece" },
      { name: "عدس بجبة الضحى 500 جم", barcode: "62240012", categoryId: getCat("مكرونات ورز أكياس").id, priceType: "unit", price: 45.0, costPrice: 38.0, stock: 100, minStock: 20, unit: "piece" },

      // === جبن بالوزن ===
      { name: "جبن رومي قديم (بطارخ)", barcode: "62250001", categoryId: getCat("جبن بالوزن").id, priceType: "weight", price: 280.0, costPrice: 230.0, stock: 25.5, minStock: 5, unit: "kg" },
      { name: "جبن رومي وسط", barcode: "62250002", categoryId: getCat("جبن بالوزن").id, priceType: "weight", price: 240.0, costPrice: 200.0, stock: 30.0, minStock: 5, unit: "kg" },
      { name: "جبن رومي جديد", barcode: "62250003", categoryId: getCat("جبن بالوزن").id, priceType: "weight", price: 210.0, costPrice: 175.0, stock: 40.0, minStock: 10, unit: "kg" },
      { name: "جبن شيدر ايرلندي مستورد", barcode: "62250004", categoryId: getCat("جبن بالوزن").id, priceType: "weight", price: 350.0, costPrice: 290.0, stock: 15.0, minStock: 3, unit: "kg" },
      { name: "جبن فلامنك هولندي", barcode: "62250005", categoryId: getCat("جبن بالوزن").id, priceType: "weight", price: 380.0, costPrice: 320.0, stock: 10.0, minStock: 2, unit: "kg" },
      { name: "جبن جودة مستورد", barcode: "62250006", categoryId: getCat("جبن بالوزن").id, priceType: "weight", price: 360.0, costPrice: 300.0, stock: 12.0, minStock: 2, unit: "kg" },
      { name: "جبن ابيض براميلي فلفل", barcode: "62250007", categoryId: getCat("جبن بالوزن").id, priceType: "weight", price: 140.0, costPrice: 110.0, stock: 35.0, minStock: 5, unit: "kg" },
      { name: "جبن اسطنبولي ممتاز", barcode: "62250008", categoryId: getCat("جبن بالوزن").id, priceType: "weight", price: 150.0, costPrice: 120.0, stock: 20.0, minStock: 5, unit: "kg" },
      { name: "جبن قريش فلاحي", barcode: "62250009", categoryId: getCat("جبن بالوزن").id, priceType: "weight", price: 80.0, costPrice: 60.0, stock: 50.0, minStock: 10, unit: "kg" },
      { name: "جبن ثلاجة ملح خفيف", barcode: "62250010", categoryId: getCat("جبن بالوزن").id, priceType: "weight", price: 110.0, costPrice: 85.0, stock: 45.0, minStock: 10, unit: "kg" },
      { name: "بسطرمة بالثوم", barcode: "62250011", categoryId: getCat("جبن بالوزن").id, priceType: "weight", price: 450.0, costPrice: 380.0, stock: 8.0, minStock: 2, unit: "kg" },
      { name: "لانشون بيف حلواني", barcode: "62250012", categoryId: getCat("جبن بالوزن").id, priceType: "weight", price: 220.0, costPrice: 180.0, stock: 15.0, minStock: 3, unit: "kg" },
      { name: "لانشون فراخ حلواني", barcode: "62250013", categoryId: getCat("جبن بالوزن").id, priceType: "weight", price: 230.0, costPrice: 190.0, stock: 12.0, minStock: 3, unit: "kg" },
      { name: "حلاوة طحينية سادة", barcode: "62250014", categoryId: getCat("جبن بالوزن").id, priceType: "weight", price: 110.0, costPrice: 85.0, stock: 25.0, minStock: 5, unit: "kg" },
      { name: "زيتون كلاماتا", barcode: "62250015", categoryId: getCat("جبن بالوزن").id, priceType: "weight", price: 120.0, costPrice: 90.0, stock: 30.0, minStock: 5, unit: "kg" },
      { name: "زيتون اخضر تفاحي", barcode: "62250016", categoryId: getCat("جبن بالوزن").id, priceType: "weight", price: 90.0, costPrice: 70.0, stock: 40.0, minStock: 10, unit: "kg" },

      // === مكرونات ورز وبقوليات بالوزن ===
      { name: "مكرونة سايبة", barcode: "62260001", categoryId: getCat("مكرونات ورز وبقوليات بالوزن").id, priceType: "weight", price: 24.0, costPrice: 19.0, stock: 500.0, minStock: 50, unit: "kg" },
      { name: "ارز بلدي سايب", barcode: "62260002", categoryId: getCat("مكرونات ورز وبقوليات بالوزن").id, priceType: "weight", price: 32.0, costPrice: 27.0, stock: 1000.0, minStock: 100, unit: "kg" },
      { name: "عدس اصفر سايب", barcode: "62260003", categoryId: getCat("مكرونات ورز وبقوليات بالوزن").id, priceType: "weight", price: 50.0, costPrice: 42.0, stock: 100.0, minStock: 20, unit: "kg" },
      { name: "عدس بجبة سايب", barcode: "62260004", categoryId: getCat("مكرونات ورز وبقوليات بالوزن").id, priceType: "weight", price: 48.0, costPrice: 40.0, stock: 80.0, minStock: 15, unit: "kg" },
      { name: "فاصوليا بيضاء سايبة", barcode: "62260005", categoryId: getCat("مكرونات ورز وبقوليات بالوزن").id, priceType: "weight", price: 80.0, costPrice: 65.0, stock: 60.0, minStock: 10, unit: "kg" },
      { name: "لوبيا سايبة", barcode: "62260006", categoryId: getCat("مكرونات ورز وبقوليات بالوزن").id, priceType: "weight", price: 75.0, costPrice: 60.0, stock: 50.0, minStock: 10, unit: "kg" },
      { name: "حمص الشام سايب", barcode: "62260007", categoryId: getCat("مكرونات ورز وبقوليات بالوزن").id, priceType: "weight", price: 90.0, costPrice: 75.0, stock: 40.0, minStock: 10, unit: "kg" },
      { name: "فول تدميس بلدي سايب", barcode: "62260008", categoryId: getCat("مكرونات ورز وبقوليات بالوزن").id, priceType: "weight", price: 45.0, costPrice: 35.0, stock: 150.0, minStock: 30, unit: "kg" },

      // === عطارة بالوزن ===
      { name: "فلفل اسود حصى", barcode: "62270001", categoryId: getCat("عطارة بالوزن").id, priceType: "weight", price: 450.0, costPrice: 380.0, stock: 10.0, minStock: 2, unit: "kg" },
      { name: "فلفل اسود ناعم", barcode: "62270002", categoryId: getCat("عطارة بالوزن").id, priceType: "weight", price: 480.0, costPrice: 400.0, stock: 15.0, minStock: 2, unit: "kg" },
      { name: "كمون بلدي ناعم", barcode: "62270003", categoryId: getCat("عطارة بالوزن").id, priceType: "weight", price: 380.0, costPrice: 320.0, stock: 20.0, minStock: 3, unit: "kg" },
      { name: "كزبرة ناعمة", barcode: "62270004", categoryId: getCat("عطارة بالوزن").id, priceType: "weight", price: 120.0, costPrice: 90.0, stock: 25.0, minStock: 5, unit: "kg" },
      { name: "شطة حارة", barcode: "62270005", categoryId: getCat("عطارة بالوزن").id, priceType: "weight", price: 150.0, costPrice: 120.0, stock: 15.0, minStock: 3, unit: "kg" },
      { name: "كركم هندي", barcode: "62270006", categoryId: getCat("عطارة بالوزن").id, priceType: "weight", price: 140.0, costPrice: 110.0, stock: 10.0, minStock: 2, unit: "kg" },
      { name: "قرفة ناعمة", barcode: "62270007", categoryId: getCat("عطارة بالوزن").id, priceType: "weight", price: 180.0, costPrice: 150.0, stock: 12.0, minStock: 2, unit: "kg" },
      { name: "حبهان (هيل)", barcode: "62270008", categoryId: getCat("عطارة بالوزن").id, priceType: "weight", price: 1200.0, costPrice: 950.0, stock: 3.0, minStock: 0.5, unit: "kg" },
      { name: "ورق لورا", barcode: "62270009", categoryId: getCat("عطارة بالوزن").id, priceType: "weight", price: 200.0, costPrice: 160.0, stock: 5.0, minStock: 1, unit: "kg" },
      { name: "كركديه اسواني", barcode: "62270010", categoryId: getCat("عطارة بالوزن").id, priceType: "weight", price: 250.0, costPrice: 200.0, stock: 8.0, minStock: 2, unit: "kg" },

      // === شيبسي وبسكوتات ===
      { name: "شيبسي عائلي طماطم", barcode: "62280001", categoryId: getCat("شيبسي وبسكوتات").id, priceType: "unit", price: 15.0, costPrice: 12.0, stock: 150, minStock: 30, unit: "bag" },
      { name: "شيبسي عائلي جبنة متبلة", barcode: "62280002", categoryId: getCat("شيبسي وبسكوتات").id, priceType: "unit", price: 15.0, costPrice: 12.0, stock: 150, minStock: 30, unit: "bag" },
      { name: "دوريتوس حار حلو كبير", barcode: "62280003", categoryId: getCat("شيبسي وبسكوتات").id, priceType: "unit", price: 15.0, costPrice: 12.0, stock: 100, minStock: 20, unit: "bag" },
      { name: "شيتوس كرنشي جبنة", barcode: "62280004", categoryId: getCat("شيبسي وبسكوتات").id, priceType: "unit", price: 10.0, costPrice: 8.0, stock: 200, minStock: 40, unit: "bag" },
      { name: "بسكويت اوريو 6 قطع", barcode: "62280005", categoryId: getCat("شيبسي وبسكوتات").id, priceType: "unit", price: 10.0, costPrice: 8.0, stock: 300, minStock: 50, unit: "piece" },
      { name: "بسكويت بيمبو", barcode: "62280006", categoryId: getCat("شيبسي وبسكوتات").id, priceType: "unit", price: 5.0, costPrice: 4.0, stock: 400, minStock: 100, unit: "piece" },
      { name: "شوكولاتة كادبوري سادة", barcode: "62280007", categoryId: getCat("شيبسي وبسكوتات").id, priceType: "unit", price: 35.0, costPrice: 28.0, stock: 100, minStock: 20, unit: "piece" },
      { name: "شوكولاتة كيت كات", barcode: "62280008", categoryId: getCat("شيبسي وبسكوتات").id, priceType: "unit", price: 20.0, costPrice: 16.0, stock: 150, minStock: 30, unit: "piece" },

      // === مياه غازية ===
      { name: "بيبسي 1 لتر", barcode: "62290001", categoryId: getCat("مياه غازية").id, priceType: "unit", price: 20.0, costPrice: 17.0, stock: 200, minStock: 40, unit: "bottle" },
      { name: "بيبسي 2.5 لتر", barcode: "62290002", categoryId: getCat("مياه غازية").id, priceType: "unit", price: 35.0, costPrice: 30.0, stock: 100, minStock: 20, unit: "bottle" },
      { name: "كوكاكولا 1 لتر", barcode: "62290003", categoryId: getCat("مياه غازية").id, priceType: "unit", price: 20.0, costPrice: 17.0, stock: 200, minStock: 40, unit: "bottle" },
      { name: "سفن اب 1 لتر", barcode: "62290004", categoryId: getCat("مياه غازية").id, priceType: "unit", price: 20.0, costPrice: 17.0, stock: 150, minStock: 30, unit: "bottle" },
      { name: "ميرندا برتقال 1 لتر", barcode: "62290005", categoryId: getCat("مياه غازية").id, priceType: "unit", price: 20.0, costPrice: 17.0, stock: 150, minStock: 30, unit: "bottle" },
      { name: "بيبسي كانز 330 مل", barcode: "62290006", categoryId: getCat("مياه غازية").id, priceType: "unit", price: 12.0, costPrice: 10.0, stock: 300, minStock: 60, unit: "piece" },

      // === عصائر معلبة ===
      { name: "عصير جهينة مانجو 1 لتر", barcode: "62300001", categoryId: getCat("عصائر معلبة").id, priceType: "unit", price: 35.0, costPrice: 28.0, stock: 100, minStock: 20, unit: "box" },
      { name: "عصير جهينة تفاح 1 لتر", barcode: "62300002", categoryId: getCat("عصائر معلبة").id, priceType: "unit", price: 35.0, costPrice: 28.0, stock: 100, minStock: 20, unit: "box" },
      { name: "عصير جهينة جوافة 235 مل", barcode: "62300003", categoryId: getCat("عصائر معلبة").id, priceType: "unit", price: 10.0, costPrice: 8.0, stock: 250, minStock: 50, unit: "box" },
      { name: "عصير بيتي برتقال 1 لتر", barcode: "62300004", categoryId: getCat("عصائر معلبة").id, priceType: "unit", price: 28.0, costPrice: 23.0, stock: 120, minStock: 25, unit: "box" },
      { name: "عصير لمار تفاح 1 لتر", barcode: "62300005", categoryId: getCat("عصائر معلبة").id, priceType: "unit", price: 38.0, costPrice: 30.0, stock: 80, minStock: 15, unit: "box" },

      // === باتيه ومعجنات ===
      { name: "مولتو ماجنوم شوكولاتة", barcode: "62310001", categoryId: getCat("باتيه ومعجنات").id, priceType: "unit", price: 15.0, costPrice: 12.0, stock: 200, minStock: 40, unit: "piece" },
      { name: "مولتو ميني زعتر", barcode: "62310002", categoryId: getCat("باتيه ومعجنات").id, priceType: "unit", price: 10.0, costPrice: 8.0, stock: 150, minStock: 30, unit: "piece" },
      { name: "باتيه ايديتا جبنة", barcode: "62310003", categoryId: getCat("باتيه ومعجنات").id, priceType: "unit", price: 10.0, costPrice: 8.0, stock: 200, minStock: 40, unit: "piece" },
      { name: "توينكيز", barcode: "62310004", categoryId: getCat("باتيه ومعجنات").id, priceType: "unit", price: 5.0, costPrice: 4.0, stock: 400, minStock: 80, unit: "piece" },
      { name: "هوهوز شوكولاتة", barcode: "62310005", categoryId: getCat("باتيه ومعجنات").id, priceType: "unit", price: 5.0, costPrice: 4.0, stock: 400, minStock: 80, unit: "piece" },
      { name: "كيك تودو براونيز", barcode: "62310006", categoryId: getCat("باتيه ومعجنات").id, priceType: "unit", price: 8.0, costPrice: 6.5, stock: 250, minStock: 50, unit: "piece" },

      // === مشروبات ساخنة ===
      { name: "شاي العروسة 250 جم", barcode: "62320001", categoryId: getCat("مشروبات ساخنة").id, priceType: "unit", price: 45.0, costPrice: 38.0, stock: 150, minStock: 30, unit: "pack" },
      { name: "شاي ليبتون ناعم 250 جم", barcode: "62320002", categoryId: getCat("مشروبات ساخنة").id, priceType: "unit", price: 55.0, costPrice: 48.0, stock: 120, minStock: 25, unit: "pack" },
      { name: "نسكافيه 3 في 1 كلاسيك باكيت", barcode: "62320003", categoryId: getCat("مشروبات ساخنة").id, priceType: "unit", price: 4.0, costPrice: 3.2, stock: 500, minStock: 100, unit: "piece" },
      { name: "نسكافيه جولد لاتيه باكيت", barcode: "62320004", categoryId: getCat("مشروبات ساخنة").id, priceType: "unit", price: 10.0, costPrice: 8.0, stock: 300, minStock: 50, unit: "piece" },
      { name: "كابتشينو بونجورنو", barcode: "62320005", categoryId: getCat("مشروبات ساخنة").id, priceType: "unit", price: 5.0, costPrice: 4.0, stock: 200, minStock: 40, unit: "piece" },
      { name: "بن عبد المعبود محوج 100 جم", barcode: "62320006", categoryId: getCat("مشروبات ساخنة").id, priceType: "unit", price: 45.0, costPrice: 38.0, stock: 80, minStock: 15, unit: "pack" },
      { name: "سحلب حلو الشام 250 جم", barcode: "62320007", categoryId: getCat("مشروبات ساخنة").id, priceType: "unit", price: 35.0, costPrice: 28.0, stock: 50, minStock: 10, unit: "pack" },
      { name: "كاكاو كورونا 250 جم", barcode: "62320008", categoryId: getCat("مشروبات ساخنة").id, priceType: "unit", price: 40.0, costPrice: 32.0, stock: 60, minStock: 10, unit: "pack" },
    ],
  });

  // Default admin user
  await prisma.user.create({
    data: {
      username: "admin",
      password: "admin123",
      role: "admin",
      name: "المدير",
    },
  });

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });