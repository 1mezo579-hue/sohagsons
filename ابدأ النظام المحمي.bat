@echo off
chcp 65001 >nul
title جاري البناء - ماركت أبناء سوهاج
echo.
echo  ================================
echo    بناء نسخة الإنتاج المحمية
echo  ================================
echo.

cd /d "%~dp0"

echo [1/4] تحديث قاعدة البيانات...
npx prisma db push --skip-generate
if %errorlevel% neq 0 (
    echo خطأ في قاعدة البيانات - تأكد من الاتصال بالإنترنت
    pause
    exit /b 1
)

echo [2/4] توليد Prisma Client...
npx prisma generate
if %errorlevel% neq 0 (
    echo خطأ في توليد Prisma - حاول مرة أخرى
    pause
    exit /b 1
)

echo [3/4] بناء النسخة المحمية...
npx next build
if %errorlevel% neq 0 (
    echo فشل البناء - راجع الأخطاء أعلاه
    pause
    exit /b 1
)

echo [4/4] تشغيل النظام في وضع الإنتاج...
echo.
echo  ✅ تم البناء بنجاح!
echo  النظام يعمل على: http://localhost:3000
echo.
npx next start -p 3000
pause
