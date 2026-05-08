@echo off
chcp 65001 >nul
echo ============================================
echo    أبناء سوهاج - نظام الكاشير
echo    سكربت الإعداد والتشغيل
echo ============================================
echo.

REM Check if Node.js is installed
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js غير مثبت!
    echo         حمله من: https://nodejs.org
    pause
    exit /b 1
)

echo [✓] Node.js موجود: 
node -v
echo.

REM Step 1: Clean old installations
echo [1/6] تنظيف التثبيتات القديمة...
if exist "node_modules" (
    echo       حذف node_modules...
    rmdir /s /q "node_modules" 2>nul
    timeout /t 1 >nul
)
if exist "package-lock.json" (
    echo       حذف package-lock.json...
    del /f /q package-lock.json 2>nul
)
npm cache clean --force >nul 2>&1
echo       تم التنظيف.
echo.

REM Step 2: Install dependencies
echo [2/6] تثبيت الحزم (قد يستغرق 3-5 دقائق)...
npm install --legacy-peer-deps
if errorlevel 1 (
    echo [ERROR] فشل تثبيت الحزم!
    echo         جاري المحاولة بطريقة بديلة...
    npm install --legacy-peer-deps --no-optional
    if errorlevel 1 (
        echo [ERROR] فشل التثبيت تماماً.
        echo         تأكد من اتصال الإنترنت وحاول مرة أخرى.
        pause
        exit /b 1
    )
)
echo       تم تثبيت الحزم بنجاح.
echo.

REM Step 3: Generate Prisma client
echo [3/6] إعداد Prisma...
npx prisma generate
if errorlevel 1 (
    echo [ERROR] فشل إعداد Prisma!
    pause
    exit /b 1
)
echo       تم إعداد Prisma.
echo.

REM Step 4: Push database schema
echo [4/6] إنشاء قاعدة البيانات...
npx prisma db push --accept-data-loss
if errorlevel 1 (
    echo [ERROR] فشل إنشاء قاعدة البيانات!
    pause
    exit /b 1
)
echo       تم إنشاء قاعدة البيانات.
echo.

REM Step 5: Seed data
echo [5/6] إضافة البيانات التجريبية...
npx tsx prisma/seed.ts
if errorlevel 1 (
    echo [WARNING] فشل إضافة البيانات التجريبية.
    echo           يمكنك تخطي هذه الخطوة والإضافة يدوياً.
) else (
    echo       تم إضافة البيانات التجريبية.
)
echo.

REM Step 6: Start development server
echo [6/6] تشغيل السيرفر...
echo.
echo ============================================
echo    ✅ النظام جاهز!
echo.
echo    افتح المتصفح على:
echo    http://localhost:3000
echo.
echo    بيانات الدخول الافتراضية:
echo    المستخدم: admin
echo    كلمة المرور: admin123
echo.
echo    اضغط Ctrl+C لإيقاف السيرفر
echo ============================================
echo.

npm run dev
