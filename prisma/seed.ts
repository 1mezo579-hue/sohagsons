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
  const categoriesData = [
    {
      name: "ألبان وأجبان",
      products: [
        { name: "لبن جهينة كامل الدسم 1 لتر", costPrice: 35, price: 40 },
        { name: "لبن جهينة خالي الدسم 1 لتر", costPrice: 35, price: 40 },
        { name: "لبن المراعي 1 لتر", costPrice: 36, price: 42 },
        { name: "لبن بخيره نصف لتر", costPrice: 18, price: 22 },
        { name: "زبادي جهينة طبيعي", costPrice: 5, price: 7 },
        { name: "زبادي المراعي فواكه", costPrice: 6, price: 8 },
        { name: "زبادي دانون لايت", costPrice: 6, price: 8 },
        { name: "جبنة دومتي فيتا 500 جم", costPrice: 30, price: 35 },
        { name: "جبنة عبور لاند تتراباك 250 جم", costPrice: 15, price: 18 },
        { name: "جبنة بريزيدون مثلثات 8 قطع", costPrice: 20, price: 25 },
        { name: "جبنة كيري مربعات 6 قطع", costPrice: 25, price: 30 },
        { name: "جبنة رومي قديم (وزن)", costPrice: 200, price: 240, priceType: "weight", unit: "kg" },
        { name: "جبنة فلامنك (وزن)", costPrice: 250, price: 300, priceType: "weight", unit: "kg" },
        { name: "جبنة شيدر مستورد (وزن)", costPrice: 180, price: 220, priceType: "weight", unit: "kg" },
        { name: "قشطة بلدي (وزن)", costPrice: 150, price: 180, priceType: "weight", unit: "kg" },
        { name: "زبدة فيرن 1 كجم", costPrice: 85, price: 100 },
        { name: "زبدة لورباك 400 جم", costPrice: 110, price: 135 },
      ]
    },
    {
      name: "مشروبات غازية وعصائر",
      products: [
        { name: "كوكاكولا 1 لتر", costPrice: 12, price: 15 },
        { name: "بيبسي 1 لتر", costPrice: 12, price: 15 },
        { name: "سبرايت 1 لتر", costPrice: 12, price: 15 },
        { name: "شويبس رمان كانز", costPrice: 8, price: 10 },
        { name: "ريد بول مشروب طاقة", costPrice: 30, price: 40 },
        { name: "عصير جهينة مانجو 1 لتر", costPrice: 20, price: 25 },
        { name: "عصير بيتي برتقال 1 لتر", costPrice: 18, price: 22 },
        { name: "عصير لمار تفاح 1 لتر", costPrice: 22, price: 28 },
        { name: "مياه صافي 1.5 لتر", costPrice: 4, price: 6 },
        { name: "مياه نستله 600 مل", costPrice: 3, price: 5 },
        { name: "مياه دساني جالون", costPrice: 40, price: 55 },
      ]
    },
    {
      name: "شيبسي وسناكس",
      products: [
        { name: "شيبسي طماطم عائلي", costPrice: 8, price: 10 },
        { name: "شيبسي جبنة متبلة عائلي", costPrice: 8, price: 10 },
        { name: "دوريتوس جبنة ناتشو", costPrice: 8, price: 10 },
        { name: "شيتوس كرانشي", costPrice: 4, price: 5 },
        { name: "صن بايتس زيتون", costPrice: 4, price: 5 },
        { name: "تايجر شطة وليمون", costPrice: 4, price: 5 },
        { name: "ويندوز جبنة", costPrice: 4, price: 5 },
        { name: "بيك رولز بيتزا", costPrice: 4, price: 5 },
        { name: "فشار كراميل (بطل)", costPrice: 8, price: 10 },
      ]
    },
    {
      name: "مخبوزات وبسكويت",
      products: [
        { name: "مولتو شوكولاتة ماجنم", costPrice: 8, price: 10 },
        { name: "تودو براونيز", costPrice: 4, price: 5 },
        { name: "هوهوز", costPrice: 4, price: 5 },
        { name: "توينكيز", costPrice: 4, price: 5 },
        { name: "بسكويت داتو", costPrice: 4, price: 5 },
        { name: "بسكويت لمبادا", costPrice: 2.5, price: 3 },
        { name: "بسكويت أوريو 4 قطع", costPrice: 4, price: 5 },
        { name: "بسكويت بيمبو", costPrice: 4, price: 5 },
        { name: "ويفر فريسكا", costPrice: 2.5, price: 3 },
        { name: "عيش فينو (كيس 5 رغيف)", costPrice: 8, price: 10 },
        { name: "عيش توست ريتش بيك", costPrice: 35, price: 45 },
      ]
    },
    {
      name: "شوكولاتة وحلويات",
      products: [
        { name: "شوكولاتة كادبوري سادة", costPrice: 15, price: 20 },
        { name: "شوكولاتة جلاكسي بندق", costPrice: 18, price: 25 },
        { name: "شوكولاتة سنيكرز", costPrice: 12, price: 15 },
        { name: "شوكولاتة كيت كات 4 أصابع", costPrice: 12, price: 15 },
        { name: "شوكولاتة باونتي", costPrice: 12, price: 15 },
        { name: "شوكولاتة مورو", costPrice: 8, price: 10 },
        { name: "بونبون سيلا الميزان (وزن)", costPrice: 80, price: 100, priceType: "weight", unit: "kg" },
        { name: "ملبس طوفي (وزن)", costPrice: 60, price: 80, priceType: "weight", unit: "kg" },
        { name: "جيلي كولا هاريبو", costPrice: 25, price: 35 },
      ]
    },
    {
      name: "شاي وقهوة ومشروبات ساخنة",
      products: [
        { name: "شاي ليبتون 250 جم", costPrice: 35, price: 42 },
        { name: "شاي العروسة 250 جم", costPrice: 30, price: 35 },
        { name: "شاي أحمد تي فتلة 100 فتلة", costPrice: 80, price: 95 },
        { name: "نسكافيه كلاسيك 50 جم", costPrice: 45, price: 55 },
        { name: "نسكافيه جولد 100 جم", costPrice: 120, price: 150 },
        { name: "بن عبد المعبود محوج 200 جم", costPrice: 50, price: 60 },
        { name: "بن أبو عوف سادة 250 جم", costPrice: 60, price: 75 },
        { name: "كاكاو كورونا", costPrice: 25, price: 30 },
        { name: "سحلب حلو الشام", costPrice: 20, price: 25 },
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
        { name: "مسحوق إريال أوتوماتيك 2.5 كجم", costPrice: 140, price: 165 },
        { name: "مسحوق برسيل أوتوماتيك 3 كجم", costPrice: 130, price: 155 },
        { name: "مسحوق تايْد يدوي 500 جم", costPrice: 20, price: 25 },
        { name: "مسحوق أوكسي 2 كجم", costPrice: 90, price: 110 },
        { name: "صابون سائل بريل 1 لتر", costPrice: 30, price: 38 },
        { name: "صابون سائل فيري 1 لتر", costPrice: 35, price: 45 },
        { name: "صابون سائل فيبا 2 لتر", costPrice: 40, price: 50 },
        { name: "منظف زجاج جليد", costPrice: 25, price: 32 },
        { name: "منظف تواليت هاربيك", costPrice: 35, price: 45 },
        { name: "كلوروكس ألوان 1 لتر", costPrice: 22, price: 28 },
        { name: "كلور أبيض زجاجة", costPrice: 10, price: 15 },
        { name: "ديتول مطهر 500 مل", costPrice: 85, price: 110 },
        { name: "معطر جو فريدا", costPrice: 45, price: 55 },
        { name: "مناديل فاين 550 منديل (3 قطع)", costPrice: 50, price: 65 },
        { name: "مناديل زينة تواليت (بكرة)", costPrice: 5, price: 8 },
        { name: "ورق فويل سانيتا", costPrice: 40, price: 50 },
        { name: "أكياس قمامة كبيرة", costPrice: 25, price: 35 },
        { name: "سلك مواعين (وزن)", costPrice: 40, price: 60, priceType: "weight", unit: "kg" },
        { name: "ليفة غسيل أطباق", costPrice: 10, price: 15 },
      ]
    },
    {
      name: "عناية شخصية وصابون",
      products: [
        { name: "شامبو صانسيلك 400 مل", costPrice: 55, price: 70 },
        { name: "شامبو كلير للرجال 400 مل", costPrice: 65, price: 80 },
        { name: "شامبو بانتين 400 مل", costPrice: 60, price: 75 },
        { name: "صابون لوكس 120 جم", costPrice: 12, price: 15 },
        { name: "صابون دوف 100 جم", costPrice: 25, price: 35 },
        { name: "صابون كامي 120 جم", costPrice: 10, price: 13 },
        { name: "صابون ديتول 120 جم", costPrice: 15, price: 20 },
        { name: "معجون أسنان سيجنال 100 مل", costPrice: 25, price: 35 },
        { name: "معجون أسنان كولجيت 100 مل", costPrice: 30, price: 40 },
        { name: "فرشاة أسنان أورال بي", costPrice: 25, price: 35 },
        { name: "شفرات حلاقة جيليت بلو 3", costPrice: 35, price: 45 },
        { name: "فوط صحية أولويز الترا", costPrice: 30, price: 40 },
        { name: "حفاضات بامبرز مقاس 4", costPrice: 200, price: 250 },
        { name: "حفاضات بيبي جوي مقاس 4", costPrice: 180, price: 220 },
      ]
    }
  ];

  let barcodeCounter = 622100000;

  for (const cData of categoriesData) {
    const category = await prisma.category.upsert({
      where: { name: cData.name },
      update: {},
      create: { name: cData.name },
    });

    for (const pData of cData.products) {
      const exists = await prisma.product.findFirst({ where: { name: pData.name } });
      if (!exists) {
        await prisma.product.create({
          data: {
            ...pData,
            barcode: (barcodeCounter++).toString(),
            categoryId: category.id,
            stock: Math.floor(Math.random() * 50) + 10, // رصيد افتراضي عشوائي
          },
        });
      }
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