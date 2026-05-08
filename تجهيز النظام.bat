@echo off
chcp 65001 >nul
title تجهيز نظام أبناء سوهاج - الجهاز الجديد
color 0B

echo ============================================
echo    أبناء سوهاج - إعداد النظام للجهاز الجديد
echo ============================================
echo.

:: 1. Check for Node.js
node -v >nul 2>&1
if errorlevel 1 (
    echo [❌] خطأ: Node.js غير مثبت على هذا الجهاز!
    echo يرجى تحميل وتثبيت Node.js من الموقع: https://nodejs.org
    echo ثم أعد تشغيل هذا الملف مرة أخرى.
    echo.
    pause
    exit /b
)

echo [✅] تم العثور على Node.js
echo.

:: 2. Install Dependencies (if node_modules is missing)
if not exist "node_modules" (
    echo [1/3] جاري تثبيت المكتبات (أول مرة فقط)...
    call npm install --legacy-peer-deps
) else (
    echo [✅] المكتبات مثبتة بالفعل.
)

:: 3. Setup Database
echo [2/3] جاري تجهيز قاعدة البيانات المحلية...
call npx prisma generate
call npx prisma db push --accept-data-loss

:: 4. Seed Data
echo [3/3] جاري تحميل بيانات المنتجات والمستخدمين...
call npx tsx prisma/seed.ts

echo.
echo ============================================
echo    ✅ تم تجهيز النظام بنجاح!
echo    يمكنك الآن تشغيل "ابدأ النظام.bat"
echo ============================================
echo.
pause
