# ONBOARDING

ملف تعريفي سريع لإعداد وتشغيل مشروع نظام نقاط البيع (Supermarket POS)

1) وصف موجز للمشروع

مشروع "supermarket-pos-system" هو نظام كاشير متكامل لإدارة مبيعات سوبرماركت، مبني باستخدام تقنيات Node.js وNext.js وTypeScript مع Prisma لإدارة قاعدة البيانات وTailwindCSS للواجهات. يدعم المشروع تشغيلًا محليًا للتطوير وبنية قابلة للنشر على بيئة إنتاج.

2) تعليمات إعداد بيئة التطوير محليًا (خطوة بخطوة)

ملاحظة: الأوامر مكتوبة لنظام Windows (PowerShell أو CMD). افترض أن مسار المشروع هو: D:\supermarket-pos-system

أ. تثبيت أدوات النظام الأساسية
- ثبت Node.js (موصى به v16+ أو مطابق لـ engines في package.json):
  (اذهب إلى https://nodejs.org وحمل المثبّت أو استخدم nvm)

ب. استنساخ/الوصول إلى المشروع
- افتح PowerShell ثم:
  cd D:\supermarket-pos-system

ج. تثبيت التبعيات (باستخدام التعليمات المكتشفة مسبقًا)
- لتثبيت الحزم كما في package-lock.json:
  cd D:\supermarket-pos-system && npm ci

- إذا لم يتوفر package-lock.json أو تريد تثبيت عادي:
  cd D:\supermarket-pos-system && npm install

د. إعداد Prisma (إن وُجدت)
- إذا استخدم المشروع Prisma، شغّل:
  cd D:\supermarket-pos-system && npx prisma generate
- إذا كان هناك أوامر postinstall معرفة في package.json فشغّل:
  cd D:\supermarket-pos-system && npm run postinstall
- للتأكد من أن قاعدة البيانات متوافقة (يتطلب DATABASE_URL أو SQLite محلي):
  cd D:\supermarket-pos-system && npm run db:push

هـ. إعداد متغيرات البيئة
- انسخ ملف المثال إذا كان متوفراً:
  cd D:\supermarket-pos-system
  copy .env.example .env
- عدّل D:\supermarket-pos-system\.env لإضافة DATABASE_URL أو إعدادات أخرى (انظر README.md)

3) أوامر لتشغيل التطبيق محليًا

- خادم التطوير (مع hot-reload):
  cd D:\supermarket-pos-system && npm run dev

- تشغيل بعد البناء (بيئة إنتاج محلية):
  cd D:\supermarket-pos-system && npm run build
  cd D:\supermarket-pos-system && npm start

- أوامر مساعدة متعلقة بقاعدة البيانات/أدوات Prisma:
  cd D:\supermarket-pos-system && npm run db:studio  # فتح Prisma Studio (إن وُجد)

- ملاحظات خاصة بنظام هذه الحزمة: توجد ملفات تشغيل وأدوات مساعدة محلية مثل "ابدأ البرنامج.vbs" أو ملفات BAT مذكورة في README لنسخ احتياطي أو تشغيل أوفلاين. راجع D:\supermarket-pos-system\README.md

4) أوامر لتشغيل الاختبارات (إن وُجدت)

- تحقق أولاً من تعريف السكربت في package.json تحت الحقل "scripts": إذا كان هناك اختبارات فالأوامر الشائعة:
  cd D:\supermarket-pos-system && npm test
  cd D:\supermarket-pos-system && npm run test

- إن كانت هناك إعدادات خاصة (Jest, Vitest, Playwright) اتبع التعليمات في package.json أو ملف README

5) أهم الملفات والمجلدات وشرح مختصر لوظيفتها

- D:\supermarket-pos-system\package.json
  يحتوي تعريف الحزم، السكربتات (scripts)، واعتمادات المشروع.

- D:\supermarket-pos-system\package-lock.json
  قفل نسخ الحزم (إن وُجد) ويستخدم مع npm ci

- D:\supermarket-pos-system\tsconfig.json
  إعدادات TypeScript

- D:\supermarket-pos-system\next.config.js (أو next.config.mjs)
  إعدادات Next.js الخاصة بالمشروع

- D:\supermarket-pos-system\prisma\
  ملفات Prisma schema ومخططات (schema.prisma) وسكربتات الهجرة

- D:\supermarket-pos-system\src\ أو D:\supermarket-pos-system\pages\
  شفرة التطبيق الأمامية/الواجهات (اعتمادًا على بنية المشروع - Next.js قد يستخدم "pages" أو "app" أو "src")

- D:\supermarket-pos-system\public\
  أصول عامة مثل صور، أيقونات، وخطوط يتم تقديمها مباشرة

- D:\supermarket-pos-system\.env
  متغيرات البيئة المحلية (قاعدة البيانات، مفاتيح API)

- D:\supermarket-pos-system\.next\
  مجلد بناء Next.js المؤقت (ينشأ بعد التشغيل أو البناء)

- D:\supermarket-pos-system\node_modules\
  مجلد التبعيات المحلي (لا تُرفع للمخزن)

- D:\supermarket-pos-system\README.md
  توثيق المشروع الموجود (اقرأه للخطوات الخاصة)

- ملفات تشغيل محلية: "ابدأ البرنامج.vbs", "إغلاق البرنامج.vbs", *.bat
  أدوات تشغيل مخصصة لنظام التشغيل المحلي لهذا المشروع (مذكورة في README)

6) خمس مهام تشغيلية أو تحسينات مقترحة بعد الإعداد الأولي

1. تشغيل واختبار سيناريوهات نقاط البيع الأساسية: تسجيل مبيعات، طباعة فاتورة، وفحص عملية الإرجاع.
2. إعداد وتهيئة بيئة النسخ الاحتياطي لقاعدة البيانات (نسخ SQLite أو إعداد اتصال بـ PostgreSQL) وتأمين متغيرات البيئة.
3. تهيئة CI/CD مبسطة: إضافة ملف GitHub Actions أو Azure Pipelines لبناء الاختبارات والنشر الآلي.
4. تحسين واجهة المستخدم: مراجعة استايلات TailwindCSS وأداء صفحات Next.js وتقليل حجم الباندل.
5. كتابة اختبارات وحدية/تكاملية أساسية (Jest/Vitest + Testing Library) لتغطية وظائف الدفع وإدارة المخزون.

---

معلومات التسليم:
الملف تم إنشاؤه وحفظه في: D:\supermarket-pos-system\ONBOARDING.md

