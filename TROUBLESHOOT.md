# دليل حل المشاكل

## مشكلة: npm install فشل

### الحل 1: امسح وثبت من جديد
```bash
rmdir /s /q node_modules
del package-lock.json
npm cache clean --force
npm install --legacy-peer-deps
```

### الحل 2: استخدم yarn بدلاً من npm
```bash
npm install -g yarn
yarn install
```

### الحل 3: غيّر registry
```bash
npm config set registry https://registry.npmjs.org/
npm install --legacy-peer-deps
```

## مشكلة: Prisma فشل

```bash
npx prisma generate
npx prisma db push --accept-data-loss
```

## مشكلة: السيرفر ما يشتغل

### تأكد إن مافي سيرفر شغال على نفس البورت
```bash
# شوف البورتات المستخدمة
netstat -ano | findstr :3000

# اقتل العملية لو لزم
npx kill-port 3000
```

### شغل السيرفر على بورت مختلف
```bash
npm run dev -- --port 3001
```

## مشكلة: البيانات التجريبية ما ظهرت

```bash
npx tsx prisma/seed.ts
# أو
npx prisma studio
# واضف البيانات يدوياً
```

## مشكلة: الباركود ما يشتغل

- تأكد إن السكانر متصل USB
- اضغط F2 عشان تركز على خانة الباركود
- جرب تكتب الباركود يدوياً واضغط Enter

## للتواصل والدعم

لو واجهتك أي مشكلة، ارسل:
1. صورة للخطأ
2. نسخ من الـ Terminal
3. إصدار Node.js: `node -v`
