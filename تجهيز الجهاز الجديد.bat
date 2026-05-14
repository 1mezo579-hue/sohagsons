@echo off
chcp 65001 >nul
title تجهيز الجهاز الجديد - ماركت أبناء سوهاج
echo.
echo  =============================================
echo    خطوات تجهيز جهاز المحل الجديد
echo  =============================================
echo.

cd /d "%~dp0"

echo [1/5] التحقق من Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js غير مثبت! يرجى تثبيته من:
    echo    https://nodejs.org (اختر LTS)
    pause
    exit /b 1
)
echo ✅ Node.js موجود

echo.
echo [2/5] تثبيت المكتبات...
npm install
if %errorlevel% neq 0 (
    echo ❌ فشل تثبيت المكتبات - تأكد من الاتصال بالإنترنت
    pause
    exit /b 1
)
echo ✅ تم تثبيت المكتبات

echo.
echo [3/5] إعداد قاعدة البيانات...
npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ فشل إعداد قاعدة البيانات
    pause
    exit /b 1
)
echo ✅ تم إعداد قاعدة البيانات

echo.
echo [4/5] بناء النسخة المحمية (قد يأخذ 2-3 دقائق)...
npx next build
if %errorlevel% neq 0 (
    echo ❌ فشل البناء - راجع الأخطاء
    pause
    exit /b 1
)
echo ✅ تم البناء بنجاح

echo.
echo [5/5] تشغيل النظام...
echo.
echo  ╔═══════════════════════════════════╗
echo  ║  ✅ النظام جاهز للاستخدام        ║
echo  ║  افتح المتصفح على:               ║
echo  ║  http://localhost:3000            ║
echo  ╚═══════════════════════════════════╝
echo.
npx next start -p 3000

pause
