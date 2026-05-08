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

:: 2. Install Dependencies
echo [1/2] جاري تثبيت المكتبات (قد يستغرق دقائق)...
call npm install --legacy-peer-deps

:: 3. Generate Database Client
echo [2/2] جاري تجهيز الربط السحابي...
call npx prisma generate

echo.
echo ============================================
echo    ✅ تم تجهيز النظام بنجاح!
echo    الجهاز الآن مربوط بقاعدة البيانات السحابية.
echo    يمكنك الآن تشغيل "ابدأ البرنامج.vbs"
echo ============================================
echo.
pause
