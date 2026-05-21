@echo off
chcp 65001 >nul
title تحديث أبناء سوهاج أونلاين
color 0A

echo ============================================
echo    جاري تحديث النسخة على GitHub وفيرسيل...
echo ============================================
echo.

:: 1. Switch to Postgres
echo [1/4] تحويل النظام للوضع السحابي...
call node switch-db.js postgresql

:: 2. Push to Git
echo [2/4] رفع التعديلات على السحابة...
git add .
git commit -m "Update from local shop machine: %date% %time%"
git push origin main --force

:: 3. Switch back to SQLite
echo [3/4] إعادة النظام لوضع الأوفلاين المحلي...
call node switch-db.js sqlite

echo [4/4] تنظيف الملفات المؤقتة...
call npx prisma generate >nul 2>&1

echo.
echo ✅ تم تحديث النسخة الأونلاين بنجاح!
echo النسخة الآن تعمل أوفلاين على هذا الجهاز كالمعتاد.
echo.
pause
