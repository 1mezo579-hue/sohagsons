import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 1. Users
  const hashedPassword = await bcrypt.hash("102030", 10);
  const managerPassword = await bcrypt.hash("tech123", 10);
  const cashierPassword = await bcrypt.hash("sales123", 10);

  const users = [
    { username: "admin", password: hashedPassword, role: "admin", name: "محمد حمدى (Owner)" },
    { username: "manager", password: managerPassword, role: "manager", name: "المدير العام" },
    { username: "cashier1", password: cashierPassword, role: "cashier", name: "كاشير 1" },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: { name: u.name },
      create: u,
    });
  }

  // 2. Traders (Suppliers)
  const traders = [
    { name: "مندوب جهينة", company: "Juhayna", phone: "01000000001", balance: 0 },
    { name: "مندوب المراعي / بيتي", company: "Almarai", phone: "01000000002", balance: 0 },
    { name: "مندوب شيبسي", company: "Chipsy Egypt", phone: "01000000003", balance: 0 },
    { name: "مندوب كوكاكولا", company: "Coca-Cola", phone: "01000000004", balance: 0 },
    { name: "مندوب بيبسي", company: "PepsiCo", phone: "01000000005", balance: 0 },
    { name: "مندوب نستله", company: "Nestle", phone: "01000000006", balance: 0 },
    { name: "مندوب إيديتا", company: "Edita (Molto/Todo)", phone: "01000000007", balance: 0 },
    { name: "مندوب يونيليفر", company: "Unilever (Lipton/Knorr)", phone: "01000000008", balance: 0 },
    { name: "مندوب بروكتر وجامبل", company: "P&G (Ariel/Tide)", phone: "01000000009", balance: 0 },
    { name: "مندوب فرج الله", company: "Faragalla", phone: "01000000010", balance: 0 },
    { name: "مندوب حلواني اخوان", company: "Halwani Bros", phone: "01000000011", balance: 0 },
    { name: "تاجر الجملة (عطارة وبقوليات)", company: "السوق المحلي", phone: "01000000012", balance: 0 },
  ];

  for (const t of traders) {
    const exists = await prisma.trader.findFirst({ where: { name: t.name } });
    if (!exists) {
      await prisma.trader.create({ data: t });
    }
  }

  // 3. Categories & Products
  // 0. Clean Existing Data (Order matters for Foreign Keys)
  console.log("Cleaning existing data...");
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.stockLog.deleteMany({});
  await prisma.traderInvoiceItem.deleteMany({});
  await prisma.traderInvoice.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.trader.deleteMany({});
  await prisma.customer.deleteMany({});

  const categoriesData = [
    {
      name: "ألبان وأجبان",
      products: [
        { name: "لبن جهينة كامل الدسم 1 لتر", costPrice: 42, price: 48, barcode: "6221000000169" },
        { name: "لبن المراعي كامل الدسم 1 لتر", costPrice: 42, price: 48, barcode: "6221001000251" },
        { name: "لبن بخيره نصف لتر", costPrice: 15.5, price: 18, barcode: "6221000000213" },
        { name: "زبادي جهينة طبيعي 105جم", costPrice: 6.75, price: 8, barcode: "6221000000114" },
        { name: "جبنة دومتي فيتا 500جم", costPrice: 36, price: 42, barcode: "6221000010212" },
        { name: "جبنة عبور لاند تتراباك 250جم", costPrice: 18.5, price: 22, barcode: "6221000020112" },
        { name: "جبنة رومي قديم (كجم)", costPrice: 240, price: 280, barcode: "PLU001", priceType: "weight", unit: "kg" },
      ]
    },
    {
      name: "مشروبات وكانز",
      products: [
        { name: "بيبسي كانز 330 مل", costPrice: 10.5, price: 12, barcode: "6221002000112" },
        { name: "كوكاكولا 1.5 لتر", costPrice: 21, price: 25, barcode: "6221003000212" },
        { name: "مياه معدنية صافي 1.5 لتر", costPrice: 5.5, price: 8, barcode: "6221004000111" },
        { name: "ريد بول كانز", costPrice: 42, price: 55, barcode: "9002490100070" },
      ]
    },
    {
      name: "زيوت وسمن وأرز",
      products: [
        { name: "زيت كريستال ذرة 800مل", costPrice: 95, price: 110, barcode: "6221005000113" },
        { name: "سمنة روابي 700جم", costPrice: 82, price: 95, barcode: "6221006000214" },
        { name: "أرز الضحى 1كجم", costPrice: 34, price: 40, barcode: "6221007000315" },
        { name: "مكرونة الملكة 400جم", costPrice: 12.5, price: 15, barcode: "6221008000416" },
      ]
    },

    {
      name: "مخبوزات وبسكويت",
      products: [
        { name: "مولتو شوكولاتة ماجنم", costPrice: 8.5, price: 10, barcode: "6223000100412" },
        { name: "تودو براونيز شوكولاتة", costPrice: 4.25, price: 5, barcode: "6223000101123" },
        { name: "بسكويت أوريو 6 قطع", costPrice: 6.5, price: 8, barcode: "7622210813083" },
        { name: "بسكويت بيمبو كبير", costPrice: 4.25, price: 5, barcode: "6223000102211" },
        { name: "ويفر فريسكا شوكولاتة", costPrice: 2.5, price: 3, barcode: "6224000140221" },
        { name: "عيش توست ريتش بيك", costPrice: 38, price: 45, barcode: "6223000105512" },
      ]
    },
    {
      name: "شوكولاتة وحلويات",
      products: [
        { name: "شوكولاتة كادبوري سادة 37جم", costPrice: 17, price: 20, barcode: "7622201420139" },
        { name: "شوكولاتة جلاكسي بالبندق", costPrice: 21, price: 25, barcode: "6221034001121" },
        { name: "شوكولاتة سنيكرز كبير", costPrice: 18, price: 22, barcode: "5000159461122" },
        { name: "جيلي كولا هاريبو 80جم", costPrice: 28, price: 35, barcode: "8691216016331" },
      ]
    },
    {
      name: "شاي وقهوة ومشروبات",
      products: [
        { name: "شاي ليبتون ناعم 250جم", costPrice: 42, price: 50, barcode: "6221000002121" },
        { name: "شاي العروسة ناعم 250جم", costPrice: 35, price: 40, barcode: "6221000003112" },
        { name: "نسكافيه بلاك 50جم", costPrice: 48, price: 55, barcode: "7613035311212" },
        { name: "بن عبد المعبود محوج 200جم", costPrice: 75, price: 90, barcode: "6221000004221" },
      ]
    },
    {
      name: "بقوليات وعطارة (وزن)",
      products: [
        { name: "أرز بلدي عريض (وزن)", costPrice: 25, price: 30, priceType: "weight", unit: "kg" },
        { name: "مكرونة حواء 400 جم", costPrice: 8, price: 10 },
        { name: "مكرونة الملكة 400 جم", costPrice: 8, price: 10 },
        { name: "مكرونة سايبة (وزن)", costPrice: 18, price: 22, priceType: "weight", unit: "kg" },
        { name: "سكر أبيض (وزن)", costPrice: 27, price: 35, priceType: "weight", unit: "kg" },
        { name: "دقيق أبيض (وزن)", costPrice: 18, price: 22, priceType: "weight", unit: "kg" },
        { name: "عدس أصفر (وزن)", costPrice: 45, price: 55, priceType: "weight", unit: "kg" },
        { name: "عدس بجبة (وزن)", costPrice: 40, price: 50, priceType: "weight", unit: "kg" },
        { name: "فول تدميس (وزن)", costPrice: 35, price: 45, priceType: "weight", unit: "kg" },
        { name: "لوبيا بلدي (وزن)", costPrice: 60, price: 80, priceType: "weight", unit: "kg" },
        { name: "فاصوليا بيضاء (وزن)", costPrice: 70, price: 90, priceType: "weight", unit: "kg" },
        { name: "كمون حصى/مطحون (وزن)", costPrice: 250, price: 300, priceType: "weight", unit: "kg" },
        { name: "فلفل أسود (وزن)", costPrice: 280, price: 350, priceType: "weight", unit: "kg" },
        { name: "كزبرة ناشفة (وزن)", costPrice: 100, price: 130, priceType: "weight", unit: "kg" },
        { name: "شطة حمراء (وزن)", costPrice: 120, price: 150, priceType: "weight", unit: "kg" },
      ]
    },
    {
      name: "زيوت وسمن",
      products: [
        { name: "زيت عافية ذرة 1 لتر", costPrice: 65, price: 75 },
        { name: "زيت كريستال عباد الشمس 1 لتر", costPrice: 60, price: 70 },
        { name: "زيت قلية خليط 1 لتر", costPrice: 45, price: 55 },
        { name: "سمنة روابي 1.5 كجم", costPrice: 110, price: 130 },
        { name: "سمنة جنة 1.5 كجم", costPrice: 110, price: 130 },
        { name: "سمنة الحلوب 800 جم", costPrice: 180, price: 220 },
        { name: "زيت زيتون وادي فود 500 مل", costPrice: 150, price: 180 },
      ]
    },
    {
      name: "معلبات وصلصة",
      products: [
        { name: "صلصة هاينز 360 جم", costPrice: 22, price: 28 },
        { name: "صلصة فاين فودز برطمان", costPrice: 18, price: 23 },
        { name: "تونا صن شاين قطع", costPrice: 35, price: 45 },
        { name: "تونا تونة دولفين مفتتة", costPrice: 20, price: 25 },
        { name: "فول أمريكانا سادة 400 جم", costPrice: 12, price: 15 },
        { name: "فول حدائق كاليفورنيا خلطة", costPrice: 15, price: 18 },
        { name: "ذرة حلوة معلبة", costPrice: 30, price: 40 },
        { name: "مشروم قطع معلب", costPrice: 35, price: 45 },
        { name: "حلاوة طحينية البوادي 500 جم", costPrice: 45, price: 55 },
        { name: "طحينة الرشيدي الميزان 250 جم", costPrice: 35, price: 45 },
        { name: "عسل أسود البوادي 700 جم", costPrice: 30, price: 40 },
        { name: "عسل نحل امتنان 500 جم", costPrice: 85, price: 110 },
        { name: "مربى فيتراك فراولة 380 جم", costPrice: 28, price: 35 },
      ]
    },
    {
      name: "لحوم ومجمدات",
      products: [
        { name: "برجر حلواني 8 قطع", costPrice: 70, price: 85 },
        { name: "هوت دوج فرج الله", costPrice: 50, price: 65 },
        { name: "بانيه أطياب عادي/حار 1 كجم", costPrice: 150, price: 180 },
        { name: "كفتة داوود باشا أمريكانا", costPrice: 80, price: 100 },
        { name: "بطاطس فارم فريتس 1 كجم", costPrice: 45, price: 55 },
        { name: "بسلة بالجزر مونتانا 400 جم", costPrice: 18, price: 22 },
        { name: "ملوخية بسمة 400 جم", costPrice: 15, price: 18 },
        { name: "بسطرمة (وزن)", costPrice: 350, price: 420, priceType: "weight", unit: "kg" },
        { name: "لانشون حلواني سادة (وزن)", costPrice: 140, price: 170, priceType: "weight", unit: "kg" },
        { name: "لانشون المراعي زيتون (وزن)", costPrice: 120, price: 150, priceType: "weight", unit: "kg" },
      ]
    },
    {
      name: "منظفات وعناية بالمنزل",
      products: [
        { name: "ديتول مطهر 125 مل", costPrice: 48, price: 55, barcode: "6221062010111" },
        { name: "ديتول مطهر 250 مل", costPrice: 82, price: 95, barcode: "6221062010128" },
        { name: "ديتول مطهر 500 مل", costPrice: 140, price: 165, barcode: "6221062010135" },
        { name: "ديتول مطهر 725 مل", costPrice: 185, price: 210, barcode: "6221062010142" },
        { name: "برسيل جيل لافندر 1 لتر", costPrice: 65, price: 75, barcode: "6221012101111" },
        { name: "برسيل جيل 2.5 لتر", costPrice: 155, price: 180, barcode: "6221012101128" },
        { name: "برسيل جيل 3.9 لتر", costPrice: 220, price: 260, barcode: "6221012101135" },
        { name: "إريال أوتوماتيك 2.5 كجم", costPrice: 160, price: 185, barcode: "6221013101111" },
        { name: "إريال أوتوماتيك 4 كجم", costPrice: 245, price: 280, barcode: "6221013101128" },
        { name: "إريال أوتوماتيك 6 كجم", costPrice: 360, price: 410, barcode: "6221013101135" },
        { name: "تايد أوتوماتيك 2.5 كجم", costPrice: 145, price: 170, barcode: "6221014101111" },
        { name: "أوكسي أوتوماتيك 3 كجم", costPrice: 135, price: 160, barcode: "6221015101111" },
        { name: "صابون سائل فيري 1 لتر", costPrice: 38, price: 45, barcode: "6221016101111" },
        { name: "صابون سائل فيبا 2 لتر", costPrice: 42, price: 50, barcode: "6221017101111" },
        { name: "كلوروكس ألوان 1 لتر", costPrice: 24, price: 30, barcode: "6221018101111" },
        { name: "مكنسة خشب (يد)", costPrice: 35, price: 45, barcode: "CLEAN001" },
        { name: "مكنسة ناعمة تركي", costPrice: 50, price: 65, barcode: "CLEAN002" },
        { name: "مساحة بلاستيك عريضة", costPrice: 28, price: 35, barcode: "CLEAN003" },
        { name: "مساحة جلد كبيرة", costPrice: 45, price: 55, barcode: "CLEAN004" },
        { name: "جاروف بلاستيك يد", costPrice: 15, price: 20, barcode: "CLEAN005" },
      ]
    },
    {
      name: "عناية شخصية وصابون",
      products: [
        { name: "ريكسونا سبراي رجالي 150 مل", costPrice: 155, price: 185, barcode: "6221019102111" },
        { name: "ريكسونا سبراي حريمي 150 مل", costPrice: 155, price: 185, barcode: "6221019102128" },
        { name: "ريكسونا رول أون 50 مل", costPrice: 90, price: 110, barcode: "6221019102135" },
        { name: "كريم فاتيكا شعر 140 جم", costPrice: 55, price: 65, barcode: "6221020102111" },
        { name: "كريم فاتيكا شعر 210 جم", costPrice: 72, price: 85, barcode: "6221020102128" },
        { name: "شامبو فاتيكا 400 مل", costPrice: 115, price: 135, barcode: "6221020102135" },
        { name: "شامبو فاتيكا 600 مل", costPrice: 150, price: 175, barcode: "6221020102142" },
        { name: "شامبو سباركل 400 مل", costPrice: 100, price: 120, barcode: "6221021102111" },
        { name: "شامبو سباركل 600 مل", costPrice: 130, price: 155, barcode: "6221021102128" },
        { name: "شامبو صانسيلك 400 مل", costPrice: 55, price: 70, barcode: "6221019101111" },
        { name: "شامبو صانسيلك 600 مل", costPrice: 85, price: 105, barcode: "6221019101128" },
        { name: "شامبو كلير للرجال 400 مل", costPrice: 65, price: 80, barcode: "6221020101111" },
        { name: "شامبو بانتين 400 مل", costPrice: 60, price: 75, barcode: "6221021101111" },
        { name: "شامبو بانتين 600 مل", costPrice: 95, price: 120, barcode: "6221021101128" },
        { name: "شامبو دوف 400 مل", costPrice: 70, price: 90, barcode: "6221022101111" },
        { name: "صابون لوكس 120 جم", costPrice: 12, price: 15, barcode: "6221023101111" },
        { name: "صابون دوف 100 جم", costPrice: 25, price: 35, barcode: "6221024101111" },
        { name: "صابون ديتول 120 جم", costPrice: 15, price: 20, barcode: "6221025101111" },
        { name: "معجون أسنان سيجنال 100 مل", costPrice: 28, price: 35, barcode: "6221026101111" },
        { name: "فرشاة أسنان أورال بي", costPrice: 25, price: 35, barcode: "6221027101111" },
        { name: "شفرات حلاقة جيليت بلو 3 (قطعة)", costPrice: 35, price: 45, barcode: "6221028101111" },
        { name: "حفاضات بامبرز مقاس 4 (عبوة)", costPrice: 220, price: 265, barcode: "6221029101111" },
      ]
    }
  ];

  let barcodeCounter = 622100000;

  for (const cData of categoriesData) {
    const category = await prisma.category.create({
      data: { name: cData.name },
    });

    for (const pData of cData.products) {
      await prisma.product.create({
        data: {
          ...pData,
          barcode: pData.barcode || (barcodeCounter++).toString(),
          categoryId: category.id,
          stock: Math.floor(Math.random() * 50) + 20,
        },
      });
    }
  }

  console.log("Seeding Database Completed Successfully! Added 12 Categories, 150+ Products, and 12 Traders.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });