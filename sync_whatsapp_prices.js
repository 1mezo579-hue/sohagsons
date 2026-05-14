const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const whatsappData = `
جبنه قديمه ١٨٠
صوفي طويل وطويل جدا ٥٠
صوفي طويل جدا جدا ٥٥
الوز طويل جدا دوبل ٦٠
الوز طويل جدا وطويل فردي ٤٠
سندريلا ٢٧
مناديل ٢بكره مضغوط ٢٥
ملح نور علب ب ١٠
اريال اتوماتيك ٦٥
حلواني البركه ٢٥٠
لانشون فراخ ١٨٠
لانشون البركه ١٢٠
لانشون الطيار البركه١٠٠
بيبفي بسطرمه ١٨٠
بيبفي البركه ساده ١٦٠
فول مدشوش ٤٤
فلارس ٨٠
دقيق ذره ٣٠
لب عصافير ٤٠
ذره عويجه ٢٤
١٠بيض احمر وبلدي ٤٥
فجيتار كريسبي كنور 43
مرقه كنور كبير 18
تونه صن شاين قطعه واحده 70
تونه صن شاين قطع 65
تونه صن شاين مفتت 45
تونه اكسبريس قطع 50
تونه اكسبريس مفتت 35
برجر حلواني 125
برجر اطياب 180
طحينه البوادي صغير 33
طحينه البوادي كبيره 55
عسل البوادي 26
شاي ليبتون خرز 75
سمنه جنه نيوزلندي ٩٥
اوكسي سائل ٣٥٠ جرام ٢٠
ذبادي بلبن صغير ٨.٥ 
ذبادي بلبن كبير ١٢
رز بلبن ١٧
البسطرمه 640
بريل سايب 14
كلور 7
ديتول 22
داوني 22
صابون اصفر 10
برسيل جيل عادي 24
برسيل جيل اتو ماتيك 30
شاور 30
معطرات 35
بن فكاكس ٦٥
زيت حلوه كبير ١٩٠
رز الساعة ٤٠
زيت سلايت ٧٥
موتزريلا نباتي ١٨٠
موتزريلا طبيعي ٢٢٠
ماكريل ٤٢
بلوبيف اكستير ١٣٠
رز الامل 320
لبن ليمار ٤٧
مكرونه سايبه ٢٥
بخيره نص ٢٤
سمنه كرستال كيلو ونص ١٨٥
جينرال 45
صابون سافانا 17
مسحوق فل عادي 27
بامبرز مقاس 3 ب 380
داوني ازايز لتر 100
مولفيكس 4 شورت 350
مولفيكس 5 شورت 400
مناديل بابيا 6 بكره 65
اريال جيل اتوماتيك 2.35 ب 220
تايد اتوماتيك 60
كلوركس اللوان لتر 70 
سيترس 100
مناديل زينه سحب 28
مناديل زينه حمام 2 بكره 22
مناديل حمام زينه 6 بكره 60
مناديل وايت سحب 28
فيبا 4 لتر 125
بليدج ملمع موبيليا 70
اوكسي 2 كيلو 125
اوكسي كيلو 70
اوكس نص كيلو 40
بريل 600 ب 35
كلوركس ابيض 30
مناديل مطبخ 6 بكره 70
اوكسي 600 ب 33
مولفيكس 6 شورت 345
`;

async function sync() {
  console.log('--- بدء مزامنة أسعار الواتساب الحقيقية ---');
  const lines = whatsappData.trim().split('\n');
  
  let cat = await prisma.category.findFirst({ where: { name: 'عام' } });
  if (!cat) cat = await prisma.category.create({ data: { name: 'عام' } });

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Extract price (last number in line)
    const match = line.match(/(\d+(\.\d+)?)$/);
    if (!match) continue;

    const price = parseFloat(match[1]);
    const name = line.replace(match[1], '').trim().replace(/ب$/, '').trim();

    // Try to find existing product
    const existing = await prisma.product.findFirst({
      where: { name: { contains: name } }
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { price: price, costPrice: price * 0.85, synced: false }
      });
      console.log(`✓ تم تحديث: ${name} -> ${price} ج`);
    } else {
      // Create new product with a generated barcode
      const barcode = '622' + Math.floor(Math.random() * 1000000000).toString().padStart(10, '0');
      await prisma.product.create({
        data: {
          name: name,
          barcode: barcode,
          price: price,
          costPrice: price * 0.85,
          categoryId: cat.id,
          priceType: 'unit',
          unit: 'piece',
          stock: 50,
          synced: false
        }
      });
      console.log(`+ تم إضافة جديد: ${name} (باركويد: ${barcode}) -> ${price} ج`);
    }
  }
  console.log('--- تمت المزامنة بنجاح ---');
}

sync().catch(e => console.error(e));
